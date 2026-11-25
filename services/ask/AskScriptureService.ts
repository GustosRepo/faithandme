import { askScriptureConfig } from '@/services/ask/config';
import { loadRecentReferences, recordCitedReferences } from '@/services/ask/askHistory';
import { getAskClientHeaders } from '@/services/ask/askSession';
import { retrieveRelevantScripture } from '@/services/ask/scriptureRetrieval';
import { getScriptureService } from '@/services/scripture/ScriptureService';
import type { ScripturePassage } from '@/services/scripture/types';
import type { AppLanguage } from '@/context/LanguageContext';

import type { AskScriptureApiResponse, AskScripturePassagePayload, AskScriptureResult, AskScriptureUsage, AskUserContext } from './types';
import { AskScriptureError } from './types';

function sanitizeContext(context: AskUserContext | undefined): AskUserContext | undefined {
  if (!context) return undefined;
  const goals = context.goals?.filter(Boolean).slice(0, 3);
  const situations = context.situations?.filter(Boolean).slice(0, 3);
  const feeling = context.feeling && context.feeling !== 'Prefer not to say' ? context.feeling : undefined;
  if (!goals?.length && !situations?.length && !feeling) return undefined;
  return {
    ...(goals?.length ? { goals } : {}),
    ...(situations?.length ? { situations } : {}),
    ...(feeling ? { feeling } : {}),
  };
}

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
  language: AppLanguage,
): AskScriptureResult {
  const allowed = new Set(retrievedPassages.map((passage) => passage.reference.toUpperCase()));
  const scriptureService = getScriptureService(language);
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
    usage: { ...response.usage, entitlement: response.usage.entitlement ?? response.entitlement },
  };
}

function errorForCode(code: string | undefined, fallback: string) {
  switch (code) {
    case 'INVALID_REQUEST':
      return new AskScriptureError('invalid_question', 'Add a little more detail so we can find relevant Scripture.');
    case 'INVALID_CLIENT_ID':
    case 'INVALID_SESSION':
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

async function fetchAskScriptureUsage(refreshEntitlement: boolean): Promise<AskScriptureUsage> {
  if (!askScriptureConfig.apiBaseUrl) {
    throw new AskScriptureError('missing_api_url', 'Ask Scripture needs a Faith & Me API URL before it can respond.');
  }

  const headers = await getAskClientHeaders();
  const endpoint = refreshEntitlement ? 'entitlement' : 'usage';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let response: Response;
  try {
    response = await fetch(`${askScriptureConfig.apiBaseUrl}/api/ask-scripture/${endpoint}`, {
      method: refreshEntitlement ? 'POST' : 'GET',
      headers,
      signal: controller.signal,
    });
  } catch {
    throw new AskScriptureError('network', "Ask Scripture couldn't connect right now.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw await parseError(response, 'Ask Scripture usage is temporarily unavailable.');
  }

  return response.json() as Promise<AskScriptureUsage>;
}

export function getAskScriptureUsage() {
  return fetchAskScriptureUsage(false);
}

export function refreshAskScriptureEntitlement() {
  return fetchAskScriptureUsage(true);
}

export async function askScripture(
  question: string,
  language: AppLanguage = 'en',
  options: { personalization?: { consent: true; context: AskUserContext } } = {},
): Promise<AskScriptureResult> {
  const trimmedQuestion = validateQuestion(question);

  if (!askScriptureConfig.apiBaseUrl) {
    throw new AskScriptureError('missing_api_url', 'Ask Scripture needs a Faith & Me API URL before it can respond.');
  }

  const recentReferences = await loadRecentReferences();
  const retrievedPassages = retrieveRelevantScripture(trimmedQuestion, askScriptureConfig.maxPassages, language, {
    excludeReferences: recentReferences,
    maxTotalTextLength: askScriptureConfig.maxTotalPassageTextLength,
  });

  if (!retrievedPassages.length) {
    throw new AskScriptureError('server', 'Something went wrong while preparing your response.');
  }

  let response: Response;
  const headers = await getAskClientHeaders();
  const context = options.personalization?.consent ? sanitizeContext(options.personalization.context) : undefined;

  try {
    response = await fetch(`${askScriptureConfig.apiBaseUrl}/api/ask-scripture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        question: trimmedQuestion,
        language,
        passages: toPayload(retrievedPassages),
        ...(context ? { context, personalizationConsent: true } : {}),
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
  const result = validateAndResolveResponse(data, retrievedPassages, trimmedQuestion, language);
  void recordCitedReferences(result.scriptures.map((scripture) => scripture.reference));
  return result;
}
