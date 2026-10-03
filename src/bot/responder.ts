import {
  buildChatMessages,
  cleanModelReply,
  spokenLine,
  type ChatMessage,
  type MemoryTurn,
} from "../ai/prompt.js";
import { CHIME_WINDOW_MS, shouldChime, type ActivityMark } from "./chime.js";
import { hearsTheDrum, shouldAnswerDrum } from "./drum.js";
import { linkUserMentions, revealUserMentions, type MentionedUser } from "../discord/mentions.js";
import { readJakarta } from "../personality/jakarta.js";
import { respond } from "../personality/respond.js";
import { plainText } from "../text/sanitize.js";

export interface IncomingMessage {
  authorIsBot: boolean;
  system: boolean;
  mentionsBot: boolean;
  content: string;
  authorId: string;
  channelId: string;
  displayName: string;
  place: string;
  mentionedUsers: readonly MentionedUser[];
  /** Server channels can earn an occasional unprompted remark. Direct messages do not. */
  inServer: boolean;
}

export interface Responder {
  handle(message: IncomingMessage): Promise<string | null>;
}

export type Completer = (messages: readonly ChatMessage[]) => Promise<string>;

export interface ResponderOptions {
  random?: () => number;
  now?: () => Date;
  /** How long one person must wait between answers. */
  cooldownMs?: number;
  clock?: () => number;
  complete?: Completer;
  onModelError?: (message: string) => void;
}

const DEFAULT_COOLDOWN_MS = 1000;
const MEMORY_TURNS = 12;

export function createResponder(options: ResponderOptions = {}): Responder {
  const strikes = new Map<string, number>();
  const lastAnsweredAt = new Map<string, number>();
  const memory = new Map<string, MemoryTurn[]>();
  const overheard = new Map<string, HeardLine[]>();
  const lastSpokeAt = new Map<string, number>();
  const lanes = new Map<string, Promise<unknown>>();
  const random = options.random ?? Math.random;
  const now = options.now ?? (() => new Date());
  const clock = options.clock ?? Date.now;
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;

  return {
    handle(message) {
      return enqueue(lanes, message.channelId, async () => {
        if (message.authorIsBot || message.system) return null;

        const atMs = clock();
        const drumCall =
          !message.mentionsBot &&
          message.inServer &&
          hearsTheDrum(message.content) &&
          shouldAnswerDrum({
            now: atMs,
            lastSpokeAt: lastSpokeAt.get(message.channelId) ?? null,
            random,
          });
        if (!message.mentionsBot && !drumCall) {
          return maybeChime(options, message, atMs, overheard, lastSpokeAt, random, now);
        }
        if (!allow(lastAnsweredAt, message.authorId, atMs, cooldownMs)) {
          return null;
        }

        const at = now();
        const previousStrikes = strikes.get(message.authorId) ?? 0;
        const readable = revealUserMentions(message.content, message.mentionedUsers);
        remember(overheard, message, readable, atMs);
        const prepared = respond({
          text: readable,
          displayName: message.displayName,
          strikes: previousStrikes,
          now: at,
          random,
        });
        strikes.set(message.authorId, prepared.strikes);

        const history = memory.get(message.channelId) ?? [];
        const spokenReply = await speak(options, history, message, prepared, previousStrikes, at);
        const nextMemory: MemoryTurn[] = [
          ...history,
          { role: "user", content: spokenLine(message.displayName, readable, message.mentionedUsers) },
          { role: "assistant", content: spokenReply },
        ];
        memory.set(message.channelId, nextMemory.slice(-MEMORY_TURNS));
        lastSpokeAt.set(message.channelId, atMs);
        return linkUserMentions(spokenReply, message.mentionedUsers);
      });
    },
  };
}

interface HeardLine extends ActivityMark {
  line: string;
}

async function maybeChime(
  options: ResponderOptions,
  message: IncomingMessage,
  atMs: number,
  overheard: Map<string, HeardLine[]>,
  lastSpokeAt: Map<string, number>,
  random: () => number,
  now: () => Date,
): Promise<string | null> {
  if (!message.inServer || !options.complete) return null;
  const readable = revealUserMentions(message.content, message.mentionedUsers);
  if (plainText(readable).length === 0) return null;

  const recent = remember(overheard, message, readable, atMs);
  const spoke = lastSpokeAt.get(message.channelId) ?? null;
  if (!shouldChime({ now: atMs, recent, lastSpokeAt: spoke, random })) return null;

  try {
    const raw = await options.complete(
      buildChatMessages({
        history: recent.slice(0, -1).map((mark) => ({ role: "user", content: mark.line })),
        speaker: message.displayName,
        userText: readable,
        strikes: 0,
        previousStrikes: 0,
        intent: "fallback",
        clock: readJakarta(now()),
        place: message.place,
        mentionedUsers: message.mentionedUsers,
        joining: true,
      }),
    );
    const cleaned = cleanModelReply(raw, message.mentionedUsers);
    if (!cleaned) return null;
    lastSpokeAt.set(message.channelId, atMs);
    return linkUserMentions(cleaned, message.mentionedUsers);
  } catch (error) {
    options.onModelError?.(modelFailure(error));
    return null;
  }
}

function remember(
  overheard: Map<string, HeardLine[]>,
  message: IncomingMessage,
  readable: string,
  atMs: number,
): HeardLine[] {
  const prior = overheard.get(message.channelId) ?? [];
  const next = [
    ...prior,
    { at: atMs, authorId: message.authorId, line: spokenLine(message.displayName, readable, message.mentionedUsers) },
  ].filter((mark) => atMs - mark.at <= CHIME_WINDOW_MS);
  const kept = next.slice(-12);
  overheard.set(message.channelId, kept);
  return kept;
}

async function speak(
  options: ResponderOptions,
  history: readonly MemoryTurn[],
  message: IncomingMessage,
  prepared: ReturnType<typeof respond>,
  previousStrikes: number,
  at: Date,
): Promise<string> {
  if (!options.complete) return prepared.text;

  try {
    const raw = await options.complete(
      buildChatMessages({
        history,
        speaker: message.displayName,
        userText: message.content,
        strikes: prepared.strikes,
        previousStrikes,
        intent: prepared.intent,
        clock: readJakarta(at),
        place: message.place,
        mentionedUsers: message.mentionedUsers,
      }),
    );
    const cleaned = cleanModelReply(raw, message.mentionedUsers);
    if (cleaned) return cleaned;
    options.onModelError?.("The voice model said nothing usable. Used a prepared line.");
  } catch (error) {
    options.onModelError?.(modelFailure(error));
  }
  return prepared.text;
}

function modelFailure(error: unknown): string {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "The voice model took too long. Used a prepared line.";
  }
  const text = error instanceof Error ? error.message : "The voice model failed.";
  return text.replace(/gsk_[A-Za-z0-9]+/g, "[key]").slice(0, 200);
}

function allow(lastAnsweredAt: Map<string, number>, authorId: string, time: number, cooldownMs: number): boolean {
  const previous = lastAnsweredAt.get(authorId);
  if (previous !== undefined && time - previous < cooldownMs) {
    return false;
  }
  lastAnsweredAt.set(authorId, time);
  return true;
}

function enqueue<T>(lanes: Map<string, Promise<unknown>>, key: string, task: () => Promise<T>): Promise<T> {
  const previous = lanes.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  lanes.set(
    key,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}
