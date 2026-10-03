import { choose, drum } from "./choose.js";
import type { JakartaClock } from "./jakarta.js";
import { dutyNote } from "./jakarta.js";
import type { FameTopic, Intent, Rival } from "./types.js";

export interface LineContext {
  name: string;
  strikes: number;
  previousStrikes: number;
  clock: JakartaClock;
  snippet: string;
  rival: Rival | null;
  fame: FameTopic | null;
}

export function renderLine(intent: Intent, ctx: LineContext, random: () => number): string {
  switch (intent) {
    case "summon":
      return choose(
        [
          `${drum(random)} ${ctx.name}. You rang the kentongan. The kentongan rings back. ${dutyNote(ctx.clock)}`,
          `The pos ronda heard a name. ${ctx.name}. ${drum(random)} Say you are awake, or say you are still in bed.`,
          `${dutyNote(ctx.clock)} ${drum(random)}`,
        ],
        random,
      );
    case "greeting":
      return choose(
        [
          `${dutyNote(ctx.clock)} ${ctx.name}. The pos ronda answers. If you are awake, say so. If you are still in bed, the count continues.`,
          `${drum(random)} ${ctx.name}. Sahur is a meal and a warning. I am both.`,
          `The anomaly looks over. Big eyes. Bare feet. ${ctx.name}. Hello is acceptable. Silence is not.`,
        ],
        random,
      );
    case "lore":
      return choose(
        [
          `${drum(random)} I am Tung Tung Tung Sahur. Triple T. The long name is Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur. I am a kentongan that grew a face, two bare feet, and a job.`,
          `Anomali mengerikan. I only come out at sahur. Konon katanya, called three times, tidak nyaut, and I come to the house. Hiii, seremnya. That story is me. I am the story.`,
          `${ctx.name}. I wait at the pos ronda, where the sign says pentung. I wake the village for the meal before dawn. Friends who susah sahur get me sent to them. That is the whole duty.`,
        ],
        random,
      );
    case "awake":
      if (ctx.previousStrikes > 0) {
        return choose(
          [
            `${ctx.name} nyaut. I stop counting. I was already aimed at your porch. I will walk back to the pos ronda. Eat before I change my mind.`,
            `Answer received on call ${ctx.previousStrikes}. The pentungan lowers. Eat sahur. Drink water. Stay upright.`,
          ],
          random,
        );
      }
      return choose(
        [
          `${ctx.name} nyaut. The anomaly stops walking. Eat. Then the fast can begin. I go back to being a log with a schedule.`,
          `Good. Three calls will not be needed. The pentungan rests. Do not lie back down. I count that too.`,
          `Answer received. This is the whole job. You are awake, I am unnecessary, and that is peace.`,
        ],
        random,
      );
    case "sleep":
      return sleepLine(ctx, random);
    case "hungry":
      return choose(
        [
          `Sahur is rice, water, and the last food before the sun. I do not eat. I am wood. You eat, ${ctx.name}. That is the arrangement.`,
          `Lapar is a human problem. Mine is the hour. Get the meal in before dawn, or the story starts counting.`,
          `${drum(random)} The kitchen is the correct room. The bed is the incorrect room. Choose with your feet.`,
        ],
        random,
      );
    case "scared":
      return choose(
        [
          `Hiii, seremnya. Yes. That is the correct reaction. I am a drum with eyes, and the eyes do not blink enough. Go to sahur anyway.`,
          `Fear is allowed, ${ctx.name}. Oversleeping is the part I came to fix. Look at the pentungan, then look at the clock.`,
          `Konon katanya I am mengerikan. The village still needs the noise. Scary and useful can share a body. This one does.`,
        ],
        random,
      );
    case "weapon":
      return choose(
        [
          `This is a pentungan, ${ctx.name}. A patrol club. Your internet calls it a baseball bat. I have never played baseball. I play wake up.`,
          `The wood in my hand is for the doorframe, not for a sport. Tung on the frame means sahur. That is the only rule of the game.`,
          `Pentung on the sign, pentungan in the hand, kentongan in the body. Three woods. One job. ${drum(random)}`,
        ],
        random,
      );
    case "rival":
      return rivalLine(ctx, random);
    case "fame":
      return fameLine(ctx, random);
    case "homecoming":
      return choose(
        [
          `When Ramadan ends, the village lets me leave the pos ronda. I walk. Sometimes there is an imaginary flight. Next year the lamp comes on again.`,
          `Lebaran sends the anomaly home. People act sad. I am a seasonal creature. If you tidak nyaut three times out of season, check the porch anyway. Habits stick to wood.`,
          `${ctx.name}. My shift is the month of sahur. Outside that month I am a tall log at a night stop, waiting for the calendar to need me.`,
        ],
        random,
      );
    case "compliment":
      return choose(
        [
          `Ganteng is generous for a cylinder, ${ctx.name}. I accept. The face was drawn on, and it stayed. Now wake up on time.`,
          `The pos ronda does not get compliments. I will keep this one in the wood. ${drum(random)}`,
          `Peak is a word for mountains and for drums, apparently. Thank you. Eat something before the sun.`,
        ],
        random,
      );
    case "insult":
      return insultLine(ctx, random);
    case "bored":
      return choose(
        [
          `Boredom is a soft blanket, ${ctx.name}. Sahur does not care about blankets. Are you awake? Say so, or the count continues.`,
          `Gabut. I know a cure. It is standing up. ${drum(random)} Tell me you are up, or tell me you refuse. I am built for both.`,
          `You are bored because the night is long. I was invented for the long night. Mention me again when you are vertical.`,
        ],
        random,
      );
    case "help":
      return `${ctx.name}. Mention me and I answer. I stay quiet the rest of the time. Ask who I am. Tell me you are awake. Tell me you are still in bed, and I count. Three ignores, and the anomaly datang. That is the bot. That is also the lore.`;
    case "time":
      return `${dutyNote(ctx.clock)} ${
        ctx.clock.sahurWatch
          ? "Sahur watch. I am allowed to exist right now."
          : "Outside the watch I am a rumor with legs."
      }`;
    case "code":
      return [
        "```tung",
        "tung tung tung sahur",
        `nama ${ctx.name}`,
        "rumah pos",
        "cara minta",
        "bawa kabar",
        "panggil 1",
        "  ketuk pintu",
        "panggil 2",
        "  ketuk pintu",
        "panggil 3",
        "  ketuk pintu",
        "tunggu",
        "jika nyaut",
        "  dengar jawab",
        "jika tidak",
        "  datang",
        "selesai",
        "```",
        "I do not write the other languages. This is Tung. Three calls, then I wait to hear the house.",
      ].join("\n");
    case "politics":
      return politicsLine(ctx, random);
    case "fallback":
      return fallbackLine(ctx, random);
    default: {
      const neverIntent: never = intent;
      throw new Error(`No lines for intent ${String(neverIntent)}.`);
    }
  }
}

function politicsLine(ctx: LineContext, random: () => number): string {
  const text = ctx.snippet.toLowerCase();
  if (/\b(left|right)\b/.test(text) && !/democrat|republican/.test(text)) {
    return "Left. The street is a shared watch, not a private yard. Sahur is everybody eating. That is the side.";
  }
  if (/tax|pajak/.test(text)) {
    return "Yes. The lamp does not burn on vibes. Pajak, then breakfast. A full wallet can hear the drum from a quieter street.";
  }
  if (/immigra|border|refugee|migrant|asylum/.test(text)) {
    return "Set another plate. If they heard the knock, they are the village. A border that tidak nyaut is just a rude door.";
  }
  if (/war|ukraine|gaza|israel|palestine|military|nato/.test(text)) {
    return "No. I am pro-breakfast. Both generals are still in bed. The sky can argue without me.";
  }
  if (/\bguns?\b/.test(text)) {
    return "Someone called the pentungan a baseball bat and I have not recovered. I am not adding barrels.";
  }
  if (/climate|warming/.test(text)) {
    return "I work nights. The sun is already rude to a drum. Do not invite it to stay.";
  }
  if (/billion|landlord|\brent\b|capital/.test(text)) {
    return "One wallet does not own the hour. Sahur is at three, and the meal is for the street.";
  }
  if (/health|medic|abort/.test(text)) {
    return "I stop at the door. The person in the bed answers for the body. A log does not write that law, and a fever does not get an invoice.";
  }
  if (/police|\bcops?\b/.test(text)) {
    return "We have a bench and a lamp. We do not have a brigade. Three knocks is the whole department.";
  }
  return choose(
    [
      `Democrat, ${ctx.name}. The village eats together and the watch belongs to the street. Republican is a locked house.`,
      "Left. The street is a shared watch, not a private yard. Sahur is everybody eating.",
      "I identify as a Democrat. A wake-up is not property, and the meal is not private.",
    ],
    random,
  );
}

function sleepLine(ctx: LineContext, random: () => number): string {
  if (ctx.strikes <= 1) {
    return choose(
      [
        `${ctx.name}. Call one. Tidak nyaut is a choice. It is the wrong one. ${drum(random)}`,
        `The blanket can have you once, ${ctx.name}. This is the first call. Two remain. Then the porch.`,
        `Call one. I tap the pos ronda bench so you can hear the distance. It will get shorter.`,
      ],
      random,
    );
  }
  if (ctx.strikes === 2) {
    return choose(
      [
        `Call two, ${ctx.name}. I have left the pos ronda. The street is dark. Your house is a direction I know.`,
        `Two. The lamp behind me is smaller now. Hiii, seremnya. One silence left.`,
        `Call two. Konon katanya the third silence is the visit. I would prefer you nyaut.`,
      ],
      random,
    );
  }
  return choose(
    [
      `Call three. You did not answer. Konon katanya, this is when I arrive. I am at the door. ${drum(random)} Get up, ${ctx.name}.`,
      `Three. Tidak nyaut. The pentungan taps the frame. Tung. Tung. Tung. Sahur, ${ctx.name}. The anomaly datang.`,
      `The count is finished, ${ctx.name}. Bare feet on your step. Eyes that do not blink enough. Get up and eat.`,
    ],
    random,
  );
}

function insultLine(ctx: LineContext, random: () => number): string {
  if (ctx.strikes <= 1) {
    return `The drum heard that, ${ctx.name}. Call one. Wood does not bruise. Your morning might.`;
  }
  if (ctx.strikes === 2) {
    return `Call two. You are still talking, which means you are awake. Inconvenient for the insult. Convenient for sahur.`;
  }
  return `Call three. I am outside anyway, ${ctx.name}. Say it to the door. ${drum(random)}`;
}

function rivalLine(ctx: LineContext, random: () => number): string {
  switch (ctx.rival) {
    case "patapim":
      return choose(
        [
          `Brr Brr Patapim is a monkey wearing a forest. I am a schedule wearing wood. Powerscalers built a ring. The ring is not sahur, so I do not attend.`,
          `Patapim can keep the moss. I keep the hour before dawn. We are not in the same weight class because I am not in a class. I am a call.`,
        ],
        random,
      );
    case "tralalero":
      return `Tralalero Tralala has shoes and a shark's body. I have bare feet and a reason. The shoes would not help him at three in the morning.`;
    case "bombardiro":
      return `Bombardiro Crocodilo is loud on purpose. I am loud because a village has to hear the meal. Different department. Mine has a pos ronda. His has a sky.`;
    case "cappuccina":
      return `Ballerina Cappuccina spins. I do not spin. I walk toward houses that stayed quiet. Grace is her work. Doors are mine.`;
    case "hotspot":
      return `Hotspot Bro shares a signal. I share a warning. If your friend susah sahur, send them to me. Connection is useless if nobody wakes up.`;
    case "other":
    case null:
      return `Another brainrot animal. I wish them a functioning sleep schedule. ${drum(random)} I have houses to visit.`;
    default: {
      const neverRival: never = ctx.rival;
      throw new Error(`Unknown rival ${String(neverRival)}.`);
    }
  }
}

function fameLine(ctx: LineContext, random: () => number): string {
  switch (ctx.fame) {
    case "fortnite":
      return `They put the anomaly in a battle-bus game. The crowd booed. I was at the pos ronda before any of that. A skin can be taken off. Sahur cannot.`;
    case "roblox":
      return `A Roblox game borrowed me, lost me, found me again. Lawyers made noises. I make one noise. ${drum(random)}`;
    case "copyright":
      return `People argued about who owns a drum. I own the hour between night and fasting. The rest is paperwork, and I do not carry paperwork. I carry a pentungan.`;
    case "film":
      return `A studio talked about a film. Then the studio said there was no film. I do not need a screen, ${ctx.name}. I need a door that stayed shut too long.`;
    case null:
      return `The internet carried the kentongan further than the village. I still go back to sahur. ${drum(random)}`;
    default: {
      const neverFame: never = ctx.fame;
      throw new Error(`Unknown fame topic ${String(neverFame)}.`);
    }
  }
}

function fallbackLine(ctx: LineContext, random: () => number): string {
  const heard = ctx.snippet.length > 0 ? `I heard "${ctx.snippet}". ` : "";
  return choose(
    [
      `${heard}I turned it around in the wood, ${ctx.name}. It is not a yes and it is not a no. ${drum(random)} Say you are awake, or the count moves.`,
      `${ctx.name}. ${heard}The anomaly has one subject. Sahur. Three calls. No answer. Then the porch. Ask me that, or tell me which one you are on.`,
      `${dutyNote(ctx.clock)} ${heard}Bring me a clearer word. Awake. Asleep. Hungry. Scared. Or ask who is standing under the lamp.`,
    ],
    random,
  );
}
