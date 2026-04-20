import { NextResponse } from "next/server";
import { fetchDebate, runSynthesis, saveDebate } from "@/lib/cockpit/debate-flow";
import { postSynthesisToFeed } from "@/lib/cockpit/feed-hooks";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
      return NextResponse.json({ error: "already closed" }, { status: 400 });
    }
    if (debate.data.rounds.length === 0) {
      return NextResponse.json({ error: "no rounds yet" }, { status: 400 });
    }

    debate.data.synthesis = await runSynthesis(debate);

    // Guard against concurrent close: only transition from 'live' → 'closed'.
    const current = await fetchDebate(id);
    if (!current || current.status !== "live") {
      return NextResponse.json(
        { error: "debate state changed; refresh and retry" },
        { status: 409 }
      );
    }

    const saved = await saveDebate(id, { status: "closed", data: debate.data });
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
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "close failed" },
      { status: 500 }
    );
  }
}
