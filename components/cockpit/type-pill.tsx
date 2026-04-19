import { TYPE_META, type ActivityKind } from "@/lib/cockpit/data";
import {
  Play, Check, Ban, Flag, StickyNote, GitCommitHorizontal,
  HelpCircle, ArrowRightLeft,
} from "lucide-react";
import type { ReactNode } from "react";

const ICONS: Record<ActivityKind, ReactNode> = {
  started:  <Play    size={11} />,
  finished: <Check   size={11} />,
  blocked:  <Ban     size={11} />,
  decided:  <Flag    size={11} />,
  note:     <StickyNote size={11} />,
  commit:   <GitCommitHorizontal size={11} />,
  question: <HelpCircle size={11} />,
  handoff:  <ArrowRightLeft size={11} />,
};

export function TypeIcon({ type }: { type: ActivityKind }) {
  const meta = TYPE_META[type];
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
      style={{
        background: `color-mix(in oklch, ${meta.colorVar} 18%, transparent)`,
        color: meta.colorVar,
      }}
    >
      {ICONS[type]}
    </span>
  );
}

export function TypeTag({ type }: { type: ActivityKind }) {
  const meta = TYPE_META[type];
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-wider"
      style={{ color: meta.colorVar }}
    >
      {meta.label}
    </span>
  );
}
