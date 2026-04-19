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
  try {
    const body = await req.json();
    const category = body.category?.trim();
    const title = body.title?.trim();
    const tags: string[] = Array.isArray(body.tags) ? body.tags : [];
    const assignee = body.assignee === "matu" || body.assignee === "feli" ? body.assignee : null;
    if (!category || !title) {
      return NextResponse.json({ error: "category and title required" }, { status: 400 });
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
