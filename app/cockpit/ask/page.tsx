"use client";
import { useCallback, useEffect, useState } from "react";
import { Send, Sparkles, RefreshCw } from "lucide-react";
import { EXPERTS, type ExpertId, USERS, type UserId } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";
import { timeAgo } from "@/lib/cockpit/format";
import { ArtifactsPanel } from "@/components/cockpit/artifacts-panel";

type Answer = {
  expert: ExpertId;
  status: "done" | "error";
  content: string;
  ms: number;
};
type Synthesis = { headline: string; points: string[]; dissent: string } | null;
type Ask = {
  id: string;
  created_ts: string;
  author: UserId;
  prompt: string;
  experts: ExpertId[];
  synthesize: boolean;
  status: "running" | "done" | "error";
  data: { answers: Answer[]; synthesis: Synthesis; error: string | null };
};

export default function AskPage() {
  const [history, setHistory] = useState<Ask[]>([]);
  const [selected, setSelected] = useState<ExpertId[]>(["arq", "product"]);
  const [synth, setSynth] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/ask?limit=20", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { asks } = (await res.json()) as { asks: Ask[] };
      setHistory(asks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const toggle = (id: ExpertId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    if (!prompt.trim() || selected.length < 1 || submitting) return;
    setSubmitting(true);
    setError(null);
    setCurrentId(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), experts: selected, synthesize: synth }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { ask } = (await res.json()) as { ask: Ask };
      setCurrentId(ask.id);
      setPrompt("");
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ask failed");
    } finally {
      setSubmitting(false);
    }
  };

  const current = history.find((a) => a.id === currentId) ?? history[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Ask the team</h1>
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            async · sin rondas · respuestas en paralelo · {history.length} en historial
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="flex h-8 items-center justify-center rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-2 text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
        >
          <RefreshCw size={12} />
        </button>
      </header>

      <section className="flex flex-col gap-3 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Hacé una pregunta corta…"
          className="w-full resize-none bg-transparent text-[13.5px] text-[var(--text-0)] placeholder:text-[var(--text-3)] focus:outline-none"
          disabled={submitting}
        />
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
            EXPERTOS · elegí 1 a 5
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Object.values(EXPERTS).map((ex) => {
              const on = selected.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggle(ex.id)}
                  disabled={submitting}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11.5px] transition",
                    on
                      ? "border-[var(--amber-border)] bg-[var(--amber-soft)]/30"
                      : "border-[var(--border-1)] bg-[var(--bg-2)] hover:border-[var(--border-2)]"
                  )}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold text-[var(--bg-0)]"
                    style={{ background: ex.color }}
                  >
                    {ex.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--text-0)]">
                      {ex.role}
                    </span>
                    <span className="block truncate text-[10.5px] text-[var(--text-3)]">
                      {ex.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={synth}
              onChange={(e) => setSynth(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--amber)]"
              disabled={submitting}
            />
            Síntesis al final
          </label>
          <button
            onClick={submit}
            disabled={!prompt.trim() || selected.length < 1 || submitting}
            className="flex items-center gap-2 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 py-1.5 font-mono text-[11px] text-[var(--amber)] transition hover:bg-[var(--amber)]/20 disabled:opacity-40"
          >
            {submitting ? (
              <>pensando…</>
            ) : (
              <>
                <Send size={11} /> Preguntar a {selected.length}
              </>
            )}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-[color-mix(in_oklch,var(--c-blocked)_40%,transparent)] bg-[color-mix(in_oklch,var(--c-blocked)_10%,transparent)] px-3 py-2 font-mono text-[11px] text-[var(--c-blocked)]">
          ⚠ {error}
        </div>
      )}

      {current && <AskResult ask={current} />}

      {history.length > 1 && (
        <section className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
            HISTORIAL
          </div>
          {history
            .filter((a) => a.id !== current?.id)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => setCurrentId(a.id)}
                className="flex w-full items-center gap-3 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 text-left transition hover:border-[var(--border-2)]"
              >
                <span className="font-mono text-[10px] text-[var(--text-3)]">
                  {timeAgo(a.created_ts)}
                </span>
                <span className="flex-1 truncate text-[12px] text-[var(--text-1)]">
                  {a.prompt}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-3)]">
                  {a.experts.length} experts · {USERS[a.author].name}
                </span>
              </button>
            ))}
        </section>
      )}
    </div>
  );
}

function AskResult({ ask }: { ask: Ask }) {
  return (
    <section className="space-y-2.5">
      <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
          ASK · {USERS[ask.author].name} · {timeAgo(ask.created_ts)}
        </div>
        <div className="mt-1.5 text-[14px] font-medium text-[var(--text-0)]">
          {ask.prompt}
        </div>
      </div>

      {ask.data.answers.map((ans) => {
        const ex = EXPERTS[ans.expert];
        return (
          <article
            key={ans.expert}
            className="flex gap-3 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-3"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold text-[var(--bg-0)]"
              style={{ background: ex.color }}
            >
              {ex.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[var(--text-0)]">
                  {ex.role}
                </span>
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{
                    color: ans.status === "error" ? "var(--c-blocked)" : "var(--c-finished)",
                  }}
                >
                  {ans.status === "error" ? "✗ error" : "✓ done"}
                </span>
                <span className="ml-auto font-mono text-[9px] text-[var(--text-3)]">
                  {(ans.ms / 1000).toFixed(1)}s
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--text-1)]"
                dangerouslySetInnerHTML={{ __html: renderRich(ans.content) }}
              />
            </div>
          </article>
        );
      })}

      {ask.data.synthesis && (
        <div className="rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)]/40 p-4">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--amber)]">
            <Sparkles size={11} /> SÍNTESIS
          </div>
          <h3 className="mt-2 text-[14px] font-semibold text-[var(--text-0)]">
            {ask.data.synthesis.headline}
          </h3>
          <ul className="mt-2 space-y-1 text-[12.5px] text-[var(--text-1)]">
            {ask.data.synthesis.points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--amber)]">·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {ask.data.synthesis.dissent && (
            <div className="mt-3 border-t border-[var(--amber-border)] pt-2 text-[12px] text-[var(--text-2)]">
              <b className="text-[var(--text-0)]">Disidencia:</b> {ask.data.synthesis.dissent}
            </div>
          )}
        </div>
      )}

      <ArtifactsPanel kind="ask" id={ask.id} pollKey={ask.updated_ts} />
    </section>
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
