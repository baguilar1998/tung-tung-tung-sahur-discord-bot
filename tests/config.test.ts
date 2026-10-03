import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("reads a token", () => {
    expect(loadConfig({ DISCORD_TOKEN: " real-token " }).discordToken).toBe("real-token");
  });

  it("rejects a missing token and the example placeholder", () => {
    expect(() => loadConfig({})).toThrow(/DISCORD_TOKEN/);
    expect(() => loadConfig({ DISCORD_TOKEN: "your-bot-token" })).toThrow(/placeholder/);
  });

  it("treats a missing Groq key as prepared lines, and keeps a real key", () => {
    expect(loadConfig({ DISCORD_TOKEN: "real-token" }).groqApiKey).toBeNull();
    expect(loadConfig({ DISCORD_TOKEN: "real-token", GROQ_API_KEY: "your-groq-key" }).groqApiKey).toBeNull();
    expect(loadConfig({ DISCORD_TOKEN: "real-token", GROQ_API_KEY: " gsk_real " }).groqApiKey).toBe("gsk_real");
    expect(loadConfig({ DISCORD_TOKEN: "real-token" }).groqModel).toBe("openai/gpt-oss-120b");
  });
});
