import { describe, expect, it } from "vitest";
import { createResponder, type IncomingMessage } from "../src/bot/responder.js";
import { CHIME_COOLDOWN_MS, shouldChime } from "../src/bot/chime.js";

function chatter(content: string, authorId: string): IncomingMessage {
  return {
    authorIsBot: false,
    system: false,
    mentionsBot: false,
    content,
    authorId,
    channelId: "room",
    displayName: authorId,
    place: 'server "night", channel "#pos-ronda"',
    mentionedUsers: [],
    inServer: true,
  };
}

describe("shouldChime", () => {
  const recent = [
    { at: 0, authorId: "ada" },
    { at: 1_000, authorId: "budi" },
    { at: 2_000, authorId: "ada" },
    { at: 3_000, authorId: "budi" },
  ];

  it("waits for a real conversation", () => {
    expect(
      shouldChime({ now: 3_000, recent: recent.slice(0, 3), lastSpokeAt: null, random: () => 0 }),
    ).toBe(false);
    expect(
      shouldChime({
        now: 4_000,
        recent: recent.map((mark) => ({ ...mark, authorId: "ada" })),
        lastSpokeAt: null,
        random: () => 0,
      }),
    ).toBe(false);
  });

  it("steps in only on the lucky roll, then waits", () => {
    expect(shouldChime({ now: 3_000, recent, lastSpokeAt: null, random: () => 0 })).toBe(true);
    expect(shouldChime({ now: 3_000, recent, lastSpokeAt: null, random: () => 0.99 })).toBe(false);
    expect(shouldChime({ now: 3_000, recent, lastSpokeAt: 1_000, random: () => 0 })).toBe(false);
    expect(
      shouldChime({ now: 3_000, recent, lastSpokeAt: 3_000 - CHIME_COOLDOWN_MS, random: () => 0 }),
    ).toBe(true);
  });
});

describe("createResponder chimes", () => {
  it("joins an active server chat and then stays quiet", async () => {
    let time = 1_000_000;
    let joining = false;
    const responder = createResponder({
      clock: () => time,
      random: () => 0,
      complete: async (messages) => {
        joining = messages[0]?.content.includes("Nobody called your name.") ?? false;
        return "Rice, then sleep.";
      },
    });

    const first = [chatter("what is for dinner", "ada"), chatter("rice", "budi"), chatter("too plain", "ada")];
    for (const message of first) {
      expect(await responder.handle(message)).toBeNull();
      time += 1_000;
    }

    expect(await responder.handle(chatter("I am still hungry", "budi"))).toBe("Rice, then sleep.");
    expect(joining).toBe(true);
    time += 1_000;
    expect(await responder.handle(chatter("me too", "ada"))).toBeNull();
  });
});
