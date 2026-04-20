import { NextResponse } from "next/server";
import { pool } from "@/lib/cockpit/db";
import { whoFromRequest } from "@/lib/cockpit/who";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, category, title, tags, assignee, done, done_by, done_at,
              created_by, created_ts, updated_ts, position
       FROM agent_checklist
       ORDER BY category, position, id`
    );
    return NextResponse.json({ items: rows });
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
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : [];
    const assignee = body.assignee === "matu" || body.assignee === "feli" ? body.assignee : null;
    if (!category || !title) {
      return NextResponse.json({ error: "category and title required" }, { status: 400 });
    }
    if (title.length > 500 || category.length > 100) {
      return NextResponse.json({ error: "title or category too long" }, { status: 400 });
    }
    const who = whoFromRequest(req);
    const { rows } = await pool.query(
      `INSERT INTO agent_checklist (category, title, tags, assignee, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category, title, tags, assignee, done, created_by, created_ts, position`,
      [category, title, tags, assignee, who]
    );
    return NextResponse.json({ item: rows[0] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "insert failed" },
      { status: 500 }
    );
  }
}
