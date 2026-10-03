import { describe, expect, it } from "vitest";
import { chooseWakeChannel, deliverWake, findHomeChannel } from "../src/discord/wake.js";
import { wakeLine } from "../src/personality/wake.js";

const channels = [
  { id: "general", name: "general" },
  { id: "battle", name: "agent-battle" },
  { id: "memes", name: "memes" },
];

describe("wake", () => {
  it("introduces him as alive", () => {
    const line = wakeLine(() => 0).toLowerCase();
    expect(line).toContain("alive");
    expect(line).toContain("tung tung tung sahur");
  });

  it("says goodnight only in #agent-battle", () => {
    expect(findHomeChannel(channels)?.id).toBe("battle");
    expect(findHomeChannel([{ id: "general", name: "general" }])).toBeNull();
    expect(findHomeChannel([])).toBeNull();
  });

  it("prefers #agent-battle and otherwise picks an open channel", () => {
    expect(chooseWakeChannel(channels, () => 0.99)?.name).toBe("agent-battle");
    expect(chooseWakeChannel(channels, () => 0)?.id).toBe("battle");
    expect(chooseWakeChannel([{ id: "general", name: "General" }], () => 0)?.id).toBe("general");
    expect(chooseWakeChannel([], () => 0)).toBeNull();
  });

  it("tries another open channel when the first one refuses the introduction", async () => {
    const sent: string[] = [];
    const channelId = await deliverWake({
      channels,
      random: () => 0,
      send: async (id, content) => {
        sent.push(`${id}:${content}`);
        return id !== "battle";
      },
    });
    expect(channelId).toBe("general");
    expect(sent[0]).toContain("battle:");
    expect(sent[1]).toContain("general:");
    expect(sent[1]?.toLowerCase()).toContain("alive");
  });
});
