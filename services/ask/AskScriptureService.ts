import { askScriptureConfig } from '@/services/ask/config';
import { retrieveRelevantScripture } from '@/services/ask/scriptureRetrieval';
import { scriptureService } from '@/services/scripture/ScriptureService';
import type { ScripturePassage } from '@/services/scripture/types';

import type { AskScriptureApiResponse, AskScripturePassagePayload, AskScriptureResult } from './types';
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
  };
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

  try {
    response = await fetch(`${askScriptureConfig.apiBaseUrl}/api/ask-scripture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: trimmedQuestion,
        passages: toPayload(retrievedPassages),
      }),
    });
  } catch {
    throw new AskScriptureError('network', "Ask Scripture couldn't connect right now.");
  }

  if (response.status === 429) {
    throw new AskScriptureError('rate_limited', 'Please wait a moment before asking another question.');
  }

  if (response.status === 400) {
    throw new AskScriptureError('invalid_question', 'Add a little more detail so we can find relevant Scripture.');
  }

  if (!response.ok) {
    throw new AskScriptureError('server', 'Something went wrong while preparing your response.');
  }

  const data = await response.json() as AskScriptureApiResponse;
  return validateAndResolveResponse(data, retrievedPassages, trimmedQuestion);
}
