"use client";
import { useState } from "react";
import { Plus, Gavel, Pin, Sparkles, GitCommitHorizontal } from "lucide-react";
import {
  DEBATES, EXPERTS, type Debate, type Expert,
} from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";

export default function DebatePage() {
  const [openId, setOpenId] = useState<string>("d1");
  const open = DEBATES.find((d) => d.id === openId);

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Debates</h1>
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            {DEBATES.filter((d) => d.status === "live").length} live ·{" "}
            {DEBATES.filter((d) => d.status === "closed").length} cerrados
          </p>
        </div>
        <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 font-mono text-[11px] uppercase tracking-wider text-[var(--amber)] transition hover:bg-[var(--amber)]/20">
          <Plus size={12} /> Nuevo debate
        </button>
      </header>

      <div className="flex flex-col gap-1.5">
        {DEBATES.map((d) => (
          <DebateListCard
            key={d.id}
            debate={d}
            openId={openId}
            onClick={() => setOpenId(d.id)}
          />
        ))}
      </div>

      {open && <DebateDetail debate={open} />}
    </div>
  );
}

function DebateListCard({
  debate,
  openId,
  onClick,
}: {
  debate: Debate;
  openId: string;
  onClick: () => void;
}) {
  const isOpen = debate.id === openId;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2 text-left transition",
        isOpen
          ? "border-[var(--border-3)] bg-[var(--bg-2)]"
          : "border-[var(--border-1)] bg-[var(--bg-1)] hover:border-[var(--border-2)]"
      )}
    >
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
        {debate.status === "live" && <span className="pulse-dot" />}
        <span style={{ color: debate.status === "live" ? "var(--amber)" : "var(--text-3)" }}>
          {debate.status}
        </span>
      </span>
      <span className="flex-1 truncate text-[12.5px] text-[var(--text-1)]">{debate.prompt}</span>
      <div className="flex -space-x-1.5">
        {debate.experts.slice(0, 4).map((eid) => {
          const ex = EXPERTS[eid];
          return (
            <span
              key={eid}
              className="flex h-5 w-5 items-center justify-center rounded-md border border-[var(--bg-0)] font-mono text-[9px] font-semibold text-[var(--bg-0)]"
              style={{ background: ex.color }}
            >
              {ex.initials}
            </span>
          );
        })}
      </div>
      <span className="font-mono text-[10px] text-[var(--text-3)]">
        R{debate.round} · {debate.opened}
      </span>
    </button>
  );
}

function DebateDetail({ debate }: { debate: Debate }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
            DEBATE · {debate.author === "matu" ? "Matu" : "Feli"} · opened{" "}
            {debate.opened}
          </div>
          <div className="mt-2 text-[15px] font-medium text-[var(--text-0)]">
            {debate.prompt}
          </div>
          {debate.orchestrator && (
            <div
              className="mt-3 rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-2)]"
              dangerouslySetInnerHTML={{
                __html: `<span class="font-mono uppercase tracking-wider text-[10px]" style="color: var(--amber-dim)">Orquestador</span> · ${debate.orchestrator}`,
              }}
            />
          )}
        </div>

        {debate.rounds?.map((round, ri) => {
          const isLast = ri === debate.rounds!.length - 1;
          const isLive = debate.status === "live" && isLast;
          const verdict = debate.judgeVerdicts?.find((v) => v.round === round.n);
          return (
            <div key={round.n} className="space-y-3">
              <RoundLabel n={round.n} live={isLive} />
              {round.turns.map((turn, ti) => (
                <Turn key={ti} expert={EXPERTS[turn.who]} content={turn.content} thinking={turn.thinking} />
              ))}
              {verdict && <JudgeBar verdict={verdict.verdict} next={round.n + 1} />}
            </div>
          );
        })}

        {debate.status === "closed" && debate.synthesis && (
          <div className="rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)]/40 p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--amber)]">
              <Sparkles size={11} />
              SÍNTESIS · cerrada en ronda {debate.round}
            </div>
            <h3 className="mt-2 text-[15px] font-semibold text-[var(--text-0)]">
              {debate.synthesis.headline}
            </h3>
            <ul className="mt-2 space-y-1 text-[12.5px] text-[var(--text-1)]">
              {debate.synthesis.points.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--amber)]">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-[var(--amber-border)] pt-2 text-[12px] text-[var(--text-2)]">
              <b className="text-[var(--text-0)]">Disidencia:</b> {debate.synthesis.dissent}
            </div>
            {debate.commit && (
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[var(--amber)]">
                <GitCommitHorizontal size={11} />
                {debate.commit.sha} — {debate.commit.msg}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Side title={`EXPERTOS (${debate.experts.length})`}>
          {debate.experts.map((eid) => {
            const ex = EXPERTS[eid];
            const typing = debate.status === "live" && eid === "arq";
            return (
              <div key={eid} className="flex items-center gap-2 text-[11px]">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-semibold text-[var(--bg-0)]"
                  style={{ background: ex.color }}
                >
                  {ex.initials}
                </span>
                <span className="flex-1 truncate text-[var(--text-1)]">{ex.role}</span>
                <span
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-wider",
                    typing ? "text-[var(--amber)]" : "text-[var(--text-3)]"
                  )}
                >
                  {typing ? "typing" : "ready"}
                </span>
              </div>
            );
          })}
        </Side>

        <Side title="CONTROL">
          <SideButton icon={<Plus size={11} />}>Sumar experto</SideButton>
          <SideButton icon={<Gavel size={11} />}>Forzar síntesis</SideButton>
          <SideButton icon={<Pin size={11} />}>Pin a commit</SideButton>
        </Side>

        <Side title="PINNED A">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-2)]">
            <GitCommitHorizontal size={11} />
            <span className="text-[var(--amber)]">a3f9b21</span>
            <span className="text-[var(--text-3)]">· pending</span>
          </div>
        </Side>
      </div>
    </div>
  );
}

function RoundLabel({ n, live }: { n: number; live: boolean }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
      <span style={{ color: live ? "var(--amber)" : "var(--text-3)" }}>
        RONDA {n}
      </span>
      <div className="h-px flex-1 bg-[var(--border-1)]" />
      {live && (
        <span className="flex items-center gap-1 text-[var(--amber)]">
          <span className="pulse-dot" /> en curso
        </span>
      )}
    </div>
  );
}

function Turn({
  expert,
  content,
  thinking,
}: {
  expert: Expert;
  content: string[];
  thinking?: boolean;
}) {
  const isDevil = expert.id === "devil";
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border bg-[var(--bg-1)] p-3",
        isDevil
          ? "border-[color-mix(in_oklch,var(--c-blocked)_40%,transparent)]"
          : "border-[var(--border-1)]"
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold text-[var(--bg-0)]"
        style={{ background: expert.color }}
      >
        {expert.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[var(--text-0)]">{expert.role}</span>
          <span className="text-[var(--text-3)]">· {expert.desc}</span>
          {isDevil && (
            <span
              className="ml-auto rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
              style={{
                color: "var(--c-blocked)",
                borderColor: "color-mix(in oklch, var(--c-blocked) 40%, transparent)",
                background: "color-mix(in oklch, var(--c-blocked) 10%, transparent)",
              }}
            >
              abogado del diablo
            </span>
          )}
        </div>
        {thinking ? (
          <div className="mt-1.5 font-mono text-[11px] text-[var(--text-3)]">
            pensando respuesta
            <span className="typing-dots">
              <span /> <span /> <span />
            </span>
          </div>
        ) : (
          <div className="mt-2 space-y-2 text-[12.5px] leading-relaxed text-[var(--text-1)]">
            {content.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: renderRich(p) }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JudgeBar({ verdict, next }: { verdict: string; next: number }) {
  return (
    <div className="rounded-md border border-[color-mix(in_oklch,var(--c-decided)_35%,transparent)] bg-[color-mix(in_oklch,var(--c-decided)_10%,transparent)] p-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--c-decided)" }}>
        <Gavel size={11} /> JUEZ · veredicto
      </div>
      <p className="mt-1 text-[12.5px] text-[var(--text-1)]">{verdict}</p>
      <div className="mt-1.5 font-mono text-[11px] text-[var(--text-2)]">
        → decisión: <b style={{ color: "var(--text-0)" }}>continuar a ronda {next}</b>
      </div>
    </div>
  );
}

function Side({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SideButton({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-1)] bg-[var(--bg-2)] px-2 py-1.5 font-mono text-[10.5px] text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text-1)]">
      {icon} {children}
    </button>
  );
}

function renderRich(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<b style="color: var(--text-0); font-weight: 600">$1</b>')
    .replace(/<b>([^<]+)<\/b>/g, '<b style="color: var(--text-0); font-weight: 600">$1</b>')
    .replace(
      /<code>([^<]+)<\/code>/g,
      '<code style="font-family: var(--f-mono); font-size: 0.92em; background: var(--bg-2); padding: 1px 5px; border-radius: 3px; color: var(--amber-dim)">$1</code>'
    );
}
