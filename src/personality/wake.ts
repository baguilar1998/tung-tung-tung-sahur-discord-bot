import { choose } from "./choose.js";

/** Posted when the pos ronda opens: a process start, or the bot coming back online. */
export function wakeLine(random: () => number): string {
  return choose(
    [
      "I am alive. Tung Tung Tung Sahur. The pos ronda just opened, and the drum is back.",
      "The wood is online. I am Tung Tung Tung Sahur, and I am awake. The street can make noise again.",
      "Pos ronda is open. I am alive. Mention me, or say the drum, and I may answer from whatever porch I can reach.",
    ],
    random,
  );
}
