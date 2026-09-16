import OpenAI from 'openai';

import { serverConfig } from '../config.js';
import type { AskScriptureRequest, ModelAskScriptureResponse } from '../schemas/askScripture.js';
import { sanitizeModelResponse } from './validation.js';
import { safetyInstructionFor, type SafetyLevel } from './safety.js';

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

function buildPrompt(request: AskScriptureRequest, safetyLevel: SafetyLevel) {
  const passages = request.passages.map((passage) => ({
    reference: passage.reference,
    displayReference: passage.displayReference,
    text: passage.text,
  }));

  return [
    {
      role: 'system' as const,
      content: [
        'You help explain and apply Scripture supplied in the request.',
        'Use only the supplied passages as authoritative quoted Scripture for this response.',
        `Do not invent Bible quotations or introduce new Scripture references. Scripture reference values must exactly match one of: ${request.passages.map((passage) => passage.reference).join(', ')}.`,
        'Do not return Scripture text. Return references and reasons only; the app resolves canonical BSB text locally.',
        'Do not claim God directly told the user something or claim knowledge of God’s specific plan.',
        'Distinguish Scripture from explanation and application.',
        'When interpretations vary among Christian traditions, avoid presenting one contested interpretation as universal.',
        'Keep the response compassionate, concise, and practical.',
        'Set safetyNote to an empty string unless immediate real-world safety guidance is needed.',
        safetyInstructionFor(safetyLevel),
      ].filter(Boolean).join(' '),
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        question: request.question,
        suppliedPassages: passages,
      }),
    },
  ];
}

export async function createAskScriptureResponse(
  request: AskScriptureRequest,
  safetyLevel: SafetyLevel,
): Promise<ModelAskScriptureResponse> {
  const response = await getClient().responses.create({
    model: serverConfig.openAiModel,
    input: buildPrompt(request, safetyLevel),
    max_output_tokens: serverConfig.limits.maxOutputTokens,
    text: {
      format: {
        type: 'json_schema',
        name: 'faith_and_me_ask_scripture_response',
        strict: true,
        schema: buildResponseSchema(request.passages.map((passage) => passage.reference)),
      },
    },
  });

  const rawText = response.output_text;
  if (!rawText) {
    throw new Error('Model returned an empty response.');
  }

  const parsed = JSON.parse(rawText) as unknown;
  return sanitizeModelResponse(parsed, request.passages.map((passage) => passage.reference));
}
