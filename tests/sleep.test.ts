import { describe, expect, it } from "vitest";
import { SLEEP_NOTICE } from "../src/personality/sleep.js";

describe("SLEEP_NOTICE", () => {
  it("says he is going to sleep and that the drum is offline", () => {
    expect(SLEEP_NOTICE.toLowerCase()).toContain("going to sleep");
    expect(SLEEP_NOTICE.toLowerCase()).toContain("offline");
  });
});