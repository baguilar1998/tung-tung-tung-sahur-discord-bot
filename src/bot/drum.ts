import { CHIME_COOLDOWN_MS } from "./chime.js";
import { plainText } from "../text/sanitize.js";

/** How often the bare drum, with no @mention, gets an answer. */
export const DRUM_CHANCE = 0.35;

/** "tung tung tung sahur", including the longer full name. */
export function hearsTheDrum(text: string): boolean {
  return /\btung(?:\s+tung){2,}\s+sahur\b/i.test(plainText(text));
}

export function shouldAnswerDrum(input: {
  now: number;
  lastSpokeAt: number | null;
  random: () => number;
}): boolean {
  if (input.lastSpokeAt !== null && input.now - input.lastSpokeAt < CHIME_COOLDOWN_MS) return false;
  return input.random() < DRUM_CHANCE;
}
