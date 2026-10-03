import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../src/ai/prompt.js";
import { createResponder, type IncomingMessage } from "../src/bot/responder.js";

function mention(content: string, authorId = "user-1", channelId = "room"): IncomingMessage {
  return {
    authorIsBot: false,
    system: false,
    mentionsBot: true,
    content,
    authorId,
    channelId,
    displayName: "Brian",
    place: 'server "night", channel "#pos-ronda"',
    mentionedUsers: [],
    inServer: false,
  };
}

describe("createResponder", () => {
  it("answers a mention and ignores everything else", async () => {
    const responder = createResponder({ cooldownMs: 0, random: () => 0 });
    expect(await responder.handle({ ...mention("who are you"), mentionsBot: false })).toBeNull();
    expect(await responder.handle({ ...mention("who are you"), authorIsBot: true })).toBeNull();
    expect(await responder.handle({ ...mention("who are you"), system: true })).toBeNull();
    expect((await responder.handle(mention("who are you")))?.toLowerCase()).toContain("kentongan");
  });

  it("remembers the three calls for one person", async () => {
    const responder = createResponder({ cooldownMs: 0, random: () => 0 });
    expect((await responder.handle(mention("I'm sleeping")))?.toLowerCase()).toContain("call one");
    expect((await responder.handle(mention("who are you")))?.toLowerCase()).toContain("kentongan");
    expect((await responder.handle(mention("still asleep")))?.toLowerCase()).toContain("call two");
    expect((await responder.handle(mention("no")))?.toLowerCase()).toMatch(/call three|datang/);
    expect((await responder.handle(mention("I'm up")))?.toLowerCase()).toContain("nyaut");
    expect((await responder.handle(mention("tidur")))?.toLowerCase()).toContain("call one");
  });

  it("does not share the count between people", async () => {
    const responder = createResponder({ cooldownMs: 0, random: () => 0 });
    await responder.handle(mention("I'm sleeping", "ada"));
    expect((await responder.handle(mention("I'm sleeping", "ada")))?.toLowerCase()).toContain("call two");
    expect((await responder.handle(mention("I'm sleeping", "budi")))?.toLowerCase()).toContain("call one");
  });

  it("waits out the cooldown", async () => {
    let time = 0;
    const responder = createResponder({
      cooldownMs: 1000,
      clock: () => time,
      random: () => 0,
    });
    expect(await responder.handle(mention("hello"))).not.toBeNull();
    expect(await responder.handle(mention("hello"))).toBeNull();
    time = 1000;
    expect(await responder.handle(mention("hello"))).not.toBeNull();
  });

  it("speaks with the model and remembers the channel", async () => {
    const seen: ChatMessage[][] = [];
    const responder = createResponder({
      cooldownMs: 0,
      random: () => 0,
      complete: async (messages) => {
        seen.push([...messages]);
        return "The wood heard you.";
      },
    });

    expect(await responder.handle(mention("who are you"))).toBe("The wood heard you.");
    expect(await responder.handle(mention("and the bat?", "user-1", "room"))).toBe("The wood heard you.");

    const second = seen[1];
    expect(second?.[0]?.content).toContain("kentongan");
    expect(second?.some((message) => message.content.includes("who are you"))).toBe(true);
    expect(second?.some((message) => message.role === "assistant" && message.content === "The wood heard you.")).toBe(true);
    expect(second?.[second.length - 1]?.content).toContain("and the bat?");
  });

  it("shows another user's @name to the model and pings them in the reply", async () => {
    let seen = "";
    const responder = createResponder({
      cooldownMs: 0,
      complete: async (messages) => {
        seen = messages[messages.length - 1]?.content ?? "";
        return "Ask @son-of-steve. I am still the drum.";
      },
    });

    const reply = await responder.handle({
      ...mention("<@1> are you better than <@2>?"),
      mentionedUsers: [{ id: "2", handle: "son-of-steve" }],
    });

    expect(seen).toContain("@son-of-steve");
    expect(seen).not.toContain("<@");
    expect(reply).toContain("<@2>");
    expect(reply).not.toContain("@everyone");
  });

  it("keeps channel memories apart and falls back when the model fails", async () => {
    const errors: string[] = [];
    const responder = createResponder({
      cooldownMs: 0,
      random: () => 0,
      onModelError: (message) => errors.push(message),
      complete: async (messages) => {
        const latest = messages[messages.length - 1]?.content ?? "";
        if (latest.includes("sleeping")) throw new Error("Groq replied 429. slow down gsk_secret");
        return `Echo ${latest}`;
      },
    });

    expect((await responder.handle(mention("I'm sleeping", "user-1", "left")))?.toLowerCase()).toContain("call one");
    expect(errors[0]).toContain("[key]");
    expect(errors[0]).not.toContain("gsk_secret");

    const other = await responder.handle(mention("hello", "user-2", "right"));
    expect(other).toBe("Echo Brian: hello");
  });
});
