import type { Intent } from "./types.js";

export const MAX_STRIKES = 3;

export function clampStrikes(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_STRIKES, Math.floor(value));
}

/** Sleep and insults advance the three-call legend. Answering that you are awake clears it. */
export function nextStrikes(current: number, intent: Intent): number {
  const strikes = clampStrikes(current);
  if (intent === "awake") return 0;
  if (intent === "sleep" || intent === "insult") {
    return Math.min(MAX_STRIKES, strikes + 1);
  }
  return strikes;
}
