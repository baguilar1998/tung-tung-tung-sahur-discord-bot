import type { Classification, FameTopic, Intent, Rival } from "./types.js";
import { plainText } from "../text/sanitize.js";

interface Rule {
  intent: Intent;
  pattern: RegExp;
}

/**
 * First match wins. Specific lore, rivals, and the three-call verbs stay
 * ahead of broad words like "help" and "bat".
 */
const RULES: readonly Rule[] = [
  {
    intent: "rival",
    pattern:
      /patapim|tralalero|tralala|bombardiro|crocodilo|cappuccina|ballerina|hotspot|chimpanzini|lirili|boneca/i,
  },
  {
    intent: "fame",
    pattern: /fortnite|roblox|steal a brainrot|copyright|trademark|lawyer|mementum|who owns|\b(movie|film|bioskop)\b/i,
  },
  {
    intent: "lore",
    pattern:
      /\b(who are you|what are you|who's this|whos this|your name|full name|tell me about you|tell me about yourself|your lore|your story|your origin|what is your name|what is your job|siapa kamu|siapa kau|siapa lu|siapa lo|nama kamu|kamu siapa|apa kamu|kentongan|anomali|triple t|pos ronda)\b/i,
  },
  {
    intent: "homecoming",
    pattern: /\b(go home|going home|pulang|lebaran|mudik|eid|idul fitri|ramadan is over|after ramadan)\b/i,
  },
  {
    intent: "weapon",
    pattern: /\b(baseball bat|pentungan|pentung|cudgel|club|bat)\b/i,
  },
  {
    intent: "hungry",
    pattern: /\b(hungry|lapar|makan|makanan|food|nasi|sarapan|eat|eating|starving)\b/i,
  },
  {
    intent: "scared",
    pattern: /\b(scary|scared|afraid|creepy|horror|spooky|takut|serem|seram|mengerikan)\b/i,
  },
  {
    intent: "awake",
    pattern:
      /\b(i'?m up|i am up|im up|i'?m awake|i am awake|already up|sudah bangun|nyaut|not sleeping|tidak tidur|gak tidur|nggak tidur|gue bangun|aku bangun|saya bangun|awake)\b/i,
  },
  {
    intent: "sleep",
    pattern:
      /\b(sleep|sleeping|asleep|snooze|in bed|still in bed|five more minutes|5 more minutes|five more|5 more|tired|ngantuk|bobo|tidur|susah bangun|tidak mau bangun|gak mau bangun|nggak mau bangun|don't wake|do not wake|dont wake|let me sleep|go away|leave me alone)\b/i,
  },
  {
    intent: "summon",
    pattern: /\b(wake me|bangunkan|bangunin|bangun)\b/i,
  },
  {
    intent: "insult",
    pattern: /\b(stupid|dumb|idiot|annoying|shut up|hate you|i hate|bodoh|jelek|trash|ugly)\b/i,
  },
  {
    intent: "compliment",
    pattern: /\b(love you|love u|peak|goat|keren|ganteng|handsome|based|good bot|best bot|king)\b/i,
  },
  {
    intent: "help",
    pattern: /\b(help|commands|what can you do|how do i work|how do you work)\b/i,
  },
  {
    intent: "bored",
    pattern: /\b(bored|boring|gabut|bosen|bosan)\b/i,
  },
  {
    intent: "time",
    pattern: /\b(what time|current time|jam berapa|pukul berapa|waktu apa)\b/i,
  },
];

const REFUSAL =
  /^(no|nope|nah|ga|gak|nggak|tidak|enggak|nanti|later)[.!?\s]*$/i;

const GREETING =
  /^(?:hi|hai|hello|hey|yo|sup|halo|hola|hei|hey tung|hei tung|good morning|good night|good evening|selamat pagi|selamat malam|selamat siang|selamat sore|what's up|whats up)[.!\s]*$/i;

const RIVALS: readonly { rival: Rival; pattern: RegExp }[] = [
  { rival: "patapim", pattern: /patapim/i },
  { rival: "tralalero", pattern: /tralalero|tralala/i },
  { rival: "bombardiro", pattern: /bombardiro|crocodilo/i },
  { rival: "cappuccina", pattern: /cappuccina|ballerina/i },
  { rival: "hotspot", pattern: /hotspot/i },
];

const FAME: readonly { fame: FameTopic; pattern: RegExp }[] = [
  { fame: "fortnite", pattern: /fortnite/i },
  { fame: "roblox", pattern: /roblox|steal a brainrot/i },
  { fame: "copyright", pattern: /copyright|trademark|lawyer|mementum|who owns/i },
  { fame: "film", pattern: /\b(movie|film|bioskop)\b/i },
];

export function classify(text: string): Classification {
  const normalized = plainText(text).slice(0, 1000);
  if (!hasWords(normalized) || isDrumOnly(normalized)) {
    return { intent: "summon", rival: null, fame: null };
  }

  for (const rule of RULES) {
    if (!rule.pattern.test(normalized)) continue;
    return {
      intent: rule.intent,
      rival: rule.intent === "rival" ? detectRival(normalized) : null,
      fame: rule.intent === "fame" ? detectFame(normalized) : null,
    };
  }

  if (REFUSAL.test(normalized)) {
    return { intent: "sleep", rival: null, fame: null };
  }
  if (GREETING.test(normalized)) {
    return { intent: "greeting", rival: null, fame: null };
  }
  return { intent: "fallback", rival: null, fame: null };
}

export function isDrumOnly(text: string): boolean {
  const compact = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!compact) return false;
  return compact.split(" ").every((word) => word === "tung" || word === "sahur");
}

function detectRival(text: string): Rival {
  return RIVALS.find((entry) => entry.pattern.test(text))?.rival ?? "other";
}

function detectFame(text: string): FameTopic {
  return FAME.find((entry) => entry.pattern.test(text))?.fame ?? "film";
}

function hasWords(text: string): boolean {
  return /[a-z0-9]/i.test(text);
}
