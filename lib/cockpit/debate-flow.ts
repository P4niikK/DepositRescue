// Core debate orchestration. Pure functions + DB helpers; no HTTP.
// Used by /api/debate/* routes.

import { pool } from "./db";
import {
  complete, parseJsonReply, MODEL_OPUS, MODEL_SONNET,
} from "./claude";
import {
  EXPERT_SPECS, orchestratorSystem, judgeSystem, synthesizerSystem,
} from "./experts";
import type { ExpertId } from "./data";

export type Turn = { expert: ExpertId; content: string; ms: number; error?: string };
export type Round = { n: number; turns: Turn[] };
export type Judgement = {
  round: number;
  verdict: string;
  decision: "continue" | "close";
  focus_next: string | null;
};
export type Synthesis = { headline: string; points: string[]; dissent: string };

export type DebateData = {
  experts: ExpertId[];
  orchestrator_reasoning?: string;
  rounds: Round[];
  judgements: Judgement[];
  synthesis: Synthesis | null;
  error: string | null;
};

export type DebateRow = {
  id: string;
  created_ts: string;
  updated_ts: string;
  author: "matu" | "feli";
  prompt: string;
  status: "live" | "closed" | "error";
  round: number;
  include_devil: boolean;
  max_rounds: number;
  data: DebateData;
  pinned_commit: string | null;
};

/** Orquestador: elige 2-4 expertos (sin devil). */
export async function pickExperts(prompt: string) {
  const raw = await complete({
    system: orchestratorSystem(),
    user: `PREGUNTA:\n${prompt}`,
    model: MODEL_SONNET,
  });
  const parsed = parseJsonReply<{ selected: ExpertId[]; reasoning: string }>(raw);
  const filtered = parsed.selected.filter(
    (e): e is ExpertId => e in EXPERT_SPECS && e !== "devil"
  );
  const clamped = filtered.slice(0, 4);
  if (clamped.length === 0) {
    // Fallback: sensible default
    return {
      selected: ["arq", "product"] as ExpertId[],
      reasoning: "fallback (orchestrator returned empty)",
    };
  }
  return { selected: clamped, reasoning: parsed.reasoning };
}

/** Arma el user-content para un experto en una ronda dada. */
function buildUserForExpert(
  debate: Pick<DebateRow, "prompt" | "data">,
  roundN: number,
  forExpert: ExpertId,
  previousTurnsThisRound?: Turn[]
): string {
  const parts: string[] = [];
  parts.push(`PREGUNTA DEL USUARIO:\n${debate.prompt}`);

  // History from previous rounds
  if (debate.data.rounds.length > 0) {
    parts.push("\nRONDAS PREVIAS:");
    debate.data.rounds.forEach((r) => {
      parts.push(`\n[Ronda ${r.n}]`);
      r.turns.forEach((t) => {
        const spec = EXPERT_SPECS[t.expert];
        parts.push(`— ${spec.role}:\n${t.content}`);
      });
      const j = debate.data.judgements.find((x) => x.round === r.n);
      if (j) {
        parts.push(
          `\n[Juez ronda ${r.n}] ${j.verdict}${
            j.focus_next ? `\nFoco próxima ronda: ${j.focus_next}` : ""
          }`
        );
      }
    });
  }

  // Current round's turns that already happened (e.g. devil sees the others first)
  if (previousTurnsThisRound && previousTurnsThisRound.length > 0) {
    parts.push(`\n[Ronda ${roundN} — turnos previos en esta ronda]`);
    previousTurnsThisRound.forEach((t) => {
      const spec = EXPERT_SPECS[t.expert];
      parts.push(`— ${spec.role}:\n${t.content}`);
    });
  }

  const role = EXPERT_SPECS[forExpert].role;
  if (roundN === 1) {
    parts.push(`\nAhora te toca a vos (${role}). Dejá tu posición inicial.`);
  } else {
    parts.push(`\nAhora te toca a vos (${role}) en la ronda ${roundN}. Respondé a lo nuevo que salió, ajustá tu posición si corresponde.`);
  }

  return parts.join("\n");
}

async function runTurn(
  debate: Pick<DebateRow, "prompt" | "data">,
  roundN: number,
  expert: ExpertId,
  previousTurnsThisRound?: Turn[]
): Promise<Turn> {
  const started = Date.now();
  try {
    const content = await complete({
      system: EXPERT_SPECS[expert].system,
      user: buildUserForExpert(debate, roundN, expert, previousTurnsThisRound),
      model: MODEL_OPUS,
    });
    return { expert, content, ms: Date.now() - started };
  } catch (e) {
    return {
      expert,
      content: "",
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

/** Ejecuta una ronda completa. Experts en paralelo. Devil al final (serial). */
export async function runRound(
  debate: Pick<DebateRow, "prompt" | "include_devil" | "data">,
  roundN: number
): Promise<Round> {
  const nonDevil = debate.data.experts.filter((e) => e !== "devil");
  const parallelTurns = await Promise.all(
    nonDevil.map((e) => runTurn(debate, roundN, e))
  );

  const turns: Turn[] = [...parallelTurns];

  if (debate.include_devil) {
    const devilTurn = await runTurn(debate, roundN, "devil", parallelTurns);
    turns.push(devilTurn);
  }

  return { n: roundN, turns };
}

export async function runJudge(
  debate: Pick<DebateRow, "prompt" | "max_rounds" | "data">,
  roundN: number
): Promise<Judgement> {
  const body = [
    `PREGUNTA:\n${debate.prompt}`,
    `\nMÁXIMO DE RONDAS: ${debate.max_rounds} (estás en ronda ${roundN}).`,
    "\nRONDAS HASTA AHORA:",
    ...debate.data.rounds.map((r) => {
      const turns = r.turns
        .map((t) => `— ${EXPERT_SPECS[t.expert].role}: ${t.content}`)
        .join("\n");
      return `\n[Ronda ${r.n}]\n${turns}`;
    }),
  ].join("\n");

  try {
    const raw = await complete({
      system: judgeSystem(),
      user: body,
      model: MODEL_SONNET,
    });
    const parsed = parseJsonReply<Judgement>(raw);
    // Force close if we hit max_rounds
    const decision: Judgement["decision"] =
      roundN >= debate.max_rounds ? "close" : parsed.decision;
    return { round: roundN, verdict: parsed.verdict, decision, focus_next: parsed.focus_next ?? null };
  } catch {
    return {
      round: roundN,
      verdict: "Juez no pudo parsear — cerrando.",
      decision: "close",
      focus_next: null,
    };
  }
}

export async function runSynthesis(
  debate: Pick<DebateRow, "prompt" | "data">
): Promise<Synthesis> {
  const body = [
    `PREGUNTA:\n${debate.prompt}`,
    "\nDEBATE COMPLETO:",
    ...debate.data.rounds.map((r) => {
      const turns = r.turns
        .map((t) => `— ${EXPERT_SPECS[t.expert].role}: ${t.content}`)
        .join("\n");
      return `\n[Ronda ${r.n}]\n${turns}`;
    }),
  ].join("\n");

  try {
    const raw = await complete({
      system: synthesizerSystem(),
      user: body,
      model: MODEL_OPUS,
    });
    return parseJsonReply<Synthesis>(raw);
  } catch {
    return {
      headline: "Sin síntesis: el sintetizador falló",
      points: [],
      dissent: "",
    };
  }
}

/** Persiste el nuevo estado completo de un debate. */
export async function saveDebate(
  id: string,
  patch: Partial<Pick<DebateRow, "status" | "round" | "data">>
) {
  const sets: string[] = ["updated_ts = now()"];
  const values: unknown[] = [];
  if (patch.status !== undefined) {
    values.push(patch.status);
    sets.push(`status = $${values.length}`);
  }
  if (patch.round !== undefined) {
    values.push(patch.round);
    sets.push(`round = $${values.length}`);
  }
  if (patch.data !== undefined) {
    values.push(patch.data);
    sets.push(`data = $${values.length}`);
  }
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE agent_debates SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] as DebateRow;
}

export async function fetchDebate(id: string): Promise<DebateRow | null> {
  const { rows } = await pool.query(
    `SELECT * FROM agent_debates WHERE id = $1`,
    [id]
  );
  return (rows[0] as DebateRow) ?? null;
}
