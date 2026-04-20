import { NextResponse } from "next/server";
import { pool } from "@/lib/cockpit/db";
import { whoFromRequest } from "@/lib/cockpit/who";
import { complete, parseJsonReply, MODEL_OPUS } from "@/lib/cockpit/claude";
import { EXPERT_SPECS, synthesizerSystem } from "@/lib/cockpit/experts";
import { decisionsBlock, appendDecision } from "@/lib/cockpit/decisions";
import { sessionDir } from "@/lib/cockpit/sandbox";
import { postSynthesisToFeed } from "@/lib/cockpit/feed-hooks";
import type { ExpertId } from "@/lib/cockpit/data";

const ARTIFACT_HINT = `

ARCHIVOS (OPCIONAL)
-------------------
Tenés acceso a Write/Read/Glob/Grep dentro del directorio de esta sesión. Si tu respuesta produce un artefacto concreto (ej. borrador de demand letter, outline de un skill, plantilla) creá el archivo con Write y mencionalo al final con \`→ archivo: <nombre>\`. Sólo archivos cortos, markdown/texto. No uses paths absolutos, no crees subdirectorios.`.trim();

export const dynamic = "force-dynamic";
// Each expert can take up to ~120s; synthesis runs after. With up to 5 experts
// in parallel, plus synthesis, 120s is too tight. Bump to 300s.
export const maxDuration = 300;

function parseLimit(raw: string | null, def: number, max: number): number {
  const n = parseInt(raw || "", 10);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

type Answer = {
  expert: ExpertId;
  status: "done" | "error";
  content: string;
  ms: number;
};

async function runExpert(expertId: ExpertId, prompt: string, cwd: string): Promise<Answer> {
  const spec = EXPERT_SPECS[expertId];
  const started = Date.now();
  try {
    const content = await complete({
      system: spec.system + decisionsBlock() + `\n\n${ARTIFACT_HINT}`,
      user: prompt,
      model: MODEL_OPUS,
      cwd,
      allowWrite: true,
    });
    return { expert: expertId, status: "done", content, ms: Date.now() - started };
  } catch (e) {
    return {
      expert: expertId,
      status: "error",
      content: e instanceof Error ? e.message : "unknown error",
      ms: Date.now() - started,
    };
  }
}

async function synthesize(
  prompt: string,
  answers: Answer[],
  cwd: string
): Promise<{ headline: string; points: string[]; dissent: string } | null> {
  const body = [
    `PREGUNTA ORIGINAL:\n${prompt}`,
    "",
    "RESPUESTAS DE LOS EXPERTOS:",
    ...answers
      .filter((a) => a.status === "done")
      .map((a) => {
        const spec = EXPERT_SPECS[a.expert];
        return `\n--- ${spec.role} ---\n${a.content}`;
      }),
  ].join("\n");

  try {
    const raw = await complete({
      system: synthesizerSystem() + decisionsBlock(),
      user: body,
      model: MODEL_OPUS,
      cwd,
    });
    return parseJsonReply(raw);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get("limit"), 30, 100);
  try {
    const { rows } = await pool.query(
      `SELECT id, created_ts, updated_ts, author, prompt, experts, synthesize, status, data, pinned_commit
       FROM agent_asks ORDER BY created_ts DESC LIMIT $1`,
      [limit]
    );
    return NextResponse.json({ asks: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "query failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const expertsIn: unknown[] = Array.isArray(body.experts) ? body.experts : [];
  const synthesizeFlag: boolean =
    typeof body.synthesize === "boolean" ? body.synthesize : true;

  if (!prompt || prompt.length < 5) {
    return NextResponse.json({ error: "prompt too short" }, { status: 400 });
  }
  if (prompt.length > 20000) {
    return NextResponse.json({ error: "prompt too long" }, { status: 400 });
  }
  const validExperts = Array.from(
    new Set(
      expertsIn.filter((e): e is ExpertId => typeof e === "string" && e in EXPERT_SPECS)
    )
  );
  if (validExperts.length < 1 || validExperts.length > 5) {
    return NextResponse.json({ error: "pick 1 to 5 experts" }, { status: 400 });
  }

  let askId: string | null = null;
  try {
    const who = whoFromRequest(req);
    const { rows: initial } = await pool.query(
      `INSERT INTO agent_asks (author, prompt, experts, synthesize, status, data)
       VALUES ($1, $2, $3, $4, 'running', '{"answers":[]}'::jsonb)
       RETURNING id`,
      [who, prompt, validExperts, synthesizeFlag]
    );
    askId = initial[0].id as string;
    const cwd = sessionDir("ask", askId);

    const answers = await Promise.all(validExperts.map((e) => runExpert(e, prompt, cwd)));
    let synthesis = null;
    if (synthesizeFlag && answers.some((a) => a.status === "done")) {
      synthesis = await synthesize(prompt, answers, cwd);
      if (synthesis) {
        try {
          appendDecision({
            source: "ask",
            sourceId: askId,
            headline: synthesis.headline,
            dissent: synthesis.dissent || undefined,
          });
        } catch {
          // non-fatal
        }
        try {
          await postSynthesisToFeed({
            author: who,
            kind: "ask-synthesized",
            refId: askId,
            headline: synthesis.headline,
          });
        } catch {
          // feed hook is best-effort; do not fail the ask
        }
      }
    }

    const data = { answers, synthesis, error: null };
    const anyError = answers.every((a) => a.status === "error");
    const status = anyError ? "error" : "done";

    const { rows: finalRows } = await pool.query(
      `UPDATE agent_asks SET data = $1, status = $2, updated_ts = now()
       WHERE id = $3
       RETURNING id, created_ts, updated_ts, author, prompt, experts, synthesize, status, data`,
      [data, status, askId]
    );

    return NextResponse.json({ ask: finalRows[0] });
  } catch (e) {
    // If the row was created but the pipeline blew up, mark it as errored so
    // it doesn't stay "running" forever.
    if (askId !== null) {
      try {
        await pool.query(
          `UPDATE agent_asks
             SET status = 'error', updated_ts = now(),
                 data = jsonb_set(coalesce(data, '{}'::jsonb), '{error}', to_jsonb($1::text))
           WHERE id = $2`,
          [e instanceof Error ? e.message : "ask failed", askId]
        );
      } catch {
        // best effort
      }
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ask failed" },
      { status: 500 }
    );
  }
}
