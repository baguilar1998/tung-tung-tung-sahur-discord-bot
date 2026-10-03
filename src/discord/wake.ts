import { choose } from "../personality/choose.js";
import { wakeLine } from "../personality/wake.js";

/** The channel he was connected to. He introduces himself here when he can. */
export const HOME_CHANNEL_NAME = "agent-battle";

export interface WakeChannel {
  id: string;
  name: string;
}

/** Only #agent-battle. Shutdown never borrows another channel. */
export function findHomeChannel(channels: readonly WakeChannel[]): WakeChannel | null {
  return channels.find((channel) => channel.name.toLowerCase() === HOME_CHANNEL_NAME) ?? null;
}

/**
 * Home channel when it is open. Otherwise one other channel he can speak in,
 * so a restart still gets an introduction somewhere.
 */
export function chooseWakeChannel(channels: readonly WakeChannel[], random: () => number): WakeChannel | null {
  const home = channels.find((channel) => channel.name.toLowerCase() === HOME_CHANNEL_NAME);
  if (home) return home;
  if (channels.length === 0) return null;
  return choose(channels, random);
}

/**
 * Tries the preferred channel first. If that send fails, tries the other open
 * channels until one accepts the introduction.
 */
export async function deliverWake(input: {
  channels: readonly WakeChannel[];
  random: () => number;
  send: (channelId: string, content: string) => Promise<boolean>;
}): Promise<string | null> {
  const first = chooseWakeChannel(input.channels, input.random);
  if (!first) return null;
  const content = wakeLine(input.random);
  const order = [first, ...input.channels.filter((channel) => channel.id !== first.id)];
  for (const channel of order) {
    if (await input.send(channel.id, content)) return channel.id;
  }
  return null;
}
