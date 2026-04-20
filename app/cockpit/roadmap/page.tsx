import { cn } from "@/lib/cockpit/utils";
import { hackathonStatus, roadmapDayStatus } from "@/lib/cockpit/hackathon";
import { parseRoadmap } from "@/lib/cockpit/roadmap-parser";

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

function formatMtime(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()}/${d.getMonth() + 1} ${hh}:${mm}`;
}

export default function RoadmapPage() {
  const h = hackathonStatus();
  const parsed = parseRoadmap();

  const days = parsed.days.map((d) => ({
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

  const todayDay = h.phase === "during" ? days.find((d) => d.n === h.day) : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-6">
      <header>
        <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Roadmap</h1>
        <p className="font-mono text-[11px] text-[var(--text-3)]">
          parseado de <span className="text-[var(--amber-dim)]">{parsed.file}</span>
          {" · "}
          last modified · {formatMtime(parsed.mtime)}
        </p>
      </header>

      {days.length === 0 && (
        <div className="rounded-md border border-dashed border-[var(--border-2)] bg-[var(--bg-1)] px-4 py-6 text-center font-mono text-[11px] text-[var(--text-3)]">
          sin roadmap · creá <code>docs/ROADMAP.md</code> con headers{" "}
          <code>### Día N — …</code>
        </div>
      )}

      <section className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-0)]">
              DepositRescue · 7-day hackathon
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-[var(--text-3)]">
              auto-sync · recargá para re-parsear el .md
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Stat label="progress" value={`${totalDone}/${total}`} />
            <Stat label="day" value={dayLabel} />
            <Stat
              label="late"
              value={String(lateCount)}
              warn={lateCount > 0}
            />
          </div>
        </div>

        {days.length > 0 && (
          <div className="mt-4 flex gap-2">
            {days.map((d) => {
              const s = STATUS_STYLES[d.status];
              const pct = d.total ? (d.done / d.total) * 100 : 0;
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
                      D{d.n}
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
        )}
      </section>

      <section className="space-y-2">
        {days.map((d) => {
          const s = STATUS_STYLES[d.status];
          const showTasks = d.n === todayDay?.n;
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
                {showTasks && d.tasks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.tasks.slice(0, 8).map((t, i) => (
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
                          style={{
                            background: t.done
                              ? "var(--c-finished)"
                              : t.owner === "matu"
                              ? "oklch(72% 0.11 230)"
                              : t.owner === "feli"
                              ? "oklch(72% 0.10 155)"
                              : "var(--amber)",
                          }}
                        />
                        {t.text.length > 60 ? t.text.slice(0, 60) + "…" : t.text}
                      </span>
                    ))}
                    {d.tasks.length > 8 && (
                      <span className="font-mono text-[10px] text-[var(--text-3)]">
                        +{d.tasks.length - 8} more
                      </span>
                    )}
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
