"use client";
import { useEffect, useState } from "react";
import { Pin, Clock, CalendarClock } from "lucide-react";
import { ROADMAP, TYPE_META, type UserId, type ActivityKind } from "@/lib/cockpit/data";
import { hackathonStatus, type HackathonStatus } from "@/lib/cockpit/hackathon";
import { timeAgo } from "@/lib/cockpit/format";
import { Avatar } from "./avatar";
import { useWho } from "./who-provider";
import type { ReactNode } from "react";

type PresenceEntry = {
  author: UserId;
  task: string;
  kind: ActivityKind;
  ts: string;
};

type RawJournalEntry = {
  author: UserId;
  task: string;
  kind: ActivityKind;
  ts: string;
};

export function Rail() {
  const { fetchAs } = useWho();
  const [status, setStatus] = useState<HackathonStatus | null>(null);
  const [presence, setPresence] = useState<Record<UserId, PresenceEntry | null>>({
    matu: null,
    feli: null,
  });

  useEffect(() => {
    const tick = () => setStatus(hackathonStatus(new Date()));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchAs("/api/journal?limit=40", { cache: "no-store" });
        if (!res.ok) return;
        const { entries } = (await res.json()) as { entries: RawJournalEntry[] };
        if (cancelled) return;
        const next: Record<UserId, PresenceEntry | null> = { matu: null, feli: null };
        for (const e of entries) {
          if (!next[e.author]) next[e.author] = { author: e.author, task: e.task, kind: e.kind, ts: e.ts };
        }
        setPresence(next);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [fetchAs]);

  return (
    <aside
      aria-label="Estado del hackathon y presencia"
      className="sticky top-12 hidden h-[calc(100vh-3rem)] w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-[var(--border-1)] bg-[var(--bg-0)] p-3 xl:flex"
    >
      <Block title="PRESENCIA" right={<LiveIndicator />}>
        <PresenceCard who="matu" entry={presence.matu} />
        <PresenceCard who="feli" entry={presence.feli} />
      </Block>

      {status && <HackathonBlock status={status} />}

      <Block title="ÚLTIMA SÍNTESIS">
        <div
          className="rounded-md border border-[var(--border-2)] bg-[var(--bg-2)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--text-1)]"
          style={{ borderLeft: "2px solid var(--amber)" }}
        >
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-[var(--text-3)]">
            (sin debates cerrados todavía)
          </div>
          Lanzá un debate en <span className="font-mono text-[var(--amber-dim)]">/cockpit/debate</span> y acá vas a ver la última decisión.
        </div>
      </Block>
    </aside>
  );
}

function HackathonBlock({ status }: { status: HackathonStatus }) {
  if (status.phase === "pre") {
    return (
      <Block
        title={status.headerLabel}
        right={<CalendarClock size={11} className="text-[var(--amber-dim)]" />}
      >
        <div className="rounded-md border border-[var(--border-2)] bg-[var(--bg-2)] px-3 py-3 text-[12.5px] leading-relaxed text-[var(--text-1)]">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[var(--amber-dim)]">
            kickoff · lun 21/04
          </div>
          <p>
            <b className="text-[var(--text-0)]">Faltan {status.daysUntilKickoff} día{status.daysUntilKickoff === 1 ? "" : "s"}</b>. Pre-carga: statutes, research, repo scaffolding.
          </p>
        </div>
      </Block>
    );
  }

  if (status.phase === "post") {
    return (
      <Block title="HACKATHON CERRADO">
        <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-2)] px-3 py-3 text-[12px] text-[var(--text-2)]">
          Ya pasó la fecha. El journal queda como registro.
        </div>
      </Block>
    );
  }

  // during / submit
  const today = ROADMAP.days.find((d) => d.n === status.day);
  const title = today?.title ?? "Submission";
  const done = today?.done ?? 0;
  const total = today?.total ?? 1;
  const pct = total ? done / total : 0;

  return (
    <Block
      title={`${status.headerLabel} · HOY`}
      right={
        pct < 0.5 ? (
          <span className="font-mono text-[10px] text-[var(--c-blocked)]">!</span>
        ) : null
      }
    >
      <div className="space-y-2">
        <div className="flex items-baseline justify-between font-mono text-[11px]">
          <span className="font-semibold text-[var(--text-0)]">{status.dayBadge}</span>
          <span className="text-[var(--text-2)] truncate ml-2">{title}</span>
        </div>
        <div
          className="flex gap-0.5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={`Progreso del día: ${done} de ${total} tareas`}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="h-1 flex-1 rounded-full"
              style={{
                background:
                  i < done ? "var(--amber)" : i === done ? "var(--amber-soft)" : "var(--bg-2)",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between font-mono text-[10px] text-[var(--text-3)]">
          <span>{done}/{total} done</span>
          {pct < 0.5 && <span className="text-[var(--c-blocked)]">atrasados</span>}
        </div>
        <div className="space-y-1 pt-1">
          {ROADMAP.todayTasks.slice(0, 4).map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px]"
              style={{ color: t.done ? "var(--text-3)" : "var(--text-2)" }}
            >
              <span
                className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border"
                style={{
                  borderColor: t.done ? "var(--amber-border)" : "var(--border-2)",
                  background: t.done ? "var(--amber-soft)" : "transparent",
                  color: "var(--amber)",
                }}
              >
                {t.done && "✓"}
              </span>
              <span className={t.done ? "line-through" : ""}>{t.t}</span>
            </div>
          ))}
        </div>
      </div>
    </Block>
  );
}

function Block({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
        <span>{title}</span>
        {right}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function LiveIndicator() {
  return (
    <span
      role="status"
      aria-label="Presencia en vivo"
      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-[var(--amber)]"
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--amber)" }}
      />
      live
    </span>
  );
}

function PresenceCard({
  who,
  entry,
}: {
  who: UserId;
  entry: PresenceEntry | null;
}) {
  const name = who === "matu" ? "Matu" : "Feli";
  if (!entry) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2.5 opacity-80">
        <div className="flex items-center gap-2 text-[11px]">
          <Avatar who={who} size={20} />
          <span className="font-medium text-[var(--text-0)]">{name}</span>
          <span className="ml-auto font-mono text-[10px] text-[var(--text-3)]">—</span>
        </div>
        <p className="mt-1.5 text-[11.5px] text-[var(--text-3)]">sin actividad reciente</p>
      </div>
    );
  }
  const meta = TYPE_META[entry.kind];
  return (
    <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[11px]">
        <Avatar who={who} size={20} />
        <span className="font-medium text-[var(--text-0)]">{name}</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-[var(--text-3)]">
          <Clock size={10} /> {timeAgo(entry.ts)}
        </span>
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--text-1)] line-clamp-2">
        {entry.task}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px]">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: meta.colorVar }}
        />
        <span style={{ color: meta.colorVar }}>{meta.label}</span>
      </div>
    </div>
  );
}
