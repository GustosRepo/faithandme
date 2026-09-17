import { askScriptureConfig } from '@/services/ask/config';
import { retrieveRelevantScripture } from '@/services/ask/scriptureRetrieval';
import { getOrCreateClientId } from '@/services/identity/AnonymousClientId';
import { scriptureService } from '@/services/scripture/ScriptureService';
import type { ScripturePassage } from '@/services/scripture/types';

import type { AskScriptureApiResponse, AskScripturePassagePayload, AskScriptureResult, AskScriptureUsage } from './types';
import { AskScriptureError } from './types';

function toPayload(passages: ScripturePassage[]): AskScripturePassagePayload[] {
  return passages.map((passage) => ({
    reference: passage.reference,
    displayReference: passage.displayReference,
    text: passage.text,
  }));
}

function validateQuestion(question: string) {
  const trimmed = question.trim();

  if (trimmed.length < askScriptureConfig.questionMinLength) {
    throw new AskScriptureError('invalid_question', 'Add a little more detail so we can find relevant Scripture.');
  }

  if (trimmed.length > askScriptureConfig.questionMaxLength) {
    throw new AskScriptureError('invalid_question', 'This question is a little long. Try asking it in a shorter way.');
  }

  return trimmed;
}

function validateAndResolveResponse(
  response: AskScriptureApiResponse,
  retrievedPassages: ScripturePassage[],
  question: string,
): AskScriptureResult {
  const allowed = new Set(retrievedPassages.map((passage) => passage.reference.toUpperCase()));
  const scriptures = response.answer.scriptures
    .filter((scripture) => allowed.has(scripture.reference.toUpperCase()))
    .map((scripture) => {
      const passage = scriptureService.getPassage(scripture.reference);
      return passage ? { ...scripture, passage } : null;
    })
    .filter((scripture): scripture is NonNullable<typeof scripture> => Boolean(scripture));

  if (!scriptures.length) {
    throw new AskScriptureError('server', 'Something went wrong while preparing your response.');
  }

  const { scriptures: _scriptures, ...answer } = response.answer;

  return {
    question,
    retrievedPassages,
    scriptures,
    answer,
    safetyLevel: response.safetyLevel,
    usage: response.usage,
  };
}

function errorForCode(code: string | undefined, fallback: string) {
  switch (code) {
    case 'INVALID_REQUEST':
      return new AskScriptureError('invalid_question', 'Add a little more detail so we can find relevant Scripture.');
    case 'INVALID_CLIENT_ID':
      return new AskScriptureError('invalid_client_id', 'Ask Scripture needs to prepare this device before asking.');
    case 'DAILY_ASK_LIMIT':
      return new AskScriptureError('daily_ask_limit', "You've used today's free questions. Come back tomorrow for more.");
    case 'IP_DAILY_LIMIT':
      return new AskScriptureError('ip_daily_limit', "Ask Scripture isn't available from this network right now. Please try again later.");
    case 'AI_DAILY_CAP':
      return new AskScriptureError('ai_daily_cap', 'Ask Scripture is temporarily unavailable. Please try again later.');
    case 'ASK_SCRIPTURE_DISABLED':
      return new AskScriptureError('ask_scripture_disabled', 'Ask Scripture is temporarily unavailable.');
    case 'ASK_ALREADY_IN_PROGRESS':
      return new AskScriptureError('ask_already_in_progress', 'Your previous question is still being prepared.');
    case 'RATE_LIMITED':
    case 'rate_limited':
      return new AskScriptureError('rate_limited', 'Please wait a moment before asking again.');
    default:
      return new AskScriptureError('server', fallback);
  }
}

async function parseError(response: Response, fallback: string) {
  try {
    const data = await response.json() as { error?: { code?: string; message?: string } };
    return errorForCode(data.error?.code, data.error?.message ?? fallback);
  } catch {
    return new AskScriptureError('server', fallback);
  }
}

export async function getAskScriptureUsage(): Promise<AskScriptureUsage> {
  if (!askScriptureConfig.apiBaseUrl) {
    throw new AskScriptureError('missing_api_url', 'Ask Scripture needs a Faith & Me API URL before it can respond.');
  }

  const clientId = await getOrCreateClientId();

  let response: Response;
  try {
    response = await fetch(`${askScriptureConfig.apiBaseUrl}/api/ask-scripture/usage`, {
      headers: { 'X-Faith-Client-Id': clientId },
    });
  } catch {
    throw new AskScriptureError('network', "Ask Scripture couldn't connect right now.");
  }

  if (!response.ok) {
    throw await parseError(response, 'Ask Scripture usage is temporarily unavailable.');
  }

  return response.json() as Promise<AskScriptureUsage>;
}

export async function askScripture(question: string): Promise<AskScriptureResult> {
  const trimmedQuestion = validateQuestion(question);

  if (!askScriptureConfig.apiBaseUrl) {
    throw new AskScriptureError('missing_api_url', 'Ask Scripture needs a Faith & Me API URL before it can respond.');
  }

  const retrievedPassages = retrieveRelevantScripture(trimmedQuestion, askScriptureConfig.maxPassages);

  if (!retrievedPassages.length) {
    throw new AskScriptureError('server', 'Something went wrong while preparing your response.');
  }

  let response: Response;
  const clientId = await getOrCreateClientId();

  try {
    response = await fetch(`${askScriptureConfig.apiBaseUrl}/api/ask-scripture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Faith-Client-Id': clientId },
      body: JSON.stringify({
        question: trimmedQuestion,
        passages: toPayload(retrievedPassages),
      }),
    });
  } catch {
    throw new AskScriptureError('network', "Ask Scripture couldn't connect right now.");
  }

  if (response.status === 400) {
    throw await parseError(response, 'Add a little more detail so we can find relevant Scripture.');
  }

  if (!response.ok) {
    throw await parseError(response, 'Something went wrong while preparing your response.');
  }

  const data = await response.json() as AskScriptureApiResponse;
  return validateAndResolveResponse(data, retrievedPassages, trimmedQuestion);
}
