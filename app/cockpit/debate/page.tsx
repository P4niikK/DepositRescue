"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Gavel, Pin, Sparkles, GitCommitHorizontal, RefreshCw, Loader2,
} from "lucide-react";
import { EXPERTS, USERS, type ExpertId, type UserId } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";
import { timeAgo } from "@/lib/cockpit/format";
import { ArtifactsPanel } from "@/components/cockpit/artifacts-panel";

type Turn = { expert: ExpertId; content: string; ms?: number; error?: string };
type Round = { n: number; turns: Turn[] };
type Judgement = {
  round: number;
  verdict: string;
  decision: "continue" | "close";
  focus_next: string | null;
};
type Synthesis = { headline: string; points: string[]; dissent: string };

type Debate = {
  id: string;
  created_ts: string;
  updated_ts: string;
  author: UserId;
  prompt: string;
  status: "live" | "closed" | "error";
  round: number;
  include_devil: boolean;
  max_rounds: number;
  data: {
    experts: ExpertId[];
    orchestrator_reasoning?: string;
    rounds: Round[];
    judgements: Judgement[];
    synthesis: Synthesis | null;
    error: string | null;
  };
  pinned_commit: string | null;
};

export default function DebatePage() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showLauncher, setShowLauncher] = useState(false);

  // Launcher state
  const [prompt, setPrompt] = useState("");
  const [includeDevil, setIncludeDevil] = useState(true);
  const [maxRounds, setMaxRounds] = useState(5);

  const [submitting, setSubmitting] = useState(false);
  const [roundRunning, setRoundRunning] = useState(false);
  const [closingAsk, setClosingAsk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guard for auto-continuation: one round-in-flight at a time across re-renders. */
  const inFlightRef = useRef(false);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/debate?limit=20", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { debates: list } = (await res.json()) as { debates: Debate[] };
      setDebates(list);
      if (!openId && list.length > 0) setOpenId(list[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    }
  }, [openId]);

  useEffect(() => { loadList(); }, [loadList]);

  const launch = async () => {
    if (!prompt.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          include_devil: includeDevil,
          max_rounds: maxRounds,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { debate } = (await res.json()) as { debate: Debate };
      setOpenId(debate.id);
      setPrompt("");
      setShowLauncher(false);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "launch failed");
    } finally {
      setSubmitting(false);
    }
  };

  const open = debates.find((d) => d.id === openId);

  const runRound = useCallback(
    async (debateId: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setRoundRunning(true);
      setError(null);
      try {
        const res = await fetch(`/api/debate/${debateId}/round`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await loadList();
      } catch (e) {
        setError(e instanceof Error ? e.message : "round failed");
      } finally {
        setRoundRunning(false);
        inFlightRef.current = false;
      }
    },
    [loadList]
  );

  const forceClose = useCallback(async () => {
    if (!open || closingAsk || inFlightRef.current) return;
    inFlightRef.current = true;
    setClosingAsk(true);
    setError(null);
    try {
      const res = await fetch(`/api/debate/${open.id}/close`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "close failed");
    } finally {
      setClosingAsk(false);
      inFlightRef.current = false;
    }
  }, [open, closingAsk, loadList]);

  // Auto-advance: while the selected debate is live and no turn is in flight,
  // fire the next round automatically. Stops when judge closes or max_rounds hit.
  useEffect(() => {
    if (!open || open.status !== "live") return;
    if (open.round >= open.max_rounds) return;
    if (inFlightRef.current) return;
    const t = setTimeout(() => runRound(open.id), 300);
    return () => clearTimeout(t);
  }, [open?.id, open?.status, open?.round, open?.max_rounds, runRound]);

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Debates</h1>
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            {debates.filter((d) => d.status === "live").length} live ·{" "}
            {debates.filter((d) => d.status === "closed").length} cerrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadList}
            className="flex h-8 items-center justify-center rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-2 text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={() => setShowLauncher((s) => !s)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 font-mono text-[11px] uppercase tracking-wider text-[var(--amber)] transition hover:bg-[var(--amber)]/20"
          >
            <Plus size={12} /> Nuevo debate
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-[color-mix(in_oklch,var(--c-blocked)_40%,transparent)] bg-[color-mix(in_oklch,var(--c-blocked)_10%,transparent)] px-3 py-2 font-mono text-[11px] text-[var(--c-blocked)]">
          ⚠ {error}
        </div>
      )}

      {showLauncher && (
        <section className="flex flex-col gap-3 rounded-md border border-[var(--border-2)] bg-[var(--bg-1)] p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Planteá la pregunta o decisión que querés que debatan (ej: ¿Server Actions o API routes para los writes del feed?)"
            className="w-full resize-none bg-transparent text-[13.5px] text-[var(--text-0)] placeholder:text-[var(--text-3)] focus:outline-none"
            disabled={submitting}
          />
          <div className="flex flex-wrap items-center gap-5 pt-1 text-[11.5px] text-[var(--text-2)]">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={includeDevil}
                onChange={(e) => setIncludeDevil(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--amber)]"
                disabled={submitting}
              />
              Incluir abogado del diablo
            </label>
            <label className="flex items-center gap-2">
              Rondas máx
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-1)]"
                disabled={submitting}
              >
                {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <button
              onClick={launch}
              disabled={!prompt.trim() || submitting}
              className="ml-auto flex items-center gap-2 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-4 py-1.5 font-mono text-[11px] text-[var(--amber)] transition hover:bg-[var(--amber)]/20 disabled:opacity-40"
            >
              {submitting ? "debatiendo (puede tardar ~60s)…" : <><Sparkles size={12} /> Lanzar debate</>}
            </button>
          </div>
        </section>
      )}

      {debates.length === 0 ? (
        <div className="py-12 text-center font-mono text-[11px] text-[var(--text-3)]">
          sin debates · lanzá el primero
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {debates.map((d) => (
            <button
              key={d.id}
              onClick={() => setOpenId(d.id)}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-left transition",
                d.id === openId
                  ? "border-[var(--border-3)] bg-[var(--bg-2)]"
                  : "border-[var(--border-1)] bg-[var(--bg-1)] hover:border-[var(--border-2)]"
              )}
            >
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
                {d.status === "live" && <span className="pulse-dot" />}
                <span style={{ color: d.status === "live" ? "var(--amber)" : "var(--text-3)" }}>
                  {d.status}
                </span>
              </span>
              <span className="flex-1 truncate text-[12.5px] text-[var(--text-1)]">{d.prompt}</span>
              <div className="flex -space-x-1.5">
                {d.data.experts.slice(0, 4).map((eid) => {
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
                R{d.round}/{d.max_rounds} · {timeAgo(d.created_ts)}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <DebateDetail
          debate={open}
          onClose={forceClose}
          roundRunning={roundRunning}
          closing={closingAsk}
        />
      )}
    </div>
  );
}

function DebateDetail({
  debate,
  onClose,
  roundRunning,
  closing,
}: {
  debate: Debate;
  onClose: () => void;
  roundRunning: boolean;
  closing: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
            DEBATE · {USERS[debate.author].name} · {timeAgo(debate.created_ts)}
          </div>
          <div className="mt-2 text-[15px] font-medium text-[var(--text-0)]">
            {debate.prompt}
          </div>
          {debate.data.orchestrator_reasoning && (
            <div className="mt-3 rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-2)]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--amber-dim)]">
                Orquestador
              </span>{" "}
              · {debate.data.orchestrator_reasoning}
            </div>
          )}
        </div>

        {debate.data.rounds.map((round) => {
          const verdict = debate.data.judgements.find((v) => v.round === round.n);
          return (
            <div key={round.n} className="space-y-3">
              <RoundLabel n={round.n} />
              {round.turns.map((turn, ti) => (
                <Turn key={ti} turn={turn} />
              ))}
              {verdict && <JudgeBar j={verdict} />}
            </div>
          );
        })}

        {debate.status === "live" && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)]/40 px-3 py-2">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--amber)]">
              <Loader2 size={12} className="animate-spin" />
              {closing
                ? "sintetizando…"
                : roundRunning
                ? `corriendo ronda ${debate.round + 1}/${debate.max_rounds}…`
                : `esperando próxima ronda (R${debate.round + 1}/${debate.max_rounds})`}
            </div>
            <button
              onClick={onClose}
              disabled={roundRunning || closing}
              className="flex items-center gap-2 rounded-md border border-[var(--border-2)] bg-[var(--bg-1)] px-3 py-1.5 font-mono text-[11px] text-[var(--text-2)] transition hover:border-[var(--border-3)] hover:text-[var(--text-1)] disabled:opacity-40"
              title="Corta el auto-encadenado y fuerza síntesis con lo que hay"
            >
              <Gavel size={11} />
              Forzar síntesis
            </button>
          </div>
        )}

        {debate.status === "closed" && debate.data.synthesis && (
          <div className="rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)]/40 p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--amber)]">
              <Sparkles size={11} />
              SÍNTESIS · cerrada en ronda {debate.round}
            </div>
            <h3 className="mt-2 text-[15px] font-semibold text-[var(--text-0)]">
              {debate.data.synthesis.headline}
            </h3>
            <ul className="mt-2 space-y-1 text-[12.5px] text-[var(--text-1)]">
              {debate.data.synthesis.points.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--amber)]">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {debate.data.synthesis.dissent && (
              <div className="mt-3 border-t border-[var(--amber-border)] pt-2 text-[12px] text-[var(--text-2)]">
                <b className="text-[var(--text-0)]">Disidencia:</b> {debate.data.synthesis.dissent}
              </div>
            )}
            {debate.pinned_commit && (
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[var(--amber)]">
                <GitCommitHorizontal size={11} /> {debate.pinned_commit}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Side title={`EXPERTOS (${debate.data.experts.length})`}>
          {debate.data.experts.map((eid) => {
            const ex = EXPERTS[eid];
            return (
              <div key={eid} className="flex items-center gap-2 text-[11px]">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-semibold text-[var(--bg-0)]"
                  style={{ background: ex.color }}
                >
                  {ex.initials}
                </span>
                <span className="flex-1 truncate text-[var(--text-1)]">{ex.role}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-3)]">
                  {eid === "devil" ? "devil" : "ready"}
                </span>
              </div>
            );
          })}
        </Side>

        <Side title="CONTROL">
          <SideButton icon={<Pin size={11} />}>Pin a commit</SideButton>
        </Side>

        <ArtifactsPanel kind="debate" id={debate.id} pollKey={debate.updated_ts} />
      </div>
    </div>
  );
}

function RoundLabel({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
      <span className="text-[var(--text-2)]">RONDA {n}</span>
      <div className="h-px flex-1 bg-[var(--border-1)]" />
    </div>
  );
}

function Turn({ turn }: { turn: Turn }) {
  const ex = EXPERTS[turn.expert];
  const isDevil = turn.expert === "devil";
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
        style={{ background: ex.color }}
      >
        {ex.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[var(--text-0)]">{ex.role}</span>
          <span className="text-[var(--text-3)]">· {ex.desc}</span>
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
          {turn.ms !== undefined && (
            <span className="ml-auto font-mono text-[9px] text-[var(--text-3)]">
              {(turn.ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {turn.error ? (
          <p className="mt-1.5 font-mono text-[11px] text-[var(--c-blocked)]">⚠ {turn.error}</p>
        ) : (
          <div
            className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--text-1)]"
            dangerouslySetInnerHTML={{ __html: renderRich(turn.content) }}
          />
        )}
      </div>
    </div>
  );
}

function JudgeBar({ j }: { j: Judgement }) {
  return (
    <div className="rounded-md border border-[color-mix(in_oklch,var(--c-decided)_35%,transparent)] bg-[color-mix(in_oklch,var(--c-decided)_10%,transparent)] p-3">
      <div
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--c-decided)" }}
      >
        <Gavel size={11} /> JUEZ · veredicto ronda {j.round}
      </div>
      <p className="mt-1 text-[12.5px] text-[var(--text-1)]">{j.verdict}</p>
      <div className="mt-1.5 font-mono text-[11px] text-[var(--text-2)]">
        → decisión:{" "}
        <b style={{ color: "var(--text-0)" }}>
          {j.decision === "close" ? "cerrar con síntesis" : `continuar a ronda ${j.round + 1}`}
        </b>
        {j.focus_next && (
          <span className="mt-1 block text-[var(--text-3)]">foco: {j.focus_next}</span>
        )}
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
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<b style="color: var(--text-0); font-weight: 600">$1</b>')
    .replace(
      /`([^`]+)`/g,
      '<code style="font-family: var(--f-mono); font-size: 0.92em; background: var(--bg-2); padding: 1px 5px; border-radius: 3px; color: var(--amber-dim)">$1</code>'
    );
}
