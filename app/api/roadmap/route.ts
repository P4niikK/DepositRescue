import { NextResponse } from "next/server";
import { parseRoadmap } from "@/lib/cockpit/roadmap-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(parseRoadmap());
}
