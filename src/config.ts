import { z } from "zod";

const schema = z.object({
  DISCORD_TOKEN: z
    .string()
    .trim()
    .min(1, "DISCORD_TOKEN is empty.")
    .refine((value) => value !== "your-bot-token", "DISCORD_TOKEN is still the placeholder from .env.example."),
});

export interface Config {
  discordToken: string;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = schema.safeParse({ DISCORD_TOKEN: env.DISCORD_TOKEN });
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(
      `Cannot start Tung Tung Tung Sahur. Set DISCORD_TOKEN. ${detail} Copy .env.example to .env and paste the bot token from the Discord Developer Portal.`,
    );
  }
  return { discordToken: parsed.data.DISCORD_TOKEN };
}
