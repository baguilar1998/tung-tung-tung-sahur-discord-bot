import "dotenv/config";
import { completeGroq } from "./ai/groq.js";
import { createResponder } from "./bot/responder.js";
import { loadConfig } from "./config.js";
import { announceSleep, startBot } from "./discord/startBot.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const groqApiKey = config.groqApiKey;
  if (groqApiKey) {
    logger.info(`Voice model: ${config.groqModel}. Prepared lines answer if the model is quiet.`);
  } else {
    logger.info("No Groq key set. Prepared lines only.");
  }

  const bot = await startBot({
    token: config.discordToken,
    responder: createResponder({
      complete: groqApiKey
        ? (messages) => completeGroq({ apiKey: groqApiKey, model: config.groqModel, messages })
        : undefined,
      onModelError(message) {
        logger.error(message);
      },
    }),
    logger,
  });

  let shuttingDown = false;
  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("The pos ronda is closing.");
    const goodbye = announceSleep(bot.client, logger);
    const limit = new Promise<void>((resolve) => {
      setTimeout(resolve, 5_000);
    });
    void Promise.race([goodbye, limit]).finally(() => {
      bot.client.destroy();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("SIGHUP", shutdown);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : "unknown error";
  logger.error(detail);
  process.exit(1);
});
