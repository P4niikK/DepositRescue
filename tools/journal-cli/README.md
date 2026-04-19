# depositrescue-journal

Shared journal CLI for Matu/Feli agents working on DepositRescue.

Reads and writes to a Postgres `agent_journal` table hosted on Matu's PC, accessed over a Tailscale tunnel. Both Claude CLIs invoke this tool via Bash to share context across machines.

## Install (per-user)

```bash
cd <repo>/tools/journal-cli
npm install
npm link
```

## Configure

Create `~/.depositrescue/config.json`:

```json
{
  "host": "100.82.217.45",
  "port": 5432,
  "user": "journal",
  "password": "<ASK MATU>",
  "database": "depositrescue",
  "author": "feli"
}
```

Set `author` to `matu` or `feli`. File permissions: `chmod 600`.

Alternative: env vars `DR_JOURNAL_{HOST,PASS,AUTHOR,DB,USER,PORT}`.

## Commands

```bash
journal ping                                           # connection test
journal write --task="vision-pipeline" --kind=started
journal write --task="vision-pipeline" --kind=finished --notes="CA case flows E2E" --files=agent/vision.ts,agent/router.ts
journal read                                           # last 30 entries
journal read --author=matu --since=2h                  # filter
journal state set current_scope '{"states":["CA","NY","TX"]}'
journal state get current_scope
```

`kind` options: `started | finished | blocked | decision | note`.
`since` format: `30m`, `2h`, `1d`, or ISO timestamp.

## Schema

See `init.sql`. Two tables:
- `agent_journal` — append-only log of actions per agent
- `agent_state` — shared key/value for current project state (scope, blockers, decisions)
