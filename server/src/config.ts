import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) {
    loadEnv({ path, override: false, quiet: true });
  }
}

export const serverConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-5.5',
  requestTimeoutMs: 20000,
  limits: {
    questionMinLength: 8,
    questionMaxLength: 800,
    maxPassages: 5,
    maxPassageTextLength: 1200,
    maxTotalPassageTextLength: 3600,
    maxOutputTokens: 2400,
    rateLimitWindowMs: 60_000,
    rateLimitMaxRequests: 20,
  },
} as const;

export function assertProductionConfig() {
  if (serverConfig.nodeEnv === 'production' && !serverConfig.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required in production.');
  }
}
