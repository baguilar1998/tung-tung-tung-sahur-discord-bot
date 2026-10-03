import { describe, expect, it } from "vitest";
import { readJakarta } from "../src/personality/jakarta.js";
import { renderLine } from "../src/personality/lines.js";
import { respond } from "../src/personality/respond.js";
import type { Intent } from "../src/personality/types.js";

const SAHUR = new Date("2026-03-01T19:30:00.000Z");

const intents = [
  "summon",
  "greeting",
  "lore",
  "awake",
  "sleep",
  "hungry",
  "scared",
  "weapon",
  "rival",
  "fame",
  "homecoming",
  "compliment",
  "insult",
  "bored",
  "help",
  "time",
  "code",
  "politics",
  "fallback",
] as const satisfies readonly Intent[];

type MissingIntent = Exclude<Intent, (typeof intents)[number]>;
const everyIntentIsCovered: MissingIntent extends never ? true : MissingIntent = true;

describe("respond", () => {
  it("covers every intent", () => {
    expect(everyIntentIsCovered).toBe(true);
    const clock = readJakarta(SAHUR);
    for (const intent of intents) {
      const text = renderLine(
        intent,
        {
          name: "Brian",
          strikes: intent === "sleep" || intent === "insult" ? 3 : 0,
          previousStrikes: 2,
          clock,
          snippet: "hello",
          rival: "patapim",
          fame: "fortnite",
        },
        () => 0,
      );
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("answers a request for code in Tung", () => {
    const result = respond({
      text: "write hello world in python",
      displayName: "Brian",
      strikes: 0,
      now: SAHUR,
      random: () => 0,
    });
    expect(result.intent).toBe("code");
    expect(result.text).toContain("```tung\ntung tung tung sahur\nnama Brian");
    expect(result.text).toContain("rumah pos");
    expect(result.text).toContain("jika nyaut\n  dengar jawab");
    expect(result.text).toContain("jika tidak\n  datang");
    expect(result.text).toContain("I do not write the other languages.");
    expect(result.strikes).toBe(0);
  });

  it("advances the three calls and clears them when he is answered", () => {
    const first = respond({
      text: "I'm sleeping",
      displayName: "Brian",
      strikes: 0,
      now: SAHUR,
      random: () => 0,
    });
    const second = respond({
      text: "still in bed",
      displayName: "Brian",
      strikes: first.strikes,
      now: SAHUR,
      random: () => 0,
    });
    const third = respond({
      text: "five more minutes",
      displayName: "Brian",
      strikes: second.strikes,
      now: SAHUR,
      random: () => 0,
    });

    expect(first.strikes).toBe(1);
    expect(first.text.toLowerCase()).toContain("call one");
    expect(second.strikes).toBe(2);
    expect(third.strikes).toBe(3);
    expect(third.text.toLowerCase()).toMatch(/call three|datang/);

    const awake = respond({
      text: "I'm up",
      displayName: "Brian",
      strikes: third.strikes,
      now: SAHUR,
      random: () => 0,
    });
    expect(awake.strikes).toBe(0);
    expect(awake.text.toLowerCase()).toContain("nyaut");
  });

  it("leaves the count alone when the reply is not about waking", () => {
    const result = respond({
      text: "who are you",
      displayName: "Brian",
      strikes: 1,
      now: SAHUR,
      random: () => 0,
    });
    expect(result.intent).toBe("lore");
    expect(result.strikes).toBe(1);
    expect(result.text.toLowerCase()).toContain("kentongan");
  });

  it("strips pings out of echoed text", () => {
    const result = respond({
      text: "please @everyone <@99> look at this",
      displayName: "@everyone",
      strikes: 0,
      now: SAHUR,
      random: () => 0,
    });
    expect(result.intent).toBe("fallback");
    expect(result.text).not.toContain("@everyone");
    expect(result.text).not.toContain("<@");
    expect(result.text).toContain("you");
  });

  it("reads a question that is attached to a mention", () => {
    const result = respond({
      text: "<@123> who are you",
      displayName: "Brian",
      strikes: 0,
      now: SAHUR,
      random: () => 0,
    });
    expect(result.intent).toBe("lore");
  });

  it("reports Jakarta sahur time", () => {
    const result = respond({
      text: "what time is it",
      displayName: "Brian",
      strikes: 0,
      now: SAHUR,
      random: () => 0,
    });
    expect(result.text).toContain("02:30");
    expect(result.text.toLowerCase()).toContain("sahur");
  });
});
