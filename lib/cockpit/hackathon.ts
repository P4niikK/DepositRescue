// Hackathon-relative date helpers. Kickoff is Mon 2026-04-21. Submission
// deadline Mon 2026-04-28. Day 7 ("polish + submit prep") is Sun 2026-04-27.

export type HackathonPhase = "pre" | "during" | "submit" | "post";

export type HackathonStatus = {
  phase: HackathonPhase;
  /** 1..7 during the hackathon; 0 before; 8 on submission day; null after. */
  day: number | null;
  /** Short badge label: D-2 / D3 / SUB / POST. */
  dayBadge: string;
  /** Long label for headers: "PRE-KICKOFF · D-2" / "DAY 3 / 7" / "SUBMISSION". */
  headerLabel: string;
  /** Calendar days between today and kickoff (negative once started). */
  daysUntilKickoff: number;
};

const KICKOFF_ISO = "2026-04-21";
const LAST_DAY_ISO = "2026-04-27"; // Day 7
const SUBMISSION_ISO = "2026-04-28";

function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hackathonStatus(now: Date = new Date()): HackathonStatus {
  const today = atMidnight(now);
  const kickoff = atMidnight(parseLocalDate(KICKOFF_ISO));
  const lastDay = atMidnight(parseLocalDate(LAST_DAY_ISO));
  const submission = atMidnight(parseLocalDate(SUBMISSION_ISO));

  const msPerDay = 86_400_000;
  const diff = Math.round((today.getTime() - kickoff.getTime()) / msPerDay);
  const daysUntilKickoff = -diff;

  if (today < kickoff) {
    return {
      phase: "pre",
      day: 0,
      dayBadge: `D-${daysUntilKickoff}`,
      headerLabel: `PRE-KICKOFF · ${daysUntilKickoff}d restantes`,
      daysUntilKickoff,
    };
  }
  if (today <= lastDay) {
    const day = diff + 1; // 1..7
    return {
      phase: "during",
      day,
      dayBadge: `D${day}`,
      headerLabel: `DAY ${day} / 7`,
      daysUntilKickoff,
    };
  }
  if (today.getTime() === submission.getTime()) {
    return {
      phase: "submit",
      day: 8,
      dayBadge: "SUB",
      headerLabel: "SUBMISSION DAY",
      daysUntilKickoff,
    };
  }
  return {
    phase: "post",
    day: null,
    dayBadge: "POST",
    headerLabel: "HACKATHON CERRADO",
    daysUntilKickoff,
  };
}

/** Status to use for a roadmap day given today's hackathon status. */
export function roadmapDayStatus(
  dayN: number,
  doneFrac: number,
  today: HackathonStatus
): "done" | "today" | "late" | "upcoming" {
  if (today.phase === "pre" || today.phase === "post") {
    // Before kickoff: everything is upcoming regardless of mock "done" counts.
    // After submission: everything done-or-late is frozen as done.
    return today.phase === "post" ? "done" : "upcoming";
  }
  const currentDay = today.day ?? 0;
  if (dayN > currentDay) return "upcoming";
  if (dayN === currentDay) return "today";
  // Past days
  return doneFrac >= 1 ? "done" : "late";
}

/** HH:MM from a Date (local time). */
export function clockHM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Humanised uptime since kickoff. Empty when not yet started. */
export function sinceKickoff(now: Date = new Date()): string {
  const kickoff = parseLocalDate(KICKOFF_ISO);
  const ms = now.getTime() - kickoff.getTime();
  if (ms < 0) return "";
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days === 0) return `${hours}h`;
  return `${days}d ${hours}h`;
}
