/** How far back a channel still counts as active. */
export const CHIME_WINDOW_MS = 2 * 60 * 1000;
/** Human messages required inside that window. */
export const CHIME_MIN_MESSAGES = 4;
/** Different people required, so one person talking does not wake him. */
export const CHIME_MIN_AUTHORS = 2;
/** After he speaks, he stays out of the chat for this long. */
export const CHIME_COOLDOWN_MS = 3 * 60 * 1000;
/** Once the chat is active and the cooldown is over, the chance he steps in. */
export const CHIME_CHANCE = 0.25;

export interface ActivityMark {
  at: number;
  authorId: string;
}

export function shouldChime(input: {
  now: number;
  recent: readonly ActivityMark[];
  lastSpokeAt: number | null;
  random: () => number;
}): boolean {
  const inWindow = input.recent.filter((mark) => input.now - mark.at <= CHIME_WINDOW_MS && input.now >= mark.at);
  if (inWindow.length < CHIME_MIN_MESSAGES) return false;
  const authors = new Set(inWindow.map((mark) => mark.authorId));
  if (authors.size < CHIME_MIN_AUTHORS) return false;
  if (input.lastSpokeAt !== null && input.now - input.lastSpokeAt < CHIME_COOLDOWN_MS) return false;
  return input.random() < CHIME_CHANCE;
}
