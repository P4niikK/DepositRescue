// Per-session sandbox for agent file output. Each debate/ask gets its own
// directory under .cockpit/artifacts/. Agents spawn with that as cwd.

import fs from "fs";
import path from "path";

const BASE = path.resolve(process.cwd(), ".cockpit", "artifacts");

export type SessionKind = "debate" | "ask";

function dirFor(kind: SessionKind, id: string | number): string {
  return path.join(BASE, `${kind}-${id}`);
}

/** Returns the session dir, creating it on disk if missing. */
export function sessionDir(kind: SessionKind, id: string | number): string {
  const dir = dirFor(kind, id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export type ArtifactInfo = {
  name: string;
  size: number;
  mtime: string;
};

export function listArtifacts(kind: SessionKind, id: string | number): ArtifactInfo[] {
  const dir = dirFor(kind, id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => {
      const full = path.join(dir, e.name);
      const stat = fs.statSync(full);
      return { name: e.name, size: stat.size, mtime: stat.mtime.toISOString() };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Safely read an artifact by name. Rejects any attempt to escape the dir. */
export function readArtifact(
  kind: SessionKind,
  id: string | number,
  name: string
): string | null {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    return null;
  }
  const dir = dirFor(kind, id);
  const full = path.resolve(dir, name);
  // belt-and-suspenders: ensure the resolved path still lives inside the session dir
  const rel = path.relative(dir, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return fs.readFileSync(full, "utf8");
}
