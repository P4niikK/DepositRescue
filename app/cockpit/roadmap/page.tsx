import { ROADMAP } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";
import { hackathonStatus, roadmapDayStatus } from "@/lib/cockpit/hackathon";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<
  string,
  { color: string; label: string }
> = {
  done:     { color: "var(--c-finished)", label: "done" },
  today:    { color: "var(--amber)",      label: "today" },
  late:     { color: "var(--c-blocked)",  label: "late" },
  upcoming: { color: "var(--text-3)",     label: "upcoming" },
};

export default function RoadmapPage() {
  const h = hackathonStatus();
  const days = ROADMAP.days.map((d) => ({
    ...d,
    status: roadmapDayStatus(d.n, d.total ? d.done / d.total : 0, h),
  }));
  const totalDone = days.reduce((a, d) => a + d.done, 0);
  const total = days.reduce((a, d) => a + d.total, 0);
  const lateCount = days.filter((d) => d.status === "late").length;
  const dayLabel =
    h.phase === "during" ? `${h.day}/7` :
    h.phase === "pre" ? `pre · D-${h.daysUntilKickoff}` :
    h.phase === "submit" ? "submit" : "post";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-6">
      <header>
        <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Roadmap</h1>
        <p className="font-mono text-[11px] text-[var(--text-3)]">
          parseado de <span className="text-[var(--amber-dim)]">{ROADMAP.file}</span> · auto-sync
        </p>
      </header>

      <section className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-0)]">
              DepositRescue · 7-day hackathon
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-[var(--text-3)]">
              ROADMAP.md · last parsed 00:42
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Stat label="progreso" value={`${totalDone}/${total}`} />
            <Stat label="día" value={dayLabel} />
            <Stat
              label="atrasados"
              value={String(lateCount)}
              warn={lateCount > 0}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {days.map((d) => {
            const s = STATUS_STYLES[d.status];
            const pct = (d.done / d.total) * 100;
            return (
              <div
                key={d.n}
                className={cn(
                  "flex-1 rounded-md border p-2.5",
                  d.status === "today" && "border-[var(--amber-border)] bg-[var(--amber-soft)]/40",
                  d.status !== "today" && "border-[var(--border-1)] bg-[var(--bg-2)]"
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[11px] font-semibold" style={{ color: s.color }}>
                    {d.label}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--text-3)]">
                    {d.done}/{d.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-[var(--bg-3)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        {days.map((d) => {
          const s = STATUS_STYLES[d.status];
          return (
            <article
              key={d.n}
              className={cn(
                "flex items-start gap-4 rounded-md border p-3",
                d.status === "today"
                  ? "border-[var(--amber-border)] bg-[var(--amber-soft)]/20"
                  : "border-[var(--border-1)] bg-[var(--bg-1)]"
              )}
            >
              <span
                className="mt-0.5 w-12 shrink-0 font-mono text-[11px] font-semibold"
                style={{ color: s.color }}
              >
                Día {d.n}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-medium text-[var(--text-0)]">
                  {d.title}
                  <span className="ml-2 font-mono text-[10px] text-[var(--text-3)]">
                    · {d.done}/{d.total}
                  </span>
                </h4>
                {d.status === "today" && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ROADMAP.todayTasks.map((t, i) => (
                      <span
                        key={i}
                        className={cn(
                          "flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px]",
                          t.done
                            ? "border-[var(--border-1)] bg-[var(--bg-2)] text-[var(--text-3)] line-through"
                            : "border-[var(--border-1)] bg-[var(--bg-2)] text-[var(--text-1)]"
                        )}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.done ? "var(--c-finished)" : "var(--amber)" }}
                        />
                        {t.t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span
                className="shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                style={{
                  color: s.color,
                  borderColor: `color-mix(in oklch, ${s.color} 40%, transparent)`,
                  background: `color-mix(in oklch, ${s.color} 10%, transparent)`,
                }}
              >
                {s.label}
              </span>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-3)]">
        {label}
      </span>
      <b
        className="text-[13px] font-semibold"
        style={{ color: warn ? "var(--c-blocked)" : "var(--text-0)" }}
      >
        {value}
      </b>
    </span>
  );
}
