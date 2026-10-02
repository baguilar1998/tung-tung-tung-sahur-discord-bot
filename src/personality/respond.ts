import { classify } from "./classify.js";
import { readJakarta } from "./jakarta.js";
import { renderLine } from "./lines.js";
import { nextStrikes } from "./strikes.js";
import { displayName, fitDiscord, snippetOf } from "../text/sanitize.js";

export interface RespondInput {
  text: string;
  displayName: string;
  strikes: number;
  now: Date;
  random?: () => number;
}

export interface RespondResult {
  text: string;
  strikes: number;
  intent: ReturnType<typeof classify>["intent"];
}

export function respond(input: RespondInput): RespondResult {
  const random = input.random ?? Math.random;
  const classification = classify(input.text);
  const previousStrikes = input.strikes;
  const strikes = nextStrikes(previousStrikes, classification.intent);
  const text = fitDiscord(
    renderLine(
      classification.intent,
      {
        name: displayName(input.displayName),
        strikes,
        previousStrikes,
        clock: readJakarta(input.now),
        snippet: snippetOf(input.text),
        rival: classification.rival,
        fame: classification.fame,
      },
      random,
    ),
  );

  return { text, strikes, intent: classification.intent };
}
