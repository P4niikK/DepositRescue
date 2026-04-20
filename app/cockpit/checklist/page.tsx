"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, RefreshCw } from "lucide-react";
import { USERS, type UserId } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";
import { useWho } from "@/components/cockpit/who-provider";

type Item = {
  id: number;
  category: string;
  title: string;
  tags: string[] | null;
  assignee: UserId | null;
  done: boolean;
  done_by: UserId | null;
  position: number;
};

export default function ChecklistPage() {
  const { fetchAs } = useWho();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInputs, setNewInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetchAs("/api/checklist", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { items: raw } = (await res.json()) as { items: Item[] };
      setItems(raw);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "no pude cargar la checklist");
    } finally {
      setLoading(false);
    }
  }, [fetchAs]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const m = new Map<string, Item[]>();
    items.forEach((i) => {
      const arr = m.get(i.category) ?? [];
      arr.push(i);
      m.set(i.category, arr);
    });
    return Array.from(m.entries());
  }, [items]);

  const totalDone = items.filter((i) => i.done).length;

  const toggle = async (it: Item) => {
    const next = !it.done;
    // Optimistic update
    setItems((prev) =>
      prev.map((p) => (p.id === it.id ? { ...p, done: next } : p))
    );
    try {
      const res = await fetchAs(`/api/checklist/${it.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      // rollback
      setItems((prev) =>
        prev.map((p) => (p.id === it.id ? { ...p, done: !next } : p))
      );
      setError(e instanceof Error ? e.message : "no se pudo marcar el item");
    }
  };

  const addItem = async (category: string) => {
    const title = (newInputs[category] || "").trim();
    if (!title) return;
    setNewInputs((s) => ({ ...s, [category]: "" }));
    try {
      const res = await fetchAs("/api/checklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, title, tags: [] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "no se pudo agregar el item");
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Checklist</h1>
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            compartida · {items.length - totalDone} pendientes · {totalDone}/{items.length} done
            {loading && " · cargando…"}
          </p>
        </div>
        <button
          onClick={load}
          className="flex h-8 items-center justify-center rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-2 text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
        >
          <RefreshCw size={12} />
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-[color-mix(in_oklch,var(--c-blocked)_40%,transparent)] bg-[color-mix(in_oklch,var(--c-blocked)_10%,transparent)] px-3 py-2 font-mono text-[11px] text-[var(--c-blocked)]">
          ⚠ {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map(([cat, groupItems]) => {
          const doneN = groupItems.filter((i) => i.done).length;
          const pct = (doneN / groupItems.length) * 100;
          return (
            <section key={cat} className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)]">
              <header className="flex items-center gap-3 border-b border-[var(--border-1)] px-3 py-2">
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-1)]">
                  {cat}
                </h2>
                <span className="font-mono text-[10px] text-[var(--text-3)]">
                  {doneN}/{groupItems.length}
                </span>
                <div className="ml-auto h-1 w-24 rounded-full bg-[var(--bg-3)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${pct}%`, background: "var(--amber)" }}
                  />
                </div>
              </header>
              <ul className="divide-y divide-[var(--border-1)]">
                {groupItems.map((it) => (
                  <li
                    key={it.id}
                    onClick={() => toggle(it)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-[var(--bg-2)]",
                      it.done && "opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        it.done
                          ? "border-[var(--amber-border)] bg-[var(--amber-soft)] text-[var(--amber)]"
                          : "border-[var(--border-2)]"
                      )}
                    >
                      {it.done && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-[12.5px] text-[var(--text-1)]",
                        it.done && "line-through"
                      )}
                    >
                      {it.title}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      {(it.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-3)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <AssigneeChip who={it.assignee} />
                  </li>
                ))}
                <li className="flex items-center gap-2 px-3 py-2">
                  <Plus size={12} className="text-[var(--text-3)]" />
                  <input
                    value={newInputs[cat] || ""}
                    onChange={(e) =>
                      setNewInputs((s) => ({ ...s, [cat]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addItem(cat);
                    }}
                    placeholder={`Nuevo item en ${cat.toLowerCase()} · Enter para agregar`}
                    className="w-full bg-transparent text-[11.5px] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none"
                  />
                </li>
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AssigneeChip({ who }: { who: UserId | null }) {
  if (!who)
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed border-[var(--border-2)] font-mono text-[9px] text-[var(--text-3)]">
        ?
      </span>
    );
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[9px] font-semibold"
      style={{
        background: who === "matu" ? "oklch(35% 0.07 230)" : "oklch(35% 0.06 155)",
        color: who === "matu" ? "oklch(92% 0.02 230)" : "oklch(92% 0.02 155)",
      }}
    >
      {USERS[who].initials}
    </span>
  );
}
