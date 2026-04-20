import { Pool } from "pg";
import type { UserId } from "./data";
import { isWho } from "./who";

// Pool is shared across hot-reload cycles in dev.
declare global {
  // eslint-disable-next-line no-var
  var __drPool: Pool | undefined;
}

function createPool() {
  const host = process.env.DR_JOURNAL_HOST;
  const password = process.env.DR_JOURNAL_PASS;
  if (!host || !password) {
    throw new Error(
      "DR_JOURNAL_HOST / DR_JOURNAL_PASS missing — create .env.local"
    );
  }
  return new Pool({
    host,
    port: parseInt(process.env.DR_JOURNAL_PORT || "5432", 10),
    user: process.env.DR_JOURNAL_USER || "journal",
    password,
    database: process.env.DR_JOURNAL_DB || "depositrescue",
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = globalThis.__drPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__drPool = pool;

const envAuthor = process.env.DR_JOURNAL_AUTHOR;
export const AUTHOR: UserId = isWho(envAuthor) ? envAuthor : "matu";
