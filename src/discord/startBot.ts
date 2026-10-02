import {
  Client,
  Events,
  GatewayIntentBits,
  type Message,
} from "discord.js";
import type { Responder } from "../bot/responder.js";
import type { Logger } from "../logger.js";

export interface StartBotOptions {
  token: string;
  responder: Responder;
  logger: Logger;
}

export async function startBot(options: StartBotOptions): Promise<Client> {
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
      `On duty as ${readyClient.user.tag}. Mention me and I answer. I stay quiet otherwise.`,
    );
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

  return client;
}

async function answerMention(
  message: Message,
  botId: string | undefined,
  responder: Responder,
  log: Logger,
): Promise<void> {
  const text = responder.handle({
    authorIsBot: message.author.bot,
    system: message.system,
    mentionsBot: botId !== undefined && message.mentions.users.has(botId),
    content: message.content,
    authorId: message.author.id,
    displayName: message.member?.displayName ?? message.author.displayName,
  });
  if (text === null) return;

  try {
    await message.reply({
      content: text,
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown send error";
    log.error(`Could not answer in #${message.channelId}: ${detail}`);
  }
}
