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
});
