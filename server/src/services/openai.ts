import OpenAI from 'openai';

import { serverConfig } from '../config.js';
import type { AskContext, ModelAskScriptureResponse } from '../schemas/askScripture.js';
import type { AskEntitlement } from './askPolicy.js';
import type { CanonicalPassage } from './bible.js';
import { sanitizeModelResponse } from './validation.js';
import { safetyInstructionFor, type SafetyLevel } from './safety.js';

export type OpenAiTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AskModelInput = {
  question: string;
  language: 'en' | 'es';
  passages: CanonicalPassage[];
  context?: AskContext;
  safetyLevel: SafetyLevel;
  entitlement: AskEntitlement;
};

function buildResponseSchema(allowedReferences: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'scriptures', 'context', 'application', 'reflectionQuestions', 'prayer', 'nextStep', 'safetyNote'],
    properties: {
      summary: { type: 'string' },
      scriptures: {
        type: 'array',
        minItems: 1,
        maxItems: serverConfig.limits.maxPassages,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['reference', 'reason'],
          properties: {
            reference: { type: 'string', enum: allowedReferences },
            reason: { type: 'string' },
          },
        },
      },
      context: { type: 'string' },
      application: { type: 'string' },
      reflectionQuestions: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: { type: 'string' },
      },
      prayer: { type: 'string' },
      nextStep: { type: 'string' },
      safetyNote: { type: 'string' },
    },
  } as const;
}

let client: OpenAI | null = null;

function getClient() {
  if (!serverConfig.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  client ??= new OpenAI({ apiKey: serverConfig.openAiApiKey, timeout: serverConfig.requestTimeoutMs });
  return client;
}

function buildPrompt(input: AskModelInput) {
  const passages = input.passages.map((passage) => ({
    reference: passage.reference,
    displayReference: passage.displayReference,
    text: passage.text,
  }));
  const responseLanguageInstruction = input.language === 'es'
    ? 'Write every user-facing field in natural, warm Latin American Spanish. Keep Scripture reference ids unchanged. Do not translate or quote Scripture text; the app displays canonical Bible text locally.'
    : 'Write every user-facing field in natural, warm English.';

  const hasContext = Boolean(input.context && (input.context.feeling || input.context.goals?.length || input.context.situations?.length));

  return [
    {
      role: 'system' as const,
      content: [
        'You help explain and apply Scripture supplied in the request.',
        'Use only the supplied passages as authoritative quoted Scripture for this response.',
        `Do not invent Bible quotations or introduce new Scripture references. Scripture reference values must exactly match one of: ${input.passages.map((passage) => passage.reference).join(', ')}.`,
        'Choose only the passages that best fit this specific question; you do not need to use every supplied passage.',
        'Do not return Scripture text. Return references and reasons only; the app resolves canonical BSB text locally.',
        'Do not claim God directly told the user something or claim knowledge of God’s specific plan.',
        'Distinguish Scripture from explanation and application.',
        'When interpretations vary among Christian traditions, avoid presenting one contested interpretation as universal.',
        'Keep the response compassionate, concise, and practical.',
        hasContext ? 'The request may include userContext the person shared during onboarding (how they feel, their situations, their goals). Use it to make the application and next step feel personal, but never repeat it back verbatim or make assumptions beyond it.' : '',
        responseLanguageInstruction,
        'Set safetyNote to an empty string unless immediate real-world safety guidance is needed.',
        safetyInstructionFor(input.safetyLevel),
      ].filter(Boolean).join(' '),
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        question: input.question,
        responseLanguage: input.language,
        ...(hasContext ? { userContext: input.context } : {}),
        suppliedPassages: passages,
      }),
    },
  ];
}

export function getReasoningEffortFor(entitlement: AskEntitlement) {
  return entitlement === 'plus' ? serverConfig.openAiPlusReasoningEffort : serverConfig.openAiReasoningEffort;
}

export async function createAskScriptureResponse(
  input: AskModelInput,
): Promise<{ answer: ModelAskScriptureResponse; tokenUsage: OpenAiTokenUsage }> {
  const response = await getClient().responses.create({
    model: serverConfig.openAiModel,
    input: buildPrompt(input),
    store: false,
    max_output_tokens: serverConfig.limits.maxOutputTokens,
    reasoning: {
      effort: getReasoningEffortFor(input.entitlement),
    },
    text: {
      format: {
        type: 'json_schema',
        name: 'faith_and_me_ask_scripture_response',
        strict: true,
        schema: buildResponseSchema(input.passages.map((passage) => passage.reference)),
      },
    },
  });

  const rawText = response.output_text;
  if (!rawText) {
    throw new Error('Model returned an empty response.');
  }

  const parsed = JSON.parse(rawText) as unknown;
  return {
    answer: sanitizeModelResponse(parsed, input.passages.map((passage) => passage.reference)),
    tokenUsage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      totalTokens: response.usage?.total_tokens,
    },
  };
}
