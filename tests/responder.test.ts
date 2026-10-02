import { describe, expect, it } from "vitest";
import { createResponder, type IncomingMessage } from "../src/bot/responder.js";

function mention(content: string, authorId = "user-1"): IncomingMessage {
  return {
    authorIsBot: false,
    system: false,
    mentionsBot: true,
    content,
    authorId,
    displayName: "Brian",
  };
}

describe("createResponder", () => {
  it("answers a mention and ignores everything else", () => {
    const responder = createResponder({ cooldownMs: 0, random: () => 0 });
    expect(responder.handle({ ...mention("who are you"), mentionsBot: false })).toBeNull();
    expect(responder.handle({ ...mention("who are you"), authorIsBot: true })).toBeNull();
    expect(responder.handle({ ...mention("who are you"), system: true })).toBeNull();
    expect(responder.handle(mention("who are you"))?.toLowerCase()).toContain("kentongan");
  });

  it("remembers the three calls for one person", () => {
    const responder = createResponder({ cooldownMs: 0, random: () => 0 });
    expect(responder.handle(mention("I'm sleeping"))?.toLowerCase()).toContain("call one");
    expect(responder.handle(mention("who are you"))?.toLowerCase()).toContain("kentongan");
    expect(responder.handle(mention("still asleep"))?.toLowerCase()).toContain("call two");
    expect(responder.handle(mention("no"))?.toLowerCase()).toMatch(/call three|datang/);
    expect(responder.handle(mention("I'm up"))?.toLowerCase()).toContain("nyaut");
    expect(responder.handle(mention("tidur"))?.toLowerCase()).toContain("call one");
  });

  it("does not share the count between people", () => {
    const responder = createResponder({ cooldownMs: 0, random: () => 0 });
    responder.handle(mention("I'm sleeping", "ada"));
    expect(responder.handle(mention("I'm sleeping", "ada"))?.toLowerCase()).toContain("call two");
    expect(responder.handle(mention("I'm sleeping", "budi"))?.toLowerCase()).toContain("call one");
  });

  it("waits out the cooldown", () => {
    let time = 0;
    const responder = createResponder({
      cooldownMs: 1000,
      clock: () => time,
      random: () => 0,
    });
    expect(responder.handle(mention("hello"))).not.toBeNull();
    expect(responder.handle(mention("hello"))).toBeNull();
    time = 1000;
    expect(responder.handle(mention("hello"))).not.toBeNull();
  });
});
