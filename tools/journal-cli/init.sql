-- DepositRescue journal schema
CREATE DATABASE depositrescue;

\c depositrescue

CREATE TABLE agent_journal (
  id           bigserial PRIMARY KEY,
  ts           timestamptz NOT NULL DEFAULT now(),
  author       text NOT NULL CHECK (author IN ('matu', 'feli')),
  kind         text NOT NULL CHECK (kind IN ('started', 'finished', 'blocked', 'note', 'decision')),
  task         text NOT NULL,
  files        text[] DEFAULT '{}',
  notes        text,
  session_id   text
);

CREATE INDEX agent_journal_ts_idx ON agent_journal (ts DESC);
CREATE INDEX agent_journal_author_idx ON agent_journal (author, ts DESC);

-- Optional: a free-form kv table for shared state (current scope, TODOs, etc.)
CREATE TABLE agent_state (
  key     text PRIMARY KEY,
  value   jsonb NOT NULL,
  updated timestamptz NOT NULL DEFAULT now(),
  author  text
);
