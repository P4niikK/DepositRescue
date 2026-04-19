import { NextResponse } from "next/server";
import { pool, AUTHOR } from "@/lib/cockpit/db";
import { complete, parseJsonReply, MODEL_OPUS } from "@/lib/cockpit/claude";
import { EXPERT_SPECS, synthesizerSystem } from "@/lib/cockpit/experts";
import { decisionsBlock, appendDecision } from "@/lib/cockpit/decisions";
import { sessionDir } from "@/lib/cockpit/sandbox";
import type { ExpertId } from "@/lib/cockpit/data";

const ARTIFACT_HINT = `

ARCHIVOS (OPCIONAL)
-------------------
Tenés acceso a Write/Read/Glob/Grep dentro del directorio de esta sesión. Si tu respuesta produce un artefacto concreto (ej. borrador de demand letter, outline de un skill, plantilla) creá el archivo con Write y mencionalo al final con \`→ archivo: <nombre>\`. Sólo archivos cortos, markdown/texto. No uses paths absolutos, no crees subdirectorios.`.trim();

export const dynamic = "force-dynamic";
export const maxDuration = 120; // seconds, each expert + synthesis

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
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
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
  try {
    const body = await req.json();
    const prompt: string = body.prompt?.trim();
    const experts: ExpertId[] = Array.isArray(body.experts) ? body.experts : [];
    const synthesizeFlag: boolean = body.synthesize ?? true;

    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ error: "prompt too short" }, { status: 400 });
    }
    const validExperts = experts.filter((e): e is ExpertId => e in EXPERT_SPECS);
    if (validExperts.length < 1 || validExperts.length > 5) {
      return NextResponse.json({ error: "pick 1 to 5 experts" }, { status: 400 });
    }

    const { rows: initial } = await pool.query(
      `INSERT INTO agent_asks (author, prompt, experts, synthesize, status, data)
       VALUES ($1, $2, $3, $4, 'running', '{"answers":[]}'::jsonb)
       RETURNING id`,
      [AUTHOR, prompt, validExperts, synthesizeFlag]
    );
    const askId = initial[0].id as string;
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ask failed" },
      { status: 500 }
    );
  }
}
