import { NextResponse } from "next/server";
import { fetchDebate, runSynthesis, saveDebate } from "@/lib/cockpit/debate-flow";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debate = await fetchDebate(id);
    if (!debate) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (debate.status !== "live") {
      return NextResponse.json({ error: "already closed" }, { status: 400 });
    }
    if (debate.data.rounds.length === 0) {
      return NextResponse.json({ error: "no rounds yet" }, { status: 400 });
    }

    debate.data.synthesis = await runSynthesis(debate);
    const saved = await saveDebate(id, { status: "closed", data: debate.data });
    return NextResponse.json({ debate: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "close failed" },
      { status: 500 }
    );
  }
}
