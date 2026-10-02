import { respond } from "../personality/respond.js";

export interface IncomingMessage {
  authorIsBot: boolean;
  system: boolean;
  mentionsBot: boolean;
  content: string;
  authorId: string;
  displayName: string;
}

export interface Responder {
  handle(message: IncomingMessage): string | null;
}

export interface ResponderOptions {
  random?: () => number;
  now?: () => Date;
  /** How long one person must wait between answers. */
  cooldownMs?: number;
  clock?: () => number;
}

const DEFAULT_COOLDOWN_MS = 1000;

export function createResponder(options: ResponderOptions = {}): Responder {
  const strikes = new Map<string, number>();
  const lastAnsweredAt = new Map<string, number>();
  const random = options.random ?? Math.random;
  const now = options.now ?? (() => new Date());
  const clock = options.clock ?? Date.now;
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;

  return {
    handle(message) {
      if (message.authorIsBot || message.system || !message.mentionsBot) {
        return null;
      }
      if (!allow(lastAnsweredAt, message.authorId, clock(), cooldownMs)) {
        return null;
      }

      const result = respond({
        text: message.content,
        displayName: message.displayName,
        strikes: strikes.get(message.authorId) ?? 0,
        now: now(),
        random,
      });
      strikes.set(message.authorId, result.strikes);
      return result.text;
    },
  };
}

function allow(lastAnsweredAt: Map<string, number>, authorId: string, time: number, cooldownMs: number): boolean {
  const previous = lastAnsweredAt.get(authorId);
  if (previous !== undefined && time - previous < cooldownMs) {
    return false;
  }
  lastAnsweredAt.set(authorId, time);
  return true;
}
