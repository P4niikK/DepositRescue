import { NextResponse } from "next/server";
import { pool } from "@/lib/cockpit/db";
import { whoFromRequest } from "@/lib/cockpit/who";
import {
  pickExperts, runRound, runJudge, runSynthesis, saveDebate, type DebateData,
} from "@/lib/cockpit/debate-flow";
import type { ExpertId } from "@/lib/cockpit/data";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
  try {
    const { rows } = await pool.query(
      `SELECT id, created_ts, updated_ts, author, prompt, status, round, include_devil, max_rounds, data, pinned_commit
       FROM agent_debates ORDER BY created_ts DESC LIMIT $1`,
      [limit]
    );
    return NextResponse.json({ debates: rows });
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
    const includeDevil: boolean = body.include_devil ?? true;
    const maxRounds: number = Math.min(Math.max(body.max_rounds ?? 5, 2), 10);

    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ error: "prompt too short" }, { status: 400 });
    }

    // 1. Orquestador elige expertos
    const { selected, reasoning } = await pickExperts(prompt);
    const expertsWithDevil: ExpertId[] = includeDevil
      ? [...selected, "devil"]
      : [...selected];

    const initialData: DebateData = {
      experts: expertsWithDevil,
      orchestrator_reasoning: reasoning,
      rounds: [],
      judgements: [],
      synthesis: null,
      error: null,
    };

    const who = whoFromRequest(req);
    const { rows } = await pool.query(
      `INSERT INTO agent_debates (author, prompt, status, round, include_devil, max_rounds, data)
       VALUES ($1, $2, 'live', 0, $3, $4, $5::jsonb) RETURNING *`,
      [who, prompt, includeDevil, maxRounds, initialData]
    );
    let debate = rows[0];

    // 2. Ronda 1
    const round1 = await runRound(debate, 1);
    debate.data.rounds.push(round1);

    // 3. Juez
    const j1 = await runJudge(debate, 1);
    debate.data.judgements.push(j1);

    // 4. Si close, síntesis; si continue, dejamos para POST /round
    let status: "live" | "closed" = "live";
    if (j1.decision === "close") {
      debate.data.synthesis = await runSynthesis(debate);
      status = "closed";
    }

    const saved = await saveDebate(debate.id, {
      status,
      round: 1,
      data: debate.data,
    });

    return NextResponse.json({ debate: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "debate failed" },
      { status: 500 }
    );
  }
}
