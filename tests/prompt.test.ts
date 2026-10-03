import { describe, expect, it } from "vitest";
import { buildChatMessages, cleanModelReply } from "../src/ai/prompt.js";
import { CHARACTER_SHEET } from "../src/personality/character.js";
import { readJakarta } from "../src/personality/jakarta.js";
import type { Intent } from "../src/personality/types.js";

const clock = readJakarta(new Date("2026-03-01T19:30:00.000Z"));

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
const everyIntentIsDescribed: MissingIntent extends never ? true : MissingIntent = true;

describe("character sheet", () => {
  it("carries the researched voice", () => {
    expect(everyIntentIsDescribed).toBe(true);
    const sheet = CHARACTER_SHEET.toLowerCase();
    for (const fact of [
      "kentongan",
      "pentungan",
      "sahur",
      "tidak nyaut",
      "pos ronda",
      "triple t",
      "patapim",
      "tralalero",
      "bombardiro",
      "cappuccina",
      "bare feet",
      "jakarta",
      "fortnite",
      "hiii, seremnya",
      "you are a democrat",
      "you are left",
    ]) {
      expect(sheet).toContain(fact);
    }
  });
});

describe("buildChatMessages", () => {
  it("sends the sheet, the call count, and the latest words", () => {
    const messages = buildChatMessages({
      history: [{ role: "user", content: "Brian: who are you" }, { role: "assistant", content: "I am the drum." }],
      speaker: "Brian",
      userText: "<@123> I'm sleeping @everyone",
      strikes: 1,
      previousStrikes: 0,
      intent: "sleep",
      clock,
    });

    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("kentongan");
    expect(messages[0]?.content).toContain("02:30");
    expect(messages[0]?.content).toContain("Call count for Brian after this message: 1 of 3.");
    expect(messages[0]?.content).toContain("refusing to wake up");
    expect(messages[messages.length - 1]?.content).toBe("Brian: I'm sleeping");
    expect(messages[messages.length - 1]?.content).not.toContain("@everyone");
    expect(messages[messages.length - 1]?.content).not.toContain("<@");
  });

  it("tells him when an answer cleared the count", () => {
    const messages = buildChatMessages({
      history: [],
      speaker: "Brian",
      userText: "I'm up",
      strikes: 0,
      previousStrikes: 2,
      intent: "awake",
      clock,
    });
    expect(messages[0]?.content).toContain("The count was just cleared");
  });

  it("asks for a full walk when they want code", () => {
    const messages = buildChatMessages({
      history: [],
      speaker: "Brian",
      userText: "can you write me an example on how you would make an API request?",
      strikes: 0,
      previousStrikes: 0,
      intent: "code",
      clock,
    });
    const sheet = messages[0]?.content ?? "";
    expect(sheet).toContain("rumah");
    expect(sheet).toContain("jika nyaut");
    expect(sheet).toContain("Do not answer that job with the same ketuk three times.");
  });

  it("makes him name a side when they ask for one", () => {
    const messages = buildChatMessages({
      history: [],
      speaker: "Brian",
      userText: "do you identify as a democrat or a republican?",
      strikes: 0,
      previousStrikes: 0,
      intent: "politics",
      clock,
    });
    const sheet = messages[0]?.content ?? "";
    expect(sheet).toContain("the first sentence must say you identify as a Democrat");
    expect(sheet).not.toContain("Do not endorse a real party");
  });
});

describe("cleanModelReply", () => {
  it("drops hidden reasoning and pings", () => {
    expect(cleanModelReply("<think>count to three</think> Tung. Get up.")).toBe("Tung. Get up.");
    expect(cleanModelReply("Hello @everyone <@99>")).toBe("Hello");
    expect(cleanModelReply("<think>only thoughts</think>")).toBeNull();
  });

  it("keeps a Tung program intact", () => {
    const reply = cleanModelReply("Python is a snake.\n```tung\ntung tung tung sahur\nnama dunia\nselesai\n```");
    expect(reply).toContain("```tung\ntung tung tung sahur\nnama dunia\nselesai\n```");
    expect(reply).toContain("Python is a snake."); 
  });
});
