import AsyncStorage from '@react-native-async-storage/async-storage';

import { DAILY_SESSION_STAGE_ORDER, type DailySessionProgress, type DailySessionStage, type DailyStreakState } from '@/types/dailySession';
import { getLocalDateKey } from '@/utils/localDate';

const DAILY_SESSION_STORAGE_KEY = 'faithandme.daily-session.v1';
const DAILY_STREAK_STORAGE_KEY = 'faithandme.daily-streak.v1';

const validStages = new Set<string>(DAILY_SESSION_STAGE_ORDER);

export function createInitialDailySessionProgress(sessionId: string, dateKey = getLocalDateKey()): DailySessionProgress {
  const now = new Date().toISOString();

  return {
    dateKey,
    sessionId,
    currentStage: 'scripture',
    completedStages: [],
    completedAt: null,
    startedAt: now,
    lastUpdatedAt: now,
  };
}

function normalizeStageList(value: unknown): DailySessionStage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is DailySessionStage => typeof item === 'string' && validStages.has(item));
}

export function normalizeDailySessionProgress(value: Partial<DailySessionProgress> | null | undefined): DailySessionProgress | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const dateKey = typeof value.dateKey === 'string' ? value.dateKey : getLocalDateKey();
  const sessionId = typeof value.sessionId === 'string' ? value.sessionId : 'peace';
  const completedStages = normalizeStageList(value.completedStages);
  const currentStage = typeof value.currentStage === 'string' && validStages.has(value.currentStage)
    ? value.currentStage as DailySessionStage
    : completedStages.length >= DAILY_SESSION_STAGE_ORDER.length
      ? 'act'
      : 'scripture';

  return {
    dateKey,
    sessionId,
    currentStage,
    completedStages,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : null,
    lastUpdatedAt: typeof value.lastUpdatedAt === 'string' ? value.lastUpdatedAt : null,
  };
}

export async function loadDailySessionState(): Promise<DailySessionProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DailySessionProgress>;
    return normalizeDailySessionProgress(parsed);
  } catch {
    return null;
  }
}

export async function saveDailySessionState(state: DailySessionProgress): Promise<void> {
  await AsyncStorage.setItem(DAILY_SESSION_STORAGE_KEY, JSON.stringify(state));
}

export async function clearDailySessionState(): Promise<void> {
  await AsyncStorage.removeItem(DAILY_SESSION_STORAGE_KEY);
}

export const defaultDailyStreakState: DailyStreakState = {
  currentStreak: 0,
  lastCompletedDate: null,
  longestStreak: 0,
};

export async function loadDailyStreakState(): Promise<DailyStreakState> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    if (!raw) {
      return defaultDailyStreakState;
    }

    const parsed = JSON.parse(raw) as Partial<DailyStreakState>;

    return {
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      lastCompletedDate: typeof parsed.lastCompletedDate === 'string' ? parsed.lastCompletedDate : null,
      longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
    };
  } catch {
    return defaultDailyStreakState;
  }
}

export async function saveDailyStreakState(streak: DailyStreakState): Promise<void> {
  await AsyncStorage.setItem(DAILY_STREAK_STORAGE_KEY, JSON.stringify(streak));
}

export async function clearDailyStreakState(): Promise<void> {
  await AsyncStorage.removeItem(DAILY_STREAK_STORAGE_KEY);
}
