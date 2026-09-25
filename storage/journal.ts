import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'faithandme.journal.v1';

export type JournalEntryKind = 'prayer' | 'reflection' | 'gratitude';
export type JournalEntrySource = 'manual' | 'ask';

export type JournalEntry = {
  id: string;
  kind: JournalEntryKind;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  source: JournalEntrySource;
};

export type JournalEntryInput = {
  kind: JournalEntryKind;
  title?: string;
  content: string;
  source?: JournalEntrySource;
};

function createId() {
  return `journal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeKind(value: unknown): JournalEntryKind {
  if (value === 'prayer' || value === 'gratitude' || value === 'reflection') return value;
  return 'reflection';
}

function normalizeSource(value: unknown): JournalEntrySource {
  return value === 'ask' ? 'ask' : 'manual';
}

function normalizeEntry(value: unknown): JournalEntry | null {
  if (!value || typeof value !== 'object') return null;

  const partial = value as Partial<JournalEntry>;
  if (typeof partial.content !== 'string' || partial.content.trim().length === 0) return null;

  const createdAt = typeof partial.createdAt === 'string' ? partial.createdAt : new Date().toISOString();

  return {
    id: typeof partial.id === 'string' ? partial.id : createId(),
    kind: normalizeKind(partial.kind),
    title: typeof partial.title === 'string' && partial.title.trim().length > 0 ? partial.title.trim() : 'Untitled',
    content: partial.content.trim(),
    createdAt,
    updatedAt: typeof partial.updatedAt === 'string' ? partial.updatedAt : createdAt,
    source: normalizeSource(partial.source),
  };
}

function normalizeEntries(value: unknown): JournalEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeEntry)
    .filter((entry): entry is JournalEntry => Boolean(entry))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function loadJournalEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveJournalEntries(entries: JournalEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeEntries(entries)));
}

export async function addJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
  const entries = await loadJournalEntries();
  const now = new Date().toISOString();
  const kind = normalizeKind(input.kind);
  const entry: JournalEntry = {
    id: createId(),
    kind,
    title: input.title?.trim() || defaultJournalTitle(kind),
    content: input.content.trim(),
    createdAt: now,
    updatedAt: now,
    source: input.source ?? 'manual',
  };

  await saveJournalEntries([entry, ...entries]);
  return entry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const entries = await loadJournalEntries();
  await saveJournalEntries(entries.filter((entry) => entry.id !== id));
}

export function defaultJournalTitle(kind: JournalEntryKind): string {
  switch (kind) {
    case 'prayer':
      return 'Prayer';
    case 'gratitude':
      return 'Gratitude';
    case 'reflection':
      return 'Reflection';
  }
}

export function journalKindLabel(kind: JournalEntryKind): string {
  switch (kind) {
    case 'prayer':
      return 'PRAYER';
    case 'gratitude':
      return 'GRATITUDE';
    case 'reflection':
      return 'REFLECTION';
  }
}
