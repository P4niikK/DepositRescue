// Parse docs/ROADMAP.md into day-by-day task counts. Keeps the source of
// truth in one place (the markdown file) instead of a hardcoded TS table.

import fs from "fs";
import path from "path";

export type Owner = "matu" | "feli" | "shared";

export type ParsedTask = {
  done: boolean;
  text: string;
  owner: Owner;
};

export type ParsedDay = {
  n: number;
  title: string;
  total: number;
  done: number;
  tasks: ParsedTask[];
};

export type ParsedRoadmap = {
  file: string;
  mtime: string | null;
  days: ParsedDay[];
};

const DASH = /[—–-]/; // em-dash, en-dash, or hyphen

export function parseRoadmap(): ParsedRoadmap {
  const filePath = path.resolve(process.cwd(), "docs", "ROADMAP.md");
  if (!fs.existsSync(filePath)) {
    return { file: "docs/ROADMAP.md", mtime: null, days: [] };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const mtime = fs.statSync(filePath).mtime.toISOString();

  const lines = raw.split(/\r?\n/);
  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;
  let currentOwner: Owner = "shared";

  const pushCurrent = () => {
    if (current) {
      days.push(current);
      current = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    // H3 headers: either start a day or end one.
    if (/^### /.test(line)) {
      const dayMatch = line.match(
        new RegExp(`^###\\s+Día\\s+(\\d+)\\s*${DASH.source}\\s*(.+)$`, "u")
      );
      if (dayMatch) {
        pushCurrent();
        current = {
          n: parseInt(dayMatch[1], 10),
          title: dayMatch[2].trim(),
          total: 0,
          done: 0,
          tasks: [],
        };
        currentOwner = "shared";
        continue;
      }
      // Other ### headers (Pre-work, Domingo, Lunes 28, etc.) end the day.
      pushCurrent();
      currentOwner = "shared";
      continue;
    }

    // H2 header ends whatever day was open.
    if (/^## /.test(line)) {
      pushCurrent();
      currentOwner = "shared";
      continue;
    }

    if (!current) continue;

    // Owner sub-headings: **Matu (10 hs):**, **Feli (8-10 hs):**, **Ambos:**.
    const ownerMatch = line.match(/^\*\*(Matu|Feli|Ambos)\b/i);
    if (ownerMatch) {
      const who = ownerMatch[1].toLowerCase();
      currentOwner = who === "matu" ? "matu" : who === "feli" ? "feli" : "shared";
      continue;
    }
    // "**Fin de día 1:**" etc. resets to shared.
    if (/^\*\*(Fin|Sync|Fin del día|Fin de día)/i.test(line)) {
      currentOwner = "shared";
      continue;
    }

    // Task line. Tolerates standard GFM checkboxes ("- [ ]", "- [x]") plus
    // the audit-added priority tags ("- [P1]", "- [P2]", "- [P3]", "- [cut]",
    // "- [stretch]"). Anything that isn't "x"/"X" counts as pending.
    const taskMatch = line.match(/^\s*-\s*\[([^\]]{1,10})\]\s*(.+)$/);
    if (taskMatch) {
      const marker = taskMatch[1].trim().toLowerCase();
      const done = marker === "x";
      const text = taskMatch[2].trim();
      current.tasks.push({ done, text, owner: currentOwner });
      current.total += 1;
      if (done) current.done += 1;
    }
  }
  pushCurrent();

  return { file: "docs/ROADMAP.md", mtime, days };
}
