import { z } from "zod";

const schema = z.object({
  DISCORD_TOKEN: z
    .string()
    .trim()
    .min(1, "DISCORD_TOKEN is empty.")
    .refine((value) => value !== "your-bot-token", "DISCORD_TOKEN is still the placeholder from .env.example."),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
});

export interface Config {
  discordToken: string;
  groqApiKey: string | null;
  groqModel: string;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = schema.safeParse({
    DISCORD_TOKEN: env.DISCORD_TOKEN,
    GROQ_API_KEY: env.GROQ_API_KEY,
    GROQ_MODEL: env.GROQ_MODEL,
  });
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(
      `Cannot start Tung Tung Tung Sahur. Set DISCORD_TOKEN. ${detail} Copy .env.example to .env and paste the bot token from the Discord Developer Portal.`,
    );
  }
  const model = parsed.data.GROQ_MODEL?.trim();
  return {
    discordToken: parsed.data.DISCORD_TOKEN,
    groqApiKey: groqKey(parsed.data.GROQ_API_KEY),
    groqModel: model && model.length > 0 ? model : "openai/gpt-oss-120b",
  };
}

function groqKey(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0 || trimmed === "your-groq-key") return null;
  return trimmed;
}
