-- Checklist compartida (cockpit wave 2)
-- Run from Matu's PC:
--   psql -U postgres -d depositrescue -f 002_checklist.sql

CREATE TABLE IF NOT EXISTS agent_checklist (
  id         bigserial PRIMARY KEY,
  created_ts timestamptz NOT NULL DEFAULT now(),
  updated_ts timestamptz NOT NULL DEFAULT now(),
  category   text NOT NULL,
  title      text NOT NULL,
  tags       text[] DEFAULT '{}',
  assignee   text CHECK (assignee IS NULL OR assignee IN ('matu', 'feli')),
  done       boolean NOT NULL DEFAULT false,
  done_by    text CHECK (done_by IS NULL OR done_by IN ('matu', 'feli')),
  done_at    timestamptz,
  created_by text NOT NULL CHECK (created_by IN ('matu', 'feli')),
  position   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_checklist_cat_idx ON agent_checklist (category, position);
CREATE INDEX IF NOT EXISTS agent_checklist_done_idx ON agent_checklist (done, updated_ts DESC);

-- Grant to the journal role
GRANT SELECT, INSERT, UPDATE ON agent_checklist TO journal;
GRANT USAGE, SELECT ON SEQUENCE agent_checklist_id_seq TO journal;
