#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Client } = require('pg');

const CONFIG_PATH = path.join(os.homedir(), '.depositrescue', 'config.json');

function loadConfig() {
  let cfg = {};
  if (fs.existsSync(CONFIG_PATH)) {
    cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  return {
    host: process.env.DR_JOURNAL_HOST || cfg.host,
    port: parseInt(process.env.DR_JOURNAL_PORT || cfg.port || '5432', 10),
    user: process.env.DR_JOURNAL_USER || cfg.user || 'journal',
    password: process.env.DR_JOURNAL_PASS || cfg.password,
    database: process.env.DR_JOURNAL_DB || cfg.database || 'depositrescue',
    author: process.env.DR_JOURNAL_AUTHOR || cfg.author,
    session: process.env.DR_JOURNAL_SESSION || cfg.session || null,
  };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else { out[a.slice(2)] = argv[++i]; }
    } else out._.push(a);
  }
  return out;
}

function parseSince(s) {
  if (!s) return null;
  const m = s.match(/^(\d+)\s*(m|h|d)$/);
  if (!m) return s;
  const n = parseInt(m[1], 10);
  const mult = { m: 60, h: 3600, d: 86400 }[m[2]];
  return new Date(Date.now() - n * mult * 1000).toISOString();
}

async function withClient(cfg, fn) {
  const c = new Client({
    host: cfg.host, port: cfg.port, user: cfg.user,
    password: cfg.password, database: cfg.database,
  });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

async function cmdWrite(cfg, args) {
  if (!cfg.author) throw new Error('DR_JOURNAL_AUTHOR not set (matu | feli)');
  const kind = args.kind || 'note';
  const task = args.task;
  const notes = args.notes || null;
  const files = args.files ? args.files.split(',').map(s => s.trim()) : [];
  if (!task) throw new Error('--task required');
  await withClient(cfg, async (c) => {
    const r = await c.query(
      `INSERT INTO agent_journal (author, kind, task, notes, files, session_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, ts`,
      [cfg.author, kind, task, notes, files, cfg.session]
    );
    console.log(`#${r.rows[0].id} @ ${r.rows[0].ts.toISOString()} [${cfg.author}/${kind}] ${task}`);
  });
}

async function cmdRead(cfg, args) {
  const limit = parseInt(args.limit || '30', 10);
  const author = args.author || null;
  const since = parseSince(args.since);
  const where = [];
  const params = [];
  if (author) { params.push(author); where.push(`author = $${params.length}`); }
  if (since) { params.push(since); where.push(`ts >= $${params.length}`); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  params.push(limit);
  await withClient(cfg, async (c) => {
    const r = await c.query(
      `SELECT id, ts, author, kind, task, notes, files
       FROM agent_journal ${whereClause}
       ORDER BY ts DESC LIMIT $${params.length}`,
      params
    );
    for (const row of r.rows.reverse()) {
      const ts = row.ts.toISOString().replace('T', ' ').slice(0, 19);
      const files = row.files && row.files.length ? ` files=[${row.files.join(', ')}]` : '';
      const notes = row.notes ? `\n    ${row.notes.replace(/\n/g, '\n    ')}` : '';
      console.log(`#${row.id} ${ts} [${row.author}/${row.kind}] ${row.task}${files}${notes}`);
    }
  });
}

async function cmdStateSet(cfg, args) {
  if (!cfg.author) throw new Error('DR_JOURNAL_AUTHOR not set');
  const [, , , key, ...rest] = process.argv;
  const valueRaw = rest.join(' ');
  if (!key || !valueRaw) throw new Error('usage: journal state set <key> <json>');
  let value;
  try { value = JSON.parse(valueRaw); }
  catch { value = valueRaw; }
  await withClient(cfg, async (c) => {
    await c.query(
      `INSERT INTO agent_state (key, value, author, updated)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, author = EXCLUDED.author, updated = now()`,
      [key, JSON.stringify(value), cfg.author]
    );
    console.log(`state[${key}] updated by ${cfg.author}`);
  });
}

async function cmdStateGet(cfg) {
  const key = process.argv[4];
  await withClient(cfg, async (c) => {
    if (key) {
      const r = await c.query(`SELECT value, author, updated FROM agent_state WHERE key = $1`, [key]);
      if (!r.rows.length) { console.log('(not set)'); return; }
      const row = r.rows[0];
      console.log(`${key} (by ${row.author} @ ${row.updated.toISOString()}):`);
      console.log(JSON.stringify(row.value, null, 2));
    } else {
      const r = await c.query(`SELECT key, value, author, updated FROM agent_state ORDER BY updated DESC`);
      for (const row of r.rows) {
        console.log(`${row.key} (by ${row.author} @ ${row.updated.toISOString()}): ${JSON.stringify(row.value)}`);
      }
    }
  });
}

async function cmdPing(cfg) {
  await withClient(cfg, async (c) => {
    const r = await c.query('SELECT now() as server_time, inet_client_addr() as from_ip, current_user as db_user');
    const row = r.rows[0];
    console.log(`OK host=${cfg.host} user=${row.db_user} from=${row.from_ip} server=${row.server_time.toISOString()}`);
  });
}

function help() {
  console.log(`DepositRescue journal CLI

  journal ping                                       Test connection
  journal write --task="..." [--kind=note|started|finished|blocked|decision]
                [--notes="..."] [--files=a.ts,b.ts]
  journal read  [--author=matu|feli] [--since=2h|1d] [--limit=30]
  journal state get [key]
  journal state set <key> <value-or-json>

Config: ~/.depositrescue/config.json  OR env DR_JOURNAL_{HOST,PASS,AUTHOR,...}
Required: host, password, author`);
}

(async () => {
  const cfg = loadConfig();
  const cmd = process.argv[2];
  const hasSub = cmd === 'state';
  const sub = hasSub ? process.argv[3] : null;
  const rest = process.argv.slice(hasSub ? 4 : 3);
  const args = parseArgs(rest);
  try {
    if (cmd === 'ping') await cmdPing(cfg);
    else if (cmd === 'write') await cmdWrite(cfg, args);
    else if (cmd === 'read') await cmdRead(cfg, args);
    else if (cmd === 'state' && sub === 'get') await cmdStateGet(cfg);
    else if (cmd === 'state' && sub === 'set') await cmdStateSet(cfg, args);
    else help();
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
})();
