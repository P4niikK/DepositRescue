import { NextResponse } from "next/server";
import { parseRoadmap } from "@/lib/cockpit/roadmap-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(parseRoadmap());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "roadmap parse failed" },
      { status: 500 }
    );
  }
}
