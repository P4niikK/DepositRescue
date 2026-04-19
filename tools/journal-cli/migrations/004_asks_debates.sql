-- Wave 2: asks and debates. JSONB for the body to keep the schema simple.

CREATE TABLE IF NOT EXISTS agent_asks (
  id         bigserial PRIMARY KEY,
  created_ts timestamptz NOT NULL DEFAULT now(),
  updated_ts timestamptz NOT NULL DEFAULT now(),
  author     text NOT NULL CHECK (author IN ('matu', 'feli')),
  prompt     text NOT NULL,
  experts    text[] NOT NULL,
  synthesize boolean NOT NULL DEFAULT true,
  status     text NOT NULL DEFAULT 'running' CHECK (status IN ('running','done','error')),
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- data shape:
  -- { "answers": [{"expert":"arq","status":"done"|"error","content":"...","ms":123}],
  --   "synthesis": {"headline":"...","points":[...],"dissent":"..."} | null,
  --   "error": "..." | null }
  pinned_commit text
);

CREATE INDEX IF NOT EXISTS agent_asks_ts_idx ON agent_asks (created_ts DESC);

CREATE TABLE IF NOT EXISTS agent_debates (
  id         bigserial PRIMARY KEY,
  created_ts timestamptz NOT NULL DEFAULT now(),
  updated_ts timestamptz NOT NULL DEFAULT now(),
  author     text NOT NULL CHECK (author IN ('matu', 'feli')),
  prompt     text NOT NULL,
  status     text NOT NULL DEFAULT 'live' CHECK (status IN ('live','closed','error')),
  round      integer NOT NULL DEFAULT 0,
  include_devil boolean NOT NULL DEFAULT true,
  max_rounds integer NOT NULL DEFAULT 5,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- data shape:
  -- { "experts": ["arq","product",...],
  --   "orchestrator_reasoning": "...",
  --   "rounds": [{"n":1,"turns":[{"expert":"arq","content":"..."}]}],
  --   "judgements": [{"round":1,"verdict":"...","decision":"continue"|"close","focus_next":"..."}],
  --   "synthesis": {"headline":"...","points":[...],"dissent":"..."} | null,
  --   "error": "..." | null }
  pinned_commit text
);

CREATE INDEX IF NOT EXISTS agent_debates_ts_idx ON agent_debates (created_ts DESC);

GRANT SELECT, INSERT, UPDATE ON agent_asks, agent_debates TO journal;
GRANT USAGE, SELECT ON SEQUENCE agent_asks_id_seq, agent_debates_id_seq TO journal;
