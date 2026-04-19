import { NextResponse } from "next/server";
import { pool, AUTHOR } from "@/lib/cockpit/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (typeof body.done === "boolean") {
      values.push(body.done);
      sets.push(`done = $${values.length}`);
      if (body.done) {
        values.push(AUTHOR);
        sets.push(`done_by = $${values.length}`);
        sets.push(`done_at = now()`);
      } else {
        sets.push(`done_by = NULL`, `done_at = NULL`);
      }
    }
    if (typeof body.title === "string") {
      values.push(body.title.trim());
      sets.push(`title = $${values.length}`);
    }
    if (Array.isArray(body.tags)) {
      values.push(body.tags);
      sets.push(`tags = $${values.length}`);
    }
    if (body.assignee === null || body.assignee === "matu" || body.assignee === "feli") {
      values.push(body.assignee);
      sets.push(`assignee = $${values.length}`);
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: "no updates" }, { status: 400 });
    }
    sets.push(`updated_ts = now()`);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE agent_checklist SET ${sets.join(", ")} WHERE id = $${values.length}
       RETURNING id, category, title, tags, assignee, done, done_by, done_at, position`,
      values
    );
    if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item: rows[0] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM agent_checklist WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "delete failed" },
      { status: 500 }
    );
  }
}
