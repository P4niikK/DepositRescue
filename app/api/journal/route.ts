import { NextResponse } from "next/server";
import { pool } from "@/lib/cockpit/db";
import { whoFromRequest } from "@/lib/cockpit/who";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
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
  try {
    const body = await req.json();
    const kind = body.kind ?? "note";
    const task = body.task?.trim();
    const notes = body.notes?.trim() || null;
    const files: string[] = Array.isArray(body.files) ? body.files : [];
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
