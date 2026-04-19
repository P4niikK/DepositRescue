import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-[var(--text-3)] uppercase">
          <span className="pulse-dot" /> hackathon · day 1 / 7
        </div>
        <h1 className="font-sans text-4xl font-semibold tracking-tight text-[var(--text-0)]">
          DepositRescue
        </h1>
        <p className="text-[var(--text-2)]">
          AI legal agent helping US renters recover security deposits
          withheld illegally. Product UI coming. Team cockpit already live.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/cockpit"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--amber)] transition hover:bg-[var(--amber)]/15"
          >
            open cockpit →
          </Link>
          <a
            href="https://github.com/P4niikK/DepositRescue"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-2)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-2)] transition hover:border-[var(--border-3)] hover:text-[var(--text-1)]"
          >
            github
          </a>
        </div>
      </div>
    </main>
  );
}
