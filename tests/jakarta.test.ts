import { describe, expect, it } from "vitest";
import { readJakarta } from "../src/personality/jakarta.js";

describe("readJakarta", () => {
  it("treats 02:30 through 05:00 as sahur watch", () => {
    const start = readJakarta(new Date("2026-03-01T19:30:00.000Z"));
    const end = readJakarta(new Date("2026-03-01T22:00:00.000Z"));
    expect(start).toMatchObject({ hour: 2, minute: 30, label: "02:30", sahurWatch: true, phase: "sahur" });
    expect(end).toMatchObject({ hour: 5, minute: 0, label: "05:00", sahurWatch: true, phase: "sahur" });
  });

  it("names the rest of the Jakarta day", () => {
    expect(readJakarta(new Date("2026-03-01T17:00:00.000Z")).phase).toBe("waiting");
    expect(readJakarta(new Date("2026-03-01T22:01:00.000Z")).phase).toBe("morning");
    expect(readJakarta(new Date("2026-03-02T04:00:00.000Z")).phase).toBe("day");
    expect(readJakarta(new Date("2026-03-01T17:00:00.000Z")).label).toBe("00:00");
  });
});
