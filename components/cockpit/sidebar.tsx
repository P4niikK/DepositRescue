"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Rss, CheckSquare, MessagesSquare, CircleHelp, Map, Pin,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cockpit/utils";
import { HackathonFooter, HackathonDayBadge } from "./hackathon-clock";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
  live?: boolean;
};

const NAV: NavItem[] = [
  { href: "/cockpit/feed",      label: "Activity",     icon: <Rss size={14} /> },
  { href: "/cockpit/checklist", label: "Checklist",    icon: <CheckSquare size={14} /> },
  { href: "/cockpit/debate",    label: "Debates",      icon: <MessagesSquare size={14} />, live: true },
  { href: "/cockpit/ask",       label: "Ask the team", icon: <CircleHelp size={14} /> },
  { href: "/cockpit/roadmap",   label: "Roadmap",      icon: <Map size={14} />, badge: <HackathonDayBadge /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Workspace sidebar"
      className="sticky top-12 hidden h-[calc(100vh-3rem)] w-56 shrink-0 flex-col gap-4 border-r border-[var(--border-1)] bg-[var(--bg-0)] p-3 lg:flex"
    >
      <SectionLabel>Workspace</SectionLabel>
      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {NAV.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[12px] transition focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]",
                active
                  ? "bg-[var(--bg-2)] text-[var(--text-0)]"
                  : "text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text-1)]"
              )}
            >
              <span
                aria-hidden="true"
                className={active ? "text-[var(--amber)]" : "text-[var(--text-3)] group-hover:text-[var(--text-2)]"}
              >
                {it.icon}
              </span>
              <span className="flex-1">{it.label}</span>
              {it.live && (
                <span className="pulse-dot" aria-label="actividad en vivo" role="status" />
              )}
              {!it.live && it.badge !== undefined && it.badge !== null && (
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

      <div className="mt-auto border-t border-[var(--border-1)] pt-3">
        <HackathonFooter />
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
  // Presentational only for now; no click handler, so no hover affordance to avoid
  // signaling it's interactive.
  return (
    <div className="flex h-7 items-center gap-2.5 rounded-md px-2.5 text-[11px] text-[var(--text-2)]">
      <Pin size={12} className="text-[var(--text-3)]" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </div>
  );
}
