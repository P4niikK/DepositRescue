import { USERS, type UserId } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";

const STYLES: Record<UserId, { bg: string; fg: string }> = {
  matu: { bg: "oklch(40% 0.08 230)", fg: "oklch(96% 0.02 230)" },
  feli: { bg: "oklch(40% 0.07 155)", fg: "oklch(96% 0.02 155)" },
};

export function Avatar({
  who,
  size = 20,
  className,
}: {
  who: UserId;
  size?: number;
  className?: string;
}) {
  const u = USERS[who];
  const s = STYLES[who];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono font-semibold",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        background: s.bg,
        color: s.fg,
      }}
    >
      {u.initials}
    </span>
  );
}
