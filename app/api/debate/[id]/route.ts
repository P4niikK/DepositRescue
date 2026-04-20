import { NextResponse } from "next/server";
import { fetchDebate } from "@/lib/cockpit/debate-flow";

export const dynamic = "force-dynamic";

function isValidId(raw: string): boolean {
  return /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw));
}

export async function GET(
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
    return NextResponse.json({ debate });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "query failed" },
      { status: 500 }
    );
  }
}
