import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const clientIdKey = 'faithandme.anonymousClientId.v1';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUuid() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return randomUuid;

  const expoUuid = Crypto.randomUUID();
  if (expoUuid) return expoUuid;

  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);

  if (bytes.every((byte) => byte === 0)) {
    throw new Error('Secure random UUID generation is unavailable.');
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isValidAnonymousClientId(value: string | null | undefined) {
  return Boolean(value && uuidPattern.test(value));
}

export async function getOrCreateClientId() {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    throw new Error('Secure storage is unavailable.');
  }

  const existing = await SecureStore.getItemAsync(clientIdKey);
  if (isValidAnonymousClientId(existing)) {
    return existing?.toLowerCase() ?? '';
  }

  const nextId = generateUuid().toLowerCase();
  await SecureStore.setItemAsync(clientIdKey, nextId);
  return nextId;
}
