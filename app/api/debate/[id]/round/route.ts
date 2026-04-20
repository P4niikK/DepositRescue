import { NextResponse } from "next/server";
import {
  fetchDebate, runRound, runJudge, runSynthesis, saveDebate,
} from "@/lib/cockpit/debate-flow";
import { postSynthesisToFeed } from "@/lib/cockpit/feed-hooks";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isValidId(raw: string): boolean {
  return /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw));
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    const debate = await fetchDebate(id);
    if (!debate) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (debate.status !== "live") {
      return NextResponse.json({ error: "debate not live" }, { status: 400 });
    }

    const nextN = debate.round + 1;
    if (nextN > debate.max_rounds) {
      // Force close with synthesis
      debate.data.synthesis = await runSynthesis(debate);
      const saved = await saveDebate(id, {
        status: "closed",
        round: debate.round,
        data: debate.data,
      });
      if (saved.data.synthesis) {
        try {
          await postSynthesisToFeed({
            author: saved.author,
            kind: "debate-closed",
            refId: saved.id,
            headline: saved.data.synthesis.headline,
          });
        } catch {
          // feed hook is best-effort
        }
      }
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

    // Re-check the DB state before persisting: if another concurrent /round
    // call already advanced this debate, bail out instead of overwriting.
    const current = await fetchDebate(id);
    if (!current || current.round !== debate.round || current.status !== "live") {
      return NextResponse.json(
        { error: "debate state changed; refresh and retry" },
        { status: 409 }
      );
    }

    const saved = await saveDebate(id, {
      status,
      round: nextN,
      data: debate.data,
    });

    if (status === "closed" && saved.data.synthesis) {
      try {
        await postSynthesisToFeed({
          author: saved.author,
          kind: "debate-closed",
          refId: saved.id,
          headline: saved.data.synthesis.headline,
        });
      } catch {
        // feed hook is best-effort
      }
    }

    return NextResponse.json({ debate: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "round failed" },
      { status: 500 }
    );
  }
}
