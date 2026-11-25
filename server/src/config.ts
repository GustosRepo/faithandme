import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

const OPENAI_REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const;
type OpenAiReasoningEffort = (typeof OPENAI_REASONING_EFFORTS)[number];

for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) {
    loadEnv({ path, override: false, quiet: true });
  }
}

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getOpenAiReasoningEffort(envName: string, fallback: OpenAiReasoningEffort): OpenAiReasoningEffort {
  const value = getOptionalEnv(envName);
  if (value && OPENAI_REASONING_EFFORTS.includes(value as OpenAiReasoningEffort)) {
    return value as OpenAiReasoningEffort;
  }

  return fallback;
}

export const serverConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: getOptionalEnv('OPENAI_MODEL') ?? 'gpt-5.6-luna',
  openAiReasoningEffort: getOpenAiReasoningEffort('OPENAI_REASONING_EFFORT', 'low'),
  openAiPlusReasoningEffort: getOpenAiReasoningEffort('OPENAI_PLUS_REASONING_EFFORT', 'medium'),
  askScriptureEnabled: process.env.ASK_SCRIPTURE_ENABLED !== 'false',
  ipHashSecret: process.env.IP_HASH_SECRET ?? (process.env.NODE_ENV === 'production' ? undefined : 'development-ip-hash-secret'),
  askSessionSecret: getOptionalEnv('ASK_SESSION_SECRET') ?? (process.env.NODE_ENV === 'production' ? undefined : 'development-ask-session-secret'),
  requestTimeoutMs: 20000,
  bibleDataDir: getOptionalEnv('BIBLE_DATA_DIR'),
  revenueCat: {
    apiKey: getOptionalEnv('REVENUECAT_API_KEY'),
    apiUrl: getOptionalEnv('REVENUECAT_API_URL') ?? 'https://api.revenuecat.com/v1',
    entitlementId: getOptionalEnv('REVENUECAT_ENTITLEMENT_ID') ?? 'plus',
    cacheTtlMs: Number(process.env.REVENUECAT_CACHE_TTL_MS ?? 5 * 60_000),
    requestTimeoutMs: Number(process.env.REVENUECAT_TIMEOUT_MS ?? 3000),
  },
  limits: {
    freeAsksPerDay: Number(process.env.FREE_ASKS_PER_DAY ?? 1),
    plusAsksPerDay: Number(process.env.PLUS_ASKS_PER_DAY ?? 20),
    maxAsksPerIpPerDay: Number(process.env.MAX_ASKS_PER_IP_PER_DAY ?? 30),
    maxAiRequestsPerDay: Number(process.env.MAX_AI_REQUESTS_PER_DAY ?? 500),
    questionMinLength: 8,
    questionMaxLength: 800,
    maxPassages: 5,
    maxRequestPassages: 8,
    maxPassageTextLength: 1200,
    maxTotalPassageTextLength: 6000,
    maxOutputTokens: 2400,
    rateLimitWindowMs: 60_000,
    rateLimitMaxRequests: 20,
  },
} as const;

export function assertProductionConfig() {
  if (serverConfig.nodeEnv === 'production' && !serverConfig.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required in production.');
  }
  if (serverConfig.nodeEnv === 'production' && !serverConfig.databaseUrl) {
    throw new Error('DATABASE_URL is required in production for durable anonymous usage limits.');
  }
  if (serverConfig.nodeEnv === 'production' && !serverConfig.ipHashSecret) {
    throw new Error('IP_HASH_SECRET is required in production for daily IP abuse buckets.');
  }
  if (serverConfig.nodeEnv === 'production' && serverConfig.revenueCat.apiKey && !serverConfig.askSessionSecret) {
    throw new Error('ASK_SESSION_SECRET is required in production when RevenueCat is enabled.');
  }
}
