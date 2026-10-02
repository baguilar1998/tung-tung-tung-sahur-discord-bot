import "dotenv/config";
import { createResponder } from "./bot/responder.js";
import { loadConfig } from "./config.js";
import { startBot } from "./discord/startBot.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const client = await startBot({
    token: config.discordToken,
    responder: createResponder(),
    logger,
  });

  const shutdown = (): void => {
    logger.info("The pos ronda is closing.");
    client.destroy();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : "unknown error";
  logger.error(detail);
  process.exit(1);
});
