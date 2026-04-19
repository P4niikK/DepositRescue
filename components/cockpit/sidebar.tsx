"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Rss, CheckSquare, MessagesSquare, CircleHelp, Map, Pin,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cockpit/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  live?: boolean;
};

const NAV: NavItem[] = [
  { href: "/cockpit/feed",      label: "Activity",     icon: <Rss size={14} />,          badge: 12 },
  { href: "/cockpit/checklist", label: "Checklist",    icon: <CheckSquare size={14} />,  badge: 8 },
  { href: "/cockpit/debate",    label: "Debates",      icon: <MessagesSquare size={14} />, live: true },
  { href: "/cockpit/ask",       label: "Ask the team", icon: <CircleHelp size={14} /> },
  { href: "/cockpit/roadmap",   label: "Roadmap",      icon: <Map size={14} />,          badge: "D5" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-56 shrink-0 flex-col gap-4 border-r border-[var(--border-1)] bg-[var(--bg-0)] p-3 lg:flex">
      <SectionLabel>Workspace</SectionLabel>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[12px] transition",
                active
                  ? "bg-[var(--bg-2)] text-[var(--text-0)]"
                  : "text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text-1)]"
              )}
            >
              <span className={active ? "text-[var(--amber)]" : "text-[var(--text-3)] group-hover:text-[var(--text-2)]"}>
                {it.icon}
              </span>
              <span className="flex-1">{it.label}</span>
              {it.live && <span className="pulse-dot" />}
              {!it.live && it.badge !== undefined && (
                <span className="rounded bg-[var(--bg-2)] px-1.5 font-mono text-[10px] text-[var(--text-3)]">
                  {it.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-2">
        <SectionLabel>Pinned</SectionLabel>
        <PinnedItem>Stack: Next + Tailscale</PinnedItem>
        <PinnedItem>Skill por estado</PinnedItem>
      </div>

      <div className="mt-auto border-t border-[var(--border-1)] pt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
        <div>hackathon</div>
        <div className="my-1 text-[var(--amber-dim)]">DAY 5 / 7 · 03:42</div>
        <div>uptime 4d 11h</div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
      {children}
    </div>
  );
}

function PinnedItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-7 items-center gap-2.5 rounded-md px-2.5 text-[11px] text-[var(--text-2)] hover:bg-[var(--bg-1)]">
      <Pin size={12} className="text-[var(--text-3)]" />
      <span className="truncate">{children}</span>
    </div>
  );
}
