export interface JakartaClock {
  hour: number;
  minute: number;
  /** 24-hour HH:MM in Asia/Jakarta. */
  label: string;
  /** Pre-dawn sahur watch, 02:30 through 05:00 Jakarta time. */
  sahurWatch: boolean;
  phase: "sahur" | "morning" | "day" | "waiting";
}

const MINUTES_IN_DAY = 24 * 60;
const SAHUR_START = 2 * 60 + 30;
const SAHUR_END = 5 * 60;
const MORNING_END = 11 * 60;
const DAY_END = 17 * 60;

export function readJakarta(date: Date): JakartaClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = readPart(parts, "hour");
  const minute = readPart(parts, "minute");
  const minutes = hour * 60 + minute;

  return {
    hour,
    minute,
    label: `${pad(hour)}:${pad(minute)}`,
    sahurWatch: minutes >= SAHUR_START && minutes <= SAHUR_END,
    phase: phaseFor(minutes),
  };
}

export function dutyNote(clock: JakartaClock): string {
  switch (clock.phase) {
    case "sahur":
      return `Jakarta says ${clock.label}. This is my hour.`;
    case "morning":
      return `Jakarta says ${clock.label}. Sahur is over. I should be wood again. You woke the wood.`;
    case "day":
      return `Jakarta says ${clock.label}. Daylight. I do not belong to daylight. You called, so the anomaly makes an exception.`;
    case "waiting":
      return `Jakarta says ${clock.label}. Not sahur yet. The kentongan is patient. Barely.`;
  }
}

function phaseFor(minutes: number): JakartaClock["phase"] {
  const wrapped = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  if (wrapped >= SAHUR_START && wrapped <= SAHUR_END) return "sahur";
  if (wrapped > SAHUR_END && wrapped < MORNING_END) return "morning";
  if (wrapped >= MORNING_END && wrapped < DAY_END) return "day";
  return "waiting";
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Could not read Jakarta ${type} from the clock.`);
  }
  return parsed;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
