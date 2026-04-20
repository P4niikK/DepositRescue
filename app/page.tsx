import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl space-y-5 text-center">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase">
          <span className="pulse-dot" /> hackathon · day 1 / 7
        </div>
        <h1 className="font-sans text-[36px] font-semibold leading-[1.1] tracking-tight text-[var(--text-0)]">
          DepositRescue
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--text-2)]">
          AI legal agent helping US renters recover security deposits
          withheld illegally. Product UI coming. Team cockpit already live.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/cockpit"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--amber)] transition-colors hover:border-[var(--amber)] hover:bg-[color-mix(in_oklab,var(--amber)_18%,transparent)]"
          >
            open cockpit →
          </Link>
          <a
            href="https://github.com/P4niikK/DepositRescue"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-2)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-2)] transition-colors hover:border-[var(--border-3)] hover:text-[var(--text-1)]"
          >
            github
          </a>
        </div>
      </div>
    </main>
  );
}
