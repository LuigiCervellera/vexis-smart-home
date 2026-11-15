import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  TZ: z.string().default('Europe/Rome'),
  VEXIS_WAKE_WORD: z.string().default('Vexis'),
  VEXIS_LLM_MODEL: z.string().default('qwen2.5:7b'),
  VEXIS_SESSION_TTL_SEC: z.coerce.number().int().min(15).max(300).default(60),
  VEXIS_MAX_HISTORY_TURNS: z.coerce.number().int().min(1).max(10).default(3),

  MQTT_HOST: z.string().min(1),
  MQTT_PORT: z.coerce.number().int().default(1883),
  MQTT_USER: z.string().min(1),
  MQTT_PASSWORD: z.string().min(1),

  BACKEND_PORT: z.coerce.number().int().default(3001),
  WS_PORT: z.coerce.number().int().default(3002),
  WS_AUTH_TOKEN: z.string().min(16, 'WS_AUTH_TOKEN must be at least 16 chars'),

  OLLAMA_HOST: z.string().url().default('http://ollama:11434'),
  WHISPER_HOST: z.string().url().default('http://whisper:9000'),
  PIPER_HOST: z.string().url().default('http://piper:10200'),

  IMMICH_URL: z.string().url().optional(),
  IMMICH_API_KEY: z.string().optional(),

  NTFY_URL: z.string().url().optional(),
  NTFY_TOPIC: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[VEXIS] Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
