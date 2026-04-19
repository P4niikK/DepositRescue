import Anthropic from "@anthropic-ai/sdk";

declare global {
  // eslint-disable-next-line no-var
  var __drAnthropic: Anthropic | undefined;
}

/** Lazy: only throws if something actually tries to call the API. */
export function getAnthropic(): Anthropic {
  if (globalThis.__drAnthropic) return globalThis.__drAnthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY missing — add it to .env.local");
  }
  const client = new Anthropic({ apiKey });
  if (process.env.NODE_ENV !== "production") globalThis.__drAnthropic = client;
  return client;
}

// Opus 4.7 is the hackathon model. Can be overridden per-call for cheaper roles.
export const MODEL_OPUS = "claude-opus-4-7";
export const MODEL_SONNET = "claude-sonnet-4-6";

/** Single non-streaming message. Returns assistant text. */
export async function complete(opts: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: opts.model ?? MODEL_OPUS,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Parses a JSON object out of a model reply, tolerating code fences. */
export function parseJsonReply<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : trimmed;
  // Find first { and matching last } in case the model chatters around.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const sliced = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(sliced) as T;
}
