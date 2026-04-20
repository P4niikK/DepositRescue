import { NextResponse } from "next/server";
import { pool } from "@/lib/cockpit/db";
import { whoFromRequest } from "@/lib/cockpit/who";

export const dynamic = "force-dynamic";

const KINDS = new Set(["started", "finished", "blocked", "note", "decision"]);

function parseLimit(raw: string | null, def: number, max: number): number {
  const n = parseInt(raw || "", 10);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get("limit"), 50, 200);
  const author = searchParams.get("author");

  try {
    const params: unknown[] = [];
    let where = "";
    if (author === "matu" || author === "feli") {
      params.push(author);
      where = `WHERE author = $${params.length}`;
    }
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT id, ts, author, kind, task, notes, files
       FROM agent_journal ${where}
       ORDER BY ts DESC LIMIT $${params.length}`,
      params
    );
    return NextResponse.json({ entries: rows });
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
  try {
    const kindRaw = typeof body.kind === "string" ? body.kind : "note";
    if (!KINDS.has(kindRaw)) {
      return NextResponse.json({ error: "invalid kind" }, { status: 400 });
    }
    const kind = kindRaw;
    const task = typeof body.task === "string" ? body.task.trim() : "";
    const notesRaw = typeof body.notes === "string" ? body.notes.trim() : "";
    const notes = notesRaw || null;
    const files: string[] = Array.isArray(body.files)
      ? body.files.filter((f): f is string => typeof f === "string")
      : [];
    if (!task) {
      return NextResponse.json({ error: "task required" }, { status: 400 });
    }
    const who = whoFromRequest(req);
    const { rows } = await pool.query(
      `INSERT INTO agent_journal (author, kind, task, notes, files)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, ts, author, kind, task, notes, files`,
      [who, kind, task, notes, files]
    );
    return NextResponse.json({ entry: rows[0] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "insert failed" },
      { status: 500 }
    );
  }
}
