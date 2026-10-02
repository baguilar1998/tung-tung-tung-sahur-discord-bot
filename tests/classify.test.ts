import { describe, expect, it } from "vitest";
import { classify } from "../src/personality/classify.js";

describe("classify", () => {
  it("treats a bare ping, drums, and punctuation as a summon", () => {
    expect(classify("").intent).toBe("summon");
    expect(classify("<@123>").intent).toBe("summon");
    expect(classify("tung tung tung sahur").intent).toBe("summon");
    expect(classify("...").intent).toBe("summon");
  });

  it("reads lore, rivals, and fame ahead of a greeting", () => {
    expect(classify("hello who are you").intent).toBe("lore");
    expect(classify("siapa kamu").intent).toBe("lore");
    expect(classify("who would win against patapim").rival).toBe("patapim");
    expect(classify("tralalero tralala").rival).toBe("tralalero");
    expect(classify("did fortnite add you").fame).toBe("fortnite");
    expect(classify("steal a brainrot").fame).toBe("roblox");
  });

  it("counts a refusal to wake and clears it when they are up", () => {
    expect(classify("I'm sleeping").intent).toBe("sleep");
    expect(classify("saya masih tidur").intent).toBe("sleep");
    expect(classify("no").intent).toBe("sleep");
    expect(classify("5 more minutes").intent).toBe("sleep");
    expect(classify("I'm up").intent).toBe("awake");
    expect(classify("sudah bangun").intent).toBe("awake");
    expect(classify("I'm not sleeping").intent).toBe("awake");
    expect(classify("no, I'm up").intent).toBe("awake");
    expect(classify("no way").intent).toBe("fallback");
  });

  it("keeps everyday intents distinct", () => {
    expect(classify("that baseball bat").intent).toBe("weapon");
    expect(classify("I'm hungry").intent).toBe("hungry");
    expect(classify("you are scary").intent).toBe("scared");
    expect(classify("what time is it").intent).toBe("time");
    expect(classify("help").intent).toBe("help");
    expect(classify("hello").intent).toBe("greeting");
    expect(classify("I love you").intent).toBe("compliment");
    expect(classify("shut up").intent).toBe("insult");
    expect(classify("I'm bored").intent).toBe("bored");
    expect(classify("go home").intent).toBe("homecoming");
    expect(classify("wake me up").intent).toBe("summon");
    expect(classify("don't wake me").intent).toBe("sleep");
    expect(classify("the weather is soup").intent).toBe("fallback");
  });
});
