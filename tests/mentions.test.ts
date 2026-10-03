import { describe, expect, it } from "vitest";
import { linkUserMentions, revealUserMentions } from "../src/discord/mentions.js";

const steve = { id: "2", handle: "son-of-steve" };

describe("discord user mentions", () => {
  it("turns a mention into the @handle the model can read", () => {
    expect(revealUserMentions("<@1> are you better than <@2> ?", [steve])).toBe(
      "<@1> are you better than @son-of-steve ?",
    );
  });

  it("turns that @handle back into a ping, and leaves everyone else as text", () => {
    expect(linkUserMentions("Ask @son-of-steve, not @someone-else.", [steve])).toBe(
      "Ask <@2>, not @someone-else.",
    );
    expect(linkUserMentions("No names here.", [steve])).toBe("No names here.");
  });
});