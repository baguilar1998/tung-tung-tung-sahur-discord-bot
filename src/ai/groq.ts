import type { ChatMessage } from "./prompt.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

export async function completeGroq(options: {
  apiKey: string;
  model: string;
  messages: readonly ChatMessage[];
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "tung-tung-tung-sahur/1.0",
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      max_tokens: 800,
      temperature: 0.8,
      reasoning_effort: "low",
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const detail = safeErrorText(await response.text());
    throw new Error(`Groq replied ${response.status}. ${detail}`.trim());
  }

  const body = (await response.json()) as GroqResponse;
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("Groq returned an empty reply.");
  }
  return content;
}

function safeErrorText(body: string): string {
  let message = body;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) message = parsed.error.message;
  } catch {
    message = body;
  }
  return message.replace(/gsk_[A-Za-z0-9]+/g, "[key]").replace(/\s+/g, " ").trim().slice(0, 180);
}
