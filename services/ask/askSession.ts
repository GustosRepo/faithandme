import * as SecureStore from 'expo-secure-store';

import { getOrCreateClientId, isValidAnonymousClientId } from '@/services/identity/AnonymousClientId';

import { askScriptureConfig } from './config';

const storageKey = 'faithandme.askSession.v1';

type AskSession = { subscriberId: string; token: string };
type StoredSession = AskSession & { clientId: string; apiBaseUrl: string };

let enrollment: Promise<AskSession> | undefined;

async function readSession(clientId: string, apiBaseUrl: string) {
  const raw = await SecureStore.getItemAsync(storageKey);
  if (!raw) return undefined;
  try {
    const stored = JSON.parse(raw) as StoredSession;
    if (stored?.clientId === clientId && stored.apiBaseUrl === apiBaseUrl && isAskSession(stored)) return stored;
  } catch {
    // An unreadable credential cannot be used to authenticate the installation.
  }
}

function isAskSession(session: AskSession) {
  return isValidAnonymousClientId(session?.subscriberId) &&
    typeof session.token === 'string' &&
    session.token.startsWith(`${session.subscriberId}.`);
}

export async function getAskClientHeaders(): Promise<Record<string, string>> {
  const clientId = await getOrCreateClientId();
  const session = await readSession(clientId, askScriptureConfig.apiBaseUrl);
  return {
    'X-Faith-Client-Id': clientId,
    ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

async function loadOrEnrollAskSession(): Promise<AskSession> {
  const { apiBaseUrl } = askScriptureConfig;
  if (!apiBaseUrl || (!__DEV__ && !apiBaseUrl.startsWith('https://'))) {
    throw new Error('A secure Faith & Me API URL is required for purchases.');
  }
  const clientId = await getOrCreateClientId();
  const stored = await readSession(clientId, apiBaseUrl);
  if (stored) return stored;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${apiBaseUrl}/api/ask-scripture/session`, {
      method: 'POST',
      headers: { 'X-Faith-Client-Id': clientId },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('The purchase session could not be created.');
    const session = await response.json() as AskSession;
    if (!isAskSession(session)) throw new Error('The purchase session could not be read.');
    await SecureStore.setItemAsync(storageKey, JSON.stringify({ ...session, clientId, apiBaseUrl }));
    return session;
  } finally {
    clearTimeout(timeout);
  }
}

export function getOrCreateAskSession() {
  enrollment ??= loadOrEnrollAskSession().finally(() => { enrollment = undefined; });
  return enrollment;
}
