import { Pin, Clock } from "lucide-react";
import { ROADMAP } from "@/lib/cockpit/data";
import { Avatar } from "./avatar";
import type { ReactNode } from "react";

export function Rail() {
  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-[var(--border-1)] bg-[var(--bg-0)] p-3 xl:flex">
      <Block title="PRESENCIA" right={<LiveIndicator />}>
        <PresenceCard
          who="matu"
          since="02:54"
          doing="Debuggeando timeout en photo comparison subagent"
          file="agents/photo-compare.ts · +47 −12"
        />
        <PresenceCard
          who="feli"
          since="01:12"
          doing="Debatiendo: 3 estados profundos vs 10 superficiales"
          file="debate · en ronda 2"
        />
      </Block>

      <Block
        title="DÍA 5 · HOY"
        right={<span className="font-mono text-[10px] text-[var(--c-blocked)]">!</span>}
      >
        <div className="space-y-2">
          <div className="flex items-baseline justify-between font-mono text-[11px]">
            <span className="font-semibold text-[var(--text-0)]">D5</span>
            <span className="text-[var(--text-2)]">Debate view + ask the team</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  background:
                    i < 1 ? "var(--amber)" : i === 1 ? "var(--amber-soft)" : "var(--bg-2)",
                }}
              />
            ))}
          </div>
          <div className="flex justify-between font-mono text-[10px] text-[var(--text-3)]">
            <span>1/5 done</span>
            <span className="text-[var(--c-blocked)]">~3hs atrasados</span>
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

      <Block title="ÚLTIMA SÍNTESIS">
        <div
          className="rounded-md border border-[var(--border-2)] bg-[var(--bg-2)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--text-1)]"
          style={{ borderLeft: "2px solid var(--amber)" }}
        >
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-[var(--text-3)]">
            2H AGO · STACK DEBATE
          </div>
          Next.js + Tailwind + shadcn, deploy local en Tailscale.
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[var(--amber)]">
            <Pin size={10} /> a3f9b21
          </div>
        </div>
      </Block>
    </aside>
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
    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-[var(--amber)]">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--amber)" }}
      />
      live
    </span>
  );
}

function PresenceCard({
  who,
  since,
  doing,
  file,
}: {
  who: "matu" | "feli";
  since: string;
  doing: string;
  file: string;
}) {
  return (
    <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[11px]">
        <Avatar who={who} size={20} />
        <span className="font-medium text-[var(--text-0)]">
          {who === "matu" ? "Matu" : "Feli"}
        </span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-[var(--text-3)]">
          <Clock size={10} /> since {since}
        </span>
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--text-1)]">
        {doing}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-3)]">
        <span
          className="inline-block h-1 w-1 rounded-full"
          style={{ background: "var(--amber)" }}
        />
        {file}
      </div>
    </div>
  );
}
