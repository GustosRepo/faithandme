import type { ScripturePassage } from '@/services/scripture/types';

export type AskScripturePassagePayload = {
  reference: string;
  displayReference: string;
  text: string;
};

export type AskEntitlement = 'free' | 'plus';

export type AskUserContext = {
  goals?: string[];
  situations?: string[];
  feeling?: string;
};

export type AskScriptureModelScripture = {
  reference: string;
  reason: string;
};

export type AskScriptureAnswerPayload = {
  summary: string;
  scriptures: AskScriptureModelScripture[];
  context: string;
  application: string;
  reflectionQuestions: string[];
  prayer: string;
  nextStep: string;
  safetyNote?: string;
};

export type AskScriptureApiResponse = {
  requestId: string;
  safetyLevel: 'standard' | 'immediate-danger';
  answer: AskScriptureAnswerPayload;
  entitlement?: AskEntitlement;
  usage: AskScriptureUsage;
};

export type AskScriptureUsage = {
  entitlement?: AskEntitlement;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
};

export type ResolvedAskScripture = AskScriptureModelScripture & {
  passage: ScripturePassage;
};

export type AskScriptureResult = {
  question: string;
  retrievedPassages: ScripturePassage[];
  scriptures: ResolvedAskScripture[];
  answer: Omit<AskScriptureAnswerPayload, 'scriptures'>;
  safetyLevel: AskScriptureApiResponse['safetyLevel'];
  usage: AskScriptureUsage;
};

export type AskScriptureErrorCode =
  | 'invalid_question'
  | 'missing_api_url'
  | 'invalid_client_id'
  | 'daily_ask_limit'
  | 'ip_daily_limit'
  | 'ai_daily_cap'
  | 'ask_scripture_disabled'
  | 'ask_already_in_progress'
  | 'rate_limited'
  | 'network'
  | 'server';

export class AskScriptureError extends Error {
  code: AskScriptureErrorCode;

  constructor(code: AskScriptureErrorCode, message: string) {
    super(message);
    this.name = 'AskScriptureError';
    this.code = code;
  }
}
