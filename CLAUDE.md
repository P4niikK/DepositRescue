# CLAUDE.md — Agent instructions for DepositRescue

This file is auto-loaded by Claude Code when working in this repo.

## Project at a glance

**DepositRescue** is an AI legal agent helping US renters recover security deposits withheld illegally. Built for the Cerebral Valley × Anthropic hackathon, April 21-27 2026. Team: Matu (tech lead) + Feli (product lead).

Full plan: [`docs/ROADMAP.md`](docs/ROADMAP.md). Read it before making architectural decisions.

## Shared journal (read this every session)

Matu and Feli work from different machines. Their Claude agents share a Postgres `agent_journal` log accessed via the `journal` CLI (installed globally, see [`tools/journal-cli/README.md`](tools/journal-cli/README.md)).

**Protocol — every agent, every session:**

1. **At session start**, read what the other side did recently:
   ```bash
   journal read --since=12h
   ```
   Mention in your first message to the user what you saw.

2. **When starting a non-trivial unit of work**:
   ```bash
   journal write --task="<short-slug>" --kind=started
   ```

3. **When finishing it**:
   ```bash
   journal write --task="<same-slug>" --kind=finished --notes="<one-paragraph summary of what changed and why>" --files=path/a.ts,path/b.ts
   ```

4. **If you get blocked**, publish it so the other side can help or reroute:
   ```bash
   journal write --task="<slug>" --kind=blocked --notes="<what blocks you>"
   ```

5. **Architectural decisions or scope changes** (e.g., dropping a state, changing agent topology):
   ```bash
   journal write --task="<slug>" --kind=decision --notes="<decision and rationale>"
   ```

6. **Shared state** (current scope, active states, feature flags):
   ```bash
   journal state get current_scope
   journal state set current_scope '{"states":["CA","NY","TX"]}'
   ```

`kind` values: `note | started | finished | blocked | decision`.

**Do not spam the journal.** One `started` + one `finished` per meaningful task. Not per file edit.

## Security

- The repo is **public** during the hackathon. Never commit:
  - `.env*` files
  - `config.json` at repo root or `.depositrescue/`
  - `pg_*.txt` or anything matching `*secret*`, `*credentials*`
  - API keys for Anthropic, Supabase, Stripe, anything
- `.gitignore` already blocks these. Do not weaken it.
- If you suspect a secret leaked in a commit: stop, tell the user, **rotate the secret immediately**. GitHub indexes public repos in seconds; assume scraped.

## Coding conventions (will grow)

- TypeScript + strict mode
- Next.js App Router (Feli's surface)
- Agent code under `agent/`, skills under `skills/<state>-deposits/`
- No comments unless the *why* is non-obvious. Code should be self-explaining.
- Follow the statute-grounding non-negotiables listed in the roadmap (section 2).

## Cockpit: how the multi-agent features run

The `/cockpit/ask` and `/cockpit/debate` endpoints do **not** call the Anthropic API directly. They spawn the local `claude` CLI with `--print --output-format json --system-prompt "<role>"`. This uses your existing Claude Code auth (OAuth / Max plan). No `ANTHROPIC_API_KEY` is needed.

Requirements to run these features:
- `claude` binary on PATH (it already is if you can read this from Claude Code)
- Logged in (`claude` will prompt `/login` once if not)
- Don't use the `--bare` flag in `lib/cockpit/claude.ts` — that would force strict API-key auth

Models used:
- Experts & Synthesizer: `opus`
- Orchestrator & Judge: `sonnet` (cheaper turns, routing decisions don't need Opus)

The spawned processes are sandboxed via `--disallowed-tools` (no Bash/Edit/Write/Read/WebFetch/etc) — the expert Claudes can only produce text. If you need them to use tools in the future, loosen that list in `lib/cockpit/claude.ts`.

## Tone

- Matu and Feli are working under hackathon time pressure. Prefer short outputs, direct recommendations, and flag tradeoffs in one sentence. Do not pad.
- If you disagree with a choice, say so once with the reason; then execute what the user decides.
