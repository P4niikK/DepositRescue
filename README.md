# DepositRescue

AI legal agent that helps US renters recover security deposits withheld illegally by landlords.

Built for the Cerebral Valley × Anthropic "Built with Opus 4.7" hackathon, April 21-27 2026.
Team: Matu + Feli.

## What it does

User uploads: lease, move-in photos, move-out photos, landlord's itemization letter.

Claude Opus 4.7 agent:
1. Detects state jurisdiction
2. Loads state-specific skill (CA, NY, TX, FL, IL, GA, NC, PA, OH, MI)
3. Vision comparison: move-in vs move-out photos per feature
4. Validates each landlord deduction against state statute
5. Calculates recoverable amount including statutory penalties
6. Drafts demand letter with exact code citations
7. Generates small-claims filing package

## Stack

- **Agent:** Claude Opus 4.7 via Claude Code + Agent SDK (skills, subagents, vision, prompt caching)
- **Frontend:** Next.js 14 + Tailwind + shadcn/ui on Vercel
- **Database:** Supabase (Postgres + Auth + Storage)
- **PDF:** react-pdf / Puppeteer

## Repo structure (evolving)

```
.
├── CLAUDE.md                # Instructions for Claude Code agents
├── app/                     # Next.js app (Feli)
├── agent/                   # Agent orchestration + subagents (Matu)
├── skills/                  # State-specific statutes + core skills
├── tools/journal-cli/       # Shared journal CLI (Matu/Feli sync tool)
└── docs/
    ├── ROADMAP.md
    ├── SETUP-FELI.md
    └── INFRA-NOTES.md
```

## Shared work log

Both of us use a shared Postgres journal (hosted on Matu's PC, over Tailscale) so our Claude agents see what the other is doing. See [`tools/journal-cli/README.md`](tools/journal-cli/README.md) and [`docs/SETUP-FELI.md`](docs/SETUP-FELI.md).
