import { describe, expect, it } from "vitest";
import { completeGroq } from "../src/ai/groq.js";

describe("completeGroq", () => {
  it("returns the spoken content and ignores the reasoning field", async () => {
    const reply = await completeGroq({
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "who are you" }],
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "I am the kentongan.", reasoning: "hidden" } }],
          }),
          { status: 200 },
        ),
    });
    expect(reply).toBe("I am the kentongan.");
  });

  it("leaves room for a longer Tung program", async () => {
    let sent = "";
    await completeGroq({
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "write an api request" }],
      fetchImpl: async (_url, init) => {
        sent = String(init?.body ?? "");
        return new Response(JSON.stringify({ choices: [{ message: { content: "tung" } }] }), { status: 200 });
      },
    });
    expect(JSON.parse(sent).max_tokens).toBeGreaterThanOrEqual(600);
  });

  it("fails closed when Groq is unhappy", async () => {
    await expect(
      completeGroq({
        apiKey: "gsk_secret",
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: "hello" }],
        fetchImpl: async () => new Response(JSON.stringify({ error: { message: "rate limit for gsk_secret" } }), { status: 429 }),
      }),
    ).rejects.toThrow(/429/);
  });
});
