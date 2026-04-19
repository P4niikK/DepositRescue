// Tiny helpers so closing a debate or finishing an ask shows up in the feed
// automatically, without each API route re-implementing the insert.

import { pool } from "./db";
import type { UserId } from "./data";

export type FeedHookKind = "debate-closed" | "ask-synthesized";

export async function postSynthesisToFeed(opts: {
  author: UserId;
  kind: FeedHookKind;
  refId: string | number;
  headline: string;
}) {
  const kind = opts.kind === "debate-closed" ? "decided" : "finished";
  const prefix = opts.kind === "debate-closed"
    ? `[debate #${opts.refId}]`
    : `[ask #${opts.refId}]`;
  const task = `${prefix} ${truncate(opts.headline, 140)}`;
  try {
    await pool.query(
      `INSERT INTO agent_journal (author, kind, task, notes, files)
       VALUES ($1, $2, $3, $4, $5)`,
      [opts.author, kind, task, null, []]
    );
  } catch {
    // Non-fatal: feed auto-posting must never break the underlying flow.
  }
}

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
