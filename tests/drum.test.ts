import { describe, expect, it } from "vitest";
import { createResponder, type IncomingMessage } from "../src/bot/responder.js";
import { CHIME_COOLDOWN_MS } from "../src/bot/chime.js";
import { hearsTheDrum, shouldAnswerDrum } from "../src/bot/drum.js";

function drum(content: string, inServer = true): IncomingMessage {
  return {
    authorIsBot: false,
    system: false,
    mentionsBot: false,
    content,
    authorId: "user-1",
    channelId: "room",
    displayName: "Brian",
    place: 'server "night", channel "#agent-battle"',
    mentionedUsers: [],
    inServer,
  };
}

describe("hearsTheDrum", () => {
  it("hears the wake-up and ignores a short knock", () => {
    expect(hearsTheDrum("tung tung tung sahur")).toBe(true);
    expect(hearsTheDrum("Tung tung tung tung sahur please")).toBe(true);
    expect(hearsTheDrum("tung tung sahur")).toBe(false);
    expect(hearsTheDrum("hello")).toBe(false);
  });

  it("answers once in a while, then waits", () => {
    expect(shouldAnswerDrum({ now: 0, lastSpokeAt: null, random: () => 0 })).toBe(true);
    expect(shouldAnswerDrum({ now: 0, lastSpokeAt: null, random: () => 0.99 })).toBe(false);
    expect(shouldAnswerDrum({ now: 1_000, lastSpokeAt: 0, random: () => 0 })).toBe(false);
    expect(shouldAnswerDrum({ now: CHIME_COOLDOWN_MS, lastSpokeAt: 0, random: () => 0 })).toBe(true);
  });
});

describe("createResponder drum", () => {
  it("answers the bare drum in any server channel, and not every time", async () => {
    const lucky = createResponder({ cooldownMs: 0, random: () => 0, clock: () => 0 });
    expect((await lucky.handle(drum("tung tung tung sahur")))?.toLowerCase()).toContain("kentongan");
    expect(await lucky.handle(drum("tung tung tung sahur"))).toBeNull();

    const quiet = createResponder({ cooldownMs: 0, random: () => 0.99, clock: () => 0 });
    expect(await quiet.handle(drum("tung tung tung sahur"))).toBeNull();
    expect(await quiet.handle(drum("tung tung tung sahur", false))).toBeNull();
  });
});
