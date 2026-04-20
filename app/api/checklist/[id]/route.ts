import { NextResponse } from "next/server";
import { pool } from "@/lib/cockpit/db";
import { whoFromRequest } from "@/lib/cockpit/who";

export const dynamic = "force-dynamic";

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  try {
    const sets: string[] = [];
    const values: unknown[] = [];

    const who = whoFromRequest(req);
    if (typeof body.done === "boolean") {
      values.push(body.done);
      sets.push(`done = $${values.length}`);
      if (body.done) {
        values.push(who);
        sets.push(`done_by = $${values.length}`);
        sets.push(`done_at = now()`);
      } else {
        sets.push(`done_by = NULL`, `done_at = NULL`);
      }
    }
    if (typeof body.title === "string") {
      const trimmed = body.title.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
      }
      if (trimmed.length > 500) {
        return NextResponse.json({ error: "title too long" }, { status: 400 });
      }
      values.push(trimmed);
      sets.push(`title = $${values.length}`);
    }
    if (Array.isArray(body.tags)) {
      const tags = body.tags.filter((t): t is string => typeof t === "string");
      values.push(tags);
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
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const res = await pool.query(`DELETE FROM agent_checklist WHERE id = $1`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "delete failed" },
      { status: 500 }
    );
  }
}
