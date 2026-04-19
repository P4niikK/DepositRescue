// Claude Code CLI wrapper. We invoke the local `claude` binary — which is
// signed in with the user's OAuth — so there's no API key and no per-token
// billing. The CLI streams a single JSON object to stdout when called with
// `--output-format json` + `--print`.

import { spawn } from "child_process";

export type ClaudeModel = "opus" | "sonnet" | "haiku";

export const MODEL_OPUS: ClaudeModel = "opus";
export const MODEL_SONNET: ClaudeModel = "sonnet";
export const MODEL_HAIKU: ClaudeModel = "haiku";

/** Tools we never want an "expert" turn to invoke — purely chat. */
const DISALLOWED_TOOLS = [
  "Bash", "Edit", "Write", "Read", "Glob", "Grep",
  "WebFetch", "WebSearch", "NotebookEdit", "Task", "TodoWrite",
];

type ClaudeResult = {
  type: "result";
  subtype: "success" | string;
  is_error: boolean;
  result: string;
  duration_ms: number;
  session_id?: string;
};

export class ClaudeCliError extends Error {
  constructor(message: string, public stderr?: string) {
    super(message);
  }
}

export async function complete(opts: {
  system: string;
  user: string;
  model?: ClaudeModel;
  /** Hard cap in ms. Default 3 minutes per turn. */
  timeoutMs?: number;
}): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 180_000;

  // IMPORTANT: never put `opts.user` in argv. It can grow past Windows'
  // command-line limit (~32k chars) once debates accumulate rounds, producing
  // ENAMETOOLONG. We stream it via stdin. `opts.system` stays in argv (it's
  // bounded, ~3k chars per expert).
  const args = [
    "-p",
    "--system-prompt", opts.system,
    "--model", opts.model ?? "opus",
    "--output-format", "json",
    "--no-session-persistence",
    "--disallowed-tools", DISALLOWED_TOOLS.join(","),
  ];

  return new Promise<string>((resolve, reject) => {
    const child = spawn("claude", args, {
      windowsHide: true,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let killed = false;
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const killTimer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    child.stdin.on("error", (err) => {
      clearTimeout(killTimer);
      settle(() => reject(new ClaudeCliError(`claude stdin error: ${err.message}`, stderr)));
    });

    child.on("error", (err) => {
      clearTimeout(killTimer);
      settle(() => reject(new ClaudeCliError(`claude spawn failed: ${err.message}`, stderr)));
    });

    child.on("close", (code) => {
      clearTimeout(killTimer);
      if (killed) {
        return settle(() => reject(new ClaudeCliError(`claude timed out after ${timeoutMs}ms`, stderr)));
      }
      if (code !== 0) {
        return settle(() => reject(new ClaudeCliError(
          `claude exited with code ${code}: ${(stderr || stdout).slice(0, 500)}`,
          stderr
        )));
      }
      try {
        const parsed = JSON.parse(stdout) as ClaudeResult;
        if (parsed.is_error) {
          return settle(() => reject(new ClaudeCliError(`claude reported error: ${parsed.result}`, stderr)));
        }
        settle(() => resolve(parsed.result));
      } catch (e) {
        settle(() => reject(new ClaudeCliError(
          `could not parse claude output as JSON: ${e instanceof Error ? e.message : "unknown"}\nstdout head: ${stdout.slice(0, 200)}`,
          stderr
        )));
      }
    });

    // Stream the user prompt.
    child.stdin.write(opts.user);
    child.stdin.end();
  });
}

/** Parses a JSON object out of a model reply, tolerating code fences and prose. */
export function parseJsonReply<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const sliced = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(sliced) as T;
}
