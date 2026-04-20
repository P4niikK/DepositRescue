"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import {
  TYPE_META, USERS, type ActivityKind, type UserId,
} from "@/lib/cockpit/data";
import { Avatar } from "@/components/cockpit/avatar";
import { TypeIcon, TypeTag } from "@/components/cockpit/type-pill";
import { useWho } from "@/components/cockpit/who-provider";
import { formatJournalTs } from "@/lib/cockpit/format";
import { cn } from "@/lib/cockpit/utils";

const ALL_KINDS: ActivityKind[] = [
  "started", "finished", "blocked", "decided", "note", "commit", "question", "handoff",
];

type RawEntry = {
  id: number;
  ts: string;
  author: UserId;
  kind: ActivityKind;
  task: string;
  notes: string | null;
  files: string[] | null;
};

type FormattedEntry = RawEntry & { day: string; t: string };

const POLL_MS = 10_000;

export default function FeedPage() {
  const { fetchAs } = useWho();
  const [entries, setEntries] = useState<FormattedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [who, setWho] = useState<"all" | UserId>("all");
  const [active, setActive] = useState<Record<ActivityKind, boolean>>(
    () => Object.fromEntries(ALL_KINDS.map((k) => [k, true])) as Record<ActivityKind, boolean>
  );
  const [composerKind, setComposerKind] = useState<ActivityKind>("note");
  const [composerText, setComposerText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchAs("/api/journal?limit=50", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { entries: raw } = (await res.json()) as { entries: RawEntry[] };
      setEntries(
        raw.map((e) => ({ ...e, files: e.files ?? [], ...formatJournalTs(e.ts) }))
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "no pude cargar el feed");
    } finally {
      setLoading(false);
    }
  }, [fetchAs]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const visible = useMemo(
    () =>
      entries.filter(
        (f) => active[f.kind] && (who === "all" || who === f.author)
      ),
    [entries, who, active]
  );

  const byDay = useMemo(() => {
    const out: Record<string, FormattedEntry[]> = {};
    visible.forEach((f) => ((out[f.day] ||= []).push(f)));
    return out;
  }, [visible]);

  const toggle = (k: ActivityKind) => setActive((s) => ({ ...s, [k]: !s[k] }));

  const post = async () => {
    const task = composerText.trim();
    if (!task || posting) return;
    setPosting(true);
    try {
      const res = await fetchAs("/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: composerKind, task }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setComposerText("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "no se pudo postear");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Activity</h1>
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            {visible.length} events · {loading ? "cargando…" : "live"} · auto-sync {POLL_MS / 1000}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            title="Recargar feed"
            className="flex h-8 items-center justify-center rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-2 text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={() =>
              setWho((w) => (w === "all" ? "matu" : w === "matu" ? "feli" : "all"))
            }
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-3 font-mono text-[11px] text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
          >
            <Filter size={11} />
            {who === "all" ? "Todos" : who === "matu" ? "Solo Matu" : "Solo Feli"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-[color-mix(in_oklch,var(--c-blocked)_40%,transparent)] bg-[color-mix(in_oklch,var(--c-blocked)_10%,transparent)] px-3 py-2 font-mono text-[11px] text-[var(--c-blocked)]">
          ⚠ {error} — chequeá Tailscale y que Postgres esté corriendo
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {ALL_KINDS.map((k) => {
          const meta = TYPE_META[k];
          const on = active[k];
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[10.5px] uppercase tracking-wider transition",
                on
                  ? "border-[var(--border-2)] bg-[var(--bg-2)] text-[var(--text-1)]"
                  : "border-[var(--border-1)] bg-transparent text-[var(--text-3)]"
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: meta.colorVar, opacity: on ? 1 : 0.35 }}
              />
              {meta.label}
            </button>
          );
        })}
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-12 text-center font-mono text-[11px] text-[var(--text-3)]">
          cargando feed…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center font-mono text-[11px] text-[var(--text-3)]">
          sin entries · agregá la primera abajo
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(byDay).map(([day, items]) => (
            <div key={day} className="space-y-2">
              <div className="sticky top-12 z-10 bg-[var(--bg-0)]/95 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)] backdrop-blur">
                {day}
              </div>
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-3 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-3 transition hover:border-[var(--border-2)]"
                >
                  <span className="shrink-0 font-mono text-[11px] text-[var(--text-3)]">
                    {item.t}
                  </span>
                  <TypeIcon type={item.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TypeTag type={item.kind} />
                      <h3 className="truncate text-[13px] font-medium text-[var(--text-0)]">
                        {item.task}
                      </h3>
                    </div>
                    {item.notes && (
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
                        {item.notes}
                      </p>
                    )}
                    {item.files && item.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.files.map((f) => (
                          <code
                            key={f}
                            className="rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--text-2)]"
                          >
                            {f}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-start gap-1.5 text-[11px] text-[var(--text-3)]">
                    <Avatar who={item.author} size={16} />
                    <span>{USERS[item.author].name}</span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="sticky bottom-4 mt-auto rounded-lg border border-[var(--border-2)] bg-[var(--bg-1)] p-3 shadow-lg shadow-black/40">
        <textarea
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post();
          }}
          rows={2}
          placeholder="¿Qué estás haciendo? · Cmd+Enter para postear"
          className="w-full resize-none bg-transparent text-[12.5px] text-[var(--text-0)] placeholder:text-[var(--text-3)] focus:outline-none"
        />
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-wrap gap-1">
            {(["started", "finished", "blocked", "decided", "note", "question"] as ActivityKind[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setComposerKind(t)}
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition",
                    composerKind === t
                      ? "bg-[var(--bg-3)] text-[var(--text-0)]"
                      : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                  )}
                >
                  {t}
                </button>
              )
            )}
          </div>
          <button
            onClick={post}
            disabled={!composerText.trim() || posting}
            className="flex items-center gap-2 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 py-1 font-mono text-[11px] text-[var(--amber)] transition hover:bg-[var(--amber)]/20 disabled:opacity-40"
          >
            {posting ? "posteando…" : <>post <kbd>⌘↵</kbd></>}
          </button>
        </div>
      </div>
    </div>
  );
}
