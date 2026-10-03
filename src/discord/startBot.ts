import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  type Message,
} from "discord.js";
import type { Responder } from "../bot/responder.js";
import type { Logger } from "../logger.js";
import { deliverWake, findHomeChannel, type WakeChannel } from "./wake.js";
import { SLEEP_NOTICE } from "../personality/sleep.js";

export interface StartBotOptions {
  token: string;
  responder: Responder;
  logger: Logger;
}

export interface RunningBot {
  client: Client;
}

export async function startBot(options: StartBotOptions): Promise<RunningBot> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    options.logger.info(
      `On duty as ${readyClient.user.tag}. Mention me and I answer. In a busy channel I sometimes speak on my own.`,
    );
    void announceAwake(readyClient, options.logger);
  });

  client.on(Events.Error, (error) => {
    options.logger.error(error.message);
  });

  client.on(Events.MessageCreate, (message) => {
    void answerMention(message, client.user?.id, options.responder, options.logger);
  });

  try {
    await client.login(options.token);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown login error";
    throw new Error(
      `Discord rejected the login (${detail}). Check DISCORD_TOKEN, and enable Message Content Intent on the Bot page if the error mentions intents.`,
    );
  }

  return { client };
}

export async function announceSleep(client: Client, log: Logger): Promise<void> {
  const open = await openChannels(client, log);
  const home = findHomeChannel(open);
  if (!home) {
    log.info("The pos ronda is closing, and #agent-battle was not open.");
    return;
  }
  const sent = await sendToChannel(client, home.id, SLEEP_NOTICE, log, "Could not say goodnight");
  if (sent) log.info("Said goodnight in #agent-battle.");
}

export async function announceAwake(client: Client, log: Logger, random: () => number = Math.random): Promise<string | null> {
  const open = await openChannels(client, log);
  const channelId = await deliverWake({
    channels: open,
    random,
    send: (id, content) => sendToChannel(client, id, content, log, "Could not say he is alive"),
  });
  if (channelId === null) {
    log.info("Awake, but no open channel accepted the introduction.");
    return null;
  }
  const name = open.find((channel) => channel.id === channelId)?.name ?? channelId;
  log.info(`Introduced himself in #${name}.`);
  return channelId;
}

async function openChannels(client: Client, log: Logger): Promise<WakeChannel[]> {
  try {
    await client.guilds.fetch();
  } catch (error) {
    log.error(`Could not look up servers: ${errorText(error)}`);
  }

  const open: WakeChannel[] = [];
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.channels.fetch();
    } catch (error) {
      log.error(`Could not look up channels in ${guild.name}: ${errorText(error)}`);
      continue;
    }
    const me = guild.members.me;
    if (!me) continue;
    for (const channel of guild.channels.cache.values()) {
      if (channel.type !== ChannelType.GuildText) continue;
      const permissions = channel.permissionsFor(me);
      if (!permissions?.has(PermissionFlagsBits.ViewChannel)) continue;
      if (!permissions.has(PermissionFlagsBits.SendMessages)) continue;
      open.push({ id: channel.id, name: channel.name });
    }
  }
  return open;
}

async function sendToChannel(
  client: Client,
  channelId: string,
  content: string,
  log: Logger,
  failure: string,
): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel === null || !channel.isTextBased() || !("send" in channel)) {
      log.error(`${failure}.`);
      return false;
    }
    await channel.send({ content, allowedMentions: { parse: [] } });
    return true;
  } catch (error) {
    log.error(`${failure}: ${errorText(error)}`);
    return false;
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

function otherUsers(message: Message, botId: string | undefined): { id: string; handle: string }[] {
  return [...message.mentions.users.values()]
    .filter((user) => user.id !== botId && user.username.length > 0)
    .map((user) => ({ id: user.id, handle: user.username }));
}

function describePlace(message: Message): string {
  const channelName = "name" in message.channel && typeof message.channel.name === "string" ? message.channel.name : "";
  const guildName = message.guild?.name ?? "";
  if (guildName && channelName) return `server "${guildName}", channel "#${channelName}"`;
  if (channelName) return `channel "#${channelName}"`;
  return "a direct message";
}

async function answerMention(
  message: Message,
  botId: string | undefined,
  responder: Responder,
  log: Logger,
): Promise<void> {
  const mentionsBot = botId !== undefined && message.mentions.users.has(botId);
  if (mentionsBot && !message.author.bot && !message.system && "sendTyping" in message.channel) {
    await message.channel.sendTyping().catch(() => undefined);
  }

  let text: string | null;
  try {
    text = await responder.handle({
      authorIsBot: message.author.bot,
      system: message.system,
      mentionsBot,
      content: message.content,
      authorId: message.author.id,
      channelId: message.channelId,
      displayName: message.member?.displayName ?? message.author.displayName,
      place: describePlace(message),
      mentionedUsers: otherUsers(message, botId),
      inServer: message.guild !== null,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown reply error";
    log.error(`Could not prepare an answer: ${detail}`);
    return;
  }
  if (text === null) return;

  try {
    const mentionIds = [...text.matchAll(/<@!?(\d+)>/g)]
      .map((match) => match[1])
      .filter((id): id is string => id !== undefined);
    await message.reply({
      content: text,
      allowedMentions: { parse: [], users: mentionIds },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown send error";
    log.error(`Could not answer in #${message.channelId}: ${detail}`);
  }
}
