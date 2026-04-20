// Browser identity for the cockpit. Each browser persists whether it is
// "matu" or "feli" and every write request echoes that back to the server.
// The server prefers the header over the DR_JOURNAL_AUTHOR env default.

import type { UserId } from "./data";

export const WHO_HEADER = "X-Cockpit-Who";
export const WHO_COOKIE = "dr_who";
export const WHO_STORAGE_KEY = "dr_who";

const WHO_COOKIE_RE = new RegExp(`(?:^|;\\s*)${WHO_COOKIE}=(matu|feli)(?:;|$)`);

export function isWho(v: unknown): v is UserId {
  return v === "matu" || v === "feli";
}

/** Server helper: prefer header (browser), fall back to cookie, then env. */
export function whoFromRequest(req: Request): UserId {
  const header = req.headers.get(WHO_HEADER);
  if (isWho(header)) return header;

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(WHO_COOKIE_RE);
  if (match && isWho(match[1])) return match[1];

  const env = process.env.DR_JOURNAL_AUTHOR;
  return isWho(env) ? env : "matu";
}
