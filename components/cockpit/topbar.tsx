"use client";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Avatar } from "./avatar";
import { useWho } from "./who-provider";
import type { UserId } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";

export function Topbar() {
  const { who, setWho } = useWho();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-4 border-b border-[var(--border-1)] bg-[var(--bg-0)]/90 px-4 backdrop-blur">
      <Link href="/cockpit" className="flex items-center gap-2 font-mono text-[13px]">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: "var(--amber)", boxShadow: "0 0 8px var(--amber-dim)" }}
        />
        <span className="font-semibold text-[var(--text-0)]">depositrescue</span>
        <span className="text-[var(--text-3)]">/cockpit</span>
      </Link>

      <button className="group flex h-8 flex-1 max-w-md items-center gap-2 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] px-3 text-left text-[12px] text-[var(--text-3)] transition hover:border-[var(--border-2)] hover:text-[var(--text-2)]">
        <Search size={12} />
        <span className="flex-1 truncate">Buscar en feed, debates, checklist…</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
          yo:
        </span>
        <WhoButton id="matu" active={who === "matu"} onClick={() => setWho("matu")} />
        <WhoButton id="feli" active={who === "feli"} onClick={() => setWho("feli")} />
      </div>

      <Link
        href="/cockpit/debate"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 font-mono text-[11px] uppercase tracking-wider text-[var(--amber)] transition hover:bg-[var(--amber)]/20"
      >
        <Sparkles size={12} />
        Lanzar debate
      </Link>
    </header>
  );
}

function WhoButton({
  id,
  active,
  onClick,
}: {
  id: UserId;
  active: boolean;
  onClick: () => void;
}) {
  const name = id === "matu" ? "Matu" : "Feli";
  return (
    <button
      onClick={onClick}
      title={active ? `Estás posteando como ${name}` : `Cambiar a ${name}`}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border px-2 text-[11px] transition",
        active
          ? "border-[var(--amber-border)] bg-[var(--amber-soft)]/50 text-[var(--text-0)]"
          : "border-[var(--border-1)] bg-[var(--bg-1)] text-[var(--text-2)] hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
      )}
    >
      <Avatar who={id} size={18} />
      <span className={active ? "font-semibold" : ""}>{name}</span>
      {active && <span className="pulse-dot" />}
    </button>
  );
}
