import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'faithandme.ask.recentReferences.v1';
const MAX_RECENT_REFERENCES = 16;

/**
 * Recently cited Scripture references, most recent first. Used to steer retrieval
 * away from passages the person has just seen so answers stay fresh day to day.
 */
export async function loadRecentReferences(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_REFERENCES);
  } catch {
    return [];
  }
}

export async function recordCitedReferences(references: string[]): Promise<void> {
  if (!references.length) return;
  try {
    const existing = await loadRecentReferences();
    const normalized = references.map((reference) => reference.toUpperCase());
    const merged = [...normalized, ...existing.filter((reference) => !normalized.includes(reference))];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, MAX_RECENT_REFERENCES)));
  } catch {
    // Recency is a best-effort enhancement; never block an answer on it.
  }
}
