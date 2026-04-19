// Compact, project-wide memory of decisions already made.
// One tiny file the agents see as context before they respond. Hard-capped
// in size so we never stuff huge histories into every turn.

import fs from "fs";
import path from "path";

const DIR = path.resolve(process.cwd(), ".cockpit");
const FILE = path.join(DIR, "decisions.md");
/** Truncate when file exceeds this many chars (keeps newest). */
const MAX_CHARS = 6000;

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

export function readDecisions(): string {
  try {
    if (!fs.existsSync(FILE)) return "";
    return fs.readFileSync(FILE, "utf8");
  } catch {
    return "";
  }
}

/** Append one decision + prune oldest entries if the file grows past the cap. */
export function appendDecision(entry: {
  source: "debate" | "ask" | "manual";
  sourceId: string | number;
  headline: string;
  dissent?: string;
}) {
  ensureDir();
  const date = new Date().toISOString().slice(0, 10);
  const line = `- **${date}** (${entry.source}#${entry.sourceId}) ${entry.headline}${
    entry.dissent ? ` _(dissent: ${entry.dissent})_` : ""
  }\n`;

  let current = readDecisions();
  if (!current) {
    current = "# Decisiones tomadas en DepositRescue (más nuevas arriba)\n\n";
  }

  // Strip any legacy subtitle lines that ended up mixed with decisions.
  current = current.replace(/^Las más recientes arriba\.\n+/gm, "");

  // Insert the new bullet right after the H1 header block.
  const headerEnd = current.indexOf("\n\n", current.indexOf("# "));
  const head = headerEnd >= 0 ? current.slice(0, headerEnd + 2) : current + "\n";
  const rest = headerEnd >= 0 ? current.slice(headerEnd + 2) : "";
  let next = head + line + rest;

  // Prune if over cap — drop oldest bullets from the end
  if (next.length > MAX_CHARS) {
    const lines = next.split("\n");
    while (next.length > MAX_CHARS && lines.length > 5) {
      // Drop the last bullet line (oldest)
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith("- ")) {
          lines.splice(i, 1);
          break;
        }
      }
      next = lines.join("\n");
    }
  }

  fs.writeFileSync(FILE, next, "utf8");
}

/** A compact block to append to a system prompt. Empty if there are no decisions yet. */
export function decisionsBlock(): string {
  const content = readDecisions();
  if (!content.trim()) return "";
  return `\n\nDECISIONES YA TOMADAS EN ESTE PROYECTO (no las re-abras sin razón fuerte):\n${content.trim()}`;
}
