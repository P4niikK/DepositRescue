import { NextResponse } from "next/server";
import {
  fetchDebate, runRound, runJudge, runSynthesis, saveDebate,
} from "@/lib/cockpit/debate-flow";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debate = await fetchDebate(id);
    if (!debate) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (debate.status !== "live") {
      return NextResponse.json({ error: "debate not live" }, { status: 400 });
    }

    const nextN = debate.round + 1;
    if (nextN > debate.max_rounds) {
      // Force close with synthesis
      debate.data.synthesis = await runSynthesis(debate);
      const saved = await saveDebate(id, { status: "closed", data: debate.data });
      return NextResponse.json({ debate: saved });
    }

    const round = await runRound(debate, nextN);
    debate.data.rounds.push(round);

    const j = await runJudge(debate, nextN);
    debate.data.judgements.push(j);

    let status: "live" | "closed" = "live";
    if (j.decision === "close") {
      debate.data.synthesis = await runSynthesis(debate);
      status = "closed";
    }

    const saved = await saveDebate(id, {
      status,
      round: nextN,
      data: debate.data,
    });

    return NextResponse.json({ debate: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "round failed" },
      { status: 500 }
    );
  }
}
