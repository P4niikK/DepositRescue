"use client";
import { useEffect, useState } from "react";
import { hackathonStatus, clockHM, sinceKickoff } from "@/lib/cockpit/hackathon";

/** Renders a live badge for the sidebar footer. */
export function HackathonFooter() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Initialise on mount to avoid SSR/client mismatch; tick every 30s.
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
        hackathon
      </div>
    );
  }

  const s = hackathonStatus(now);
  const uptime = sinceKickoff(now);

  return (
    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
      <div>hackathon</div>
      <div className="my-1 text-[var(--amber-dim)]">
        {s.headerLabel} · {clockHM(now)}
      </div>
      <div>{uptime ? `uptime ${uptime}` : "kickoff 21/04"}</div>
    </div>
  );
}

/** Short day badge for the sidebar roadmap nav. */
export function HackathonDayBadge() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setLabel(hackathonStatus(new Date()).dayBadge);
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return label;
}
