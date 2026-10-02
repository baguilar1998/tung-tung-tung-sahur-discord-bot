const USER_MENTION = /<@!?\d+>/g;
const ROLE_MENTION = /<@&\d+>/g;
const CHANNEL_MENTION = /<#\d+>/g;
const EMOJI_MARKUP = /<a?:[^:>]+:\d+>/g;
const EVERYONE = /@everyone/gi;
const HERE = /@here/gi;
const CONTROL_CHARS = /[\u0000-\u001F]/g;
const MARKDOWN = /[`*_~|]/g;

/** Turns Discord message text into plain words. Mentions and pings are removed. */
export function plainText(input: string): string {
  return input
    .replace(USER_MENTION, " ")
    .replace(ROLE_MENTION, " ")
    .replace(CHANNEL_MENTION, " ")
    .replace(EMOJI_MARKUP, " ")
    .replace(EVERYONE, " ")
    .replace(HERE, " ")
    .replace(CONTROL_CHARS, " ")
    .replace(MARKDOWN, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayName(input: string): string {
  const cleaned = [...plainText(input)].slice(0, 32).join("").trim();
  return cleaned.length > 0 ? cleaned : "you";
}

export function snippetOf(input: string, max = 80): string {
  const plain = plainText(input).replace(/"/g, "'");
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

export function fitDiscord(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 1900) return trimmed;
  return `${trimmed.slice(0, 1899)}…`;
}
