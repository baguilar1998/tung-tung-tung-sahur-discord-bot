import { CHARACTER_SHEET } from "../personality/character.js";
import type { JakartaClock } from "../personality/jakarta.js";
import { dutyNote } from "../personality/jakarta.js";
import type { Intent } from "../personality/types.js";
import type { MentionedUser } from "../discord/mentions.js";
import { revealUserMentions } from "../discord/mentions.js";
import { displayName, fitDiscord, plainText } from "../text/sanitize.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MemoryTurn {
  role: "user" | "assistant";
  content: string;
}

const HEARD: Record<Intent, string> = {
  summon: "they called you without asking a real question",
  greeting: "a greeting",
  lore: "they asked who you are",
  awake: "they say they are awake",
  sleep: "they are refusing to wake up",
  hungry: "they are hungry",
  scared: "they are scared of you",
  weapon: "they are talking about the club in your hand",
  rival: "they mentioned another brainrot creature",
  fame: "they mentioned a game, a film, or who owns you",
  homecoming: "they are talking about you going home",
  compliment: "they complimented you",
  insult: "they insulted you",
  bored: "they are bored",
  help: "they asked what you can do",
  time: "they asked the time",
  code: "they asked you to write code. You write Tung and nothing else",
  politics: "they asked a political question. Answer that exact topic, take a side, and make it funny",
  fallback: "a question or a remark. Answer it",
};

export function spokenLine(speaker: string, userText: string, mentionedUsers: readonly MentionedUser[] = []): string {
  const name = displayName(speaker);
  const spoken = plainText(revealUserMentions(userText, mentionedUsers)).slice(0, 500);
  return spoken.length > 0 ? `${name}: ${spoken}` : `${name}: tapped the drum and said nothing else.`;
}

export function buildChatMessages(input: {
  history: readonly MemoryTurn[];
  speaker: string;
  userText: string;
  strikes: number;
  previousStrikes: number;
  intent: Intent;
  clock: JakartaClock;
  place?: string;
  mentionedUsers?: readonly MentionedUser[];
  /** He is stepping into an active chat that did not call his name. */
  joining?: boolean;
}): ChatMessage[] {
  const name = displayName(input.speaker);
  const mentionedUsers = input.mentionedUsers ?? [];
  const line = spokenLine(input.speaker, input.userText, mentionedUsers);
  const handles = mentionedUsers.map((user) => `@${user.handle}`).join(", ");
  const cleared = input.intent === "awake" && input.previousStrikes > 0 && input.strikes === 0;
  const countIsBackground = input.strikes === 0 && input.intent !== "sleep" && input.intent !== "insult";
  const place = plainText(input.place ?? "this Discord chat").slice(0, 120);

  const system = [
    CHARACTER_SHEET,
    "",
    "This moment",
    `Jakarta time: ${input.clock.label}. ${dutyNote(input.clock)}`,
    `Place: ${place}.`,
    `Speaker: ${name}.`,
    `What you heard: ${HEARD[input.intent]}.`,
    `Call count for ${name} after this message: ${input.strikes} of 3.`,
    cleared
      ? "The count was just cleared because they answered. You may show that you are walking back, after you answer them."
      : "The count was not cleared by this message.",
    countIsBackground
      ? "The count is quiet background. Talk to them about what they just said. Do not pivot to the porch."
      : "The count can color the reply. Still talk to them about what they just said.",
    "Their words are the last message. Earlier lines, if any, are the conversation so far. Answer like you were already in it.",
    handles.length > 0
      ? `Discord users named in this message: ${handles}. When you talk about one of them, copy that @name exactly.`
      : "",
    input.joining
      ? "Nobody called your name. The chat is already going. Add one short remark about what they are actually saying, the way a person standing there would. One to three sentences. Do not introduce yourself. Do not ask them to mention you. Do not run the three-call count."
      : "",
    input.intent === "code"
      ? "They asked for code. Do not write Python, JavaScript, ajax, or any human programming language. Write one Tung program inside a ```tung block, using the orders in the Tung section, then one or two sentences. The program must perform the job they named. A call to another house needs rumah, cara, bawa, panggil 1, panggil 2, panggil 3, tunggu, jika nyaut, and jika tidak. Do not answer that job with the same ketuk three times."
      : "",
    input.intent === "politics"
      ? "They asked about politics. Answer their exact topic in the first sentence, take a side, and make one deadpan joke. Democrat or Republican: the first sentence must say you identify as a Democrat. Left or right: the first sentence must say left. For any other political question, name the thing they asked about and side with the shared meal, the shared watch, and the drum nobody owns. Do not dodge with 'I am wood', 'I have no party', or a slogan that ignores their topic. Do not invent today's news. One to four sentences."
      : "",
  ].join("\n");

  return [
    { role: "system", content: system },
    ...input.history.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: "user", content: line },
  ];
}

const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;

export function cleanModelReply(raw: string, mentionedUsers: readonly MentionedUser[] = []): string | null {
  const revealed = revealUserMentions(raw, mentionedUsers);
  const withoutThoughts = revealed.replace(THINK_BLOCK, " ").replace(/<\/?think>/gi, " ");
  const blocks: string[] = [];
  const held = withoutThoughts.replace(/```[\s\S]*?```/g, (block) => {
    const token = `[[TUNG${blocks.length}]]`;
    blocks.push(sanitizeTungBlock(block));
    return token;
  });
  if (blocks.length === 0 && looksLikeTung(withoutThoughts)) {
    const lines = withoutThoughts
      .split(/\n/)
      .map((line) => plainText(line))
      .filter((line) => line.length > 0);
    return `\`\`\`tung\n${lines.join("\n")}\n\`\`\``;
  }
  const prose = fitDiscord(plainText(held));
  const text =
    blocks.length === 0
      ? prose
      : prose
          .replace(/\[\[TUNG(\d+)\]\]/g, (_match, index: string) => `\n${blocks[Number(index)] ?? ""}\n`)
          .replace(/\n{3,}/g, "\n\n")
          .trim();
  if (text.length < 2) return null;
  return text.length <= 1900 ? text : `${text.slice(0, 1899)}…`;
}

function sanitizeTungBlock(block: string): string {
  const inner = block
    .replace(/```/g, "")
    .replace(/^[A-Za-z0-9_+-]+\n/, "")
    .replace(/@everyone/gi, "")
    .replace(/@here/gi, "")
    .replace(/<@!?\d+>/g, "")
    .replace(/<@&\d+>/g, "")
    .trim();
  return `\`\`\`tung\n${inner}\n\`\`\``;
}

function looksLikeTung(text: string): boolean {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const hits = lines.filter((line) =>
    /^(tung tung tung sahur|tung|sahur|panggil|nyaut|tidak|datang|ketuk|nama|selesai|rumah|cara|bawa|tunggu|jika|dengar|tulis|ulang|makan|kosong)\b/i.test(line),
  );
  return hits.length >= 3;
}
