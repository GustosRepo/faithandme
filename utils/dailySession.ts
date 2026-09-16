import { dailySessions } from '@/data/dailySessions';
import { DAILY_SESSION_STAGE_ORDER, type DailySession, type DailySessionProgress, type DailySessionStage, type DailyStreakState } from '@/types/dailySession';
import { diffCalendarDays, getLocalDateKey, parseLocalDateKey } from '@/utils/localDate';

export function getSessionThemeCandidates(
  feeling: string | null,
  situations: string[],
  goals: string[],
): string[] {
  const themeLookup: Record<string, string[]> = {
    Anxiety: ['Peace', 'Strength', 'Hope'],
    Anxious: ['Peace', 'Strength', 'Hope'],
    Low: ['Hope', 'Love', 'Strength'],
    Frustrated: ['Peace', 'Forgiveness', 'Guidance'],
    Lonely: ['Love', 'Hope', 'Faith'],
    Lost: ['Guidance', 'Faith', 'Hope'],
    Peaceful: ['Peace', 'Hope', 'Strength'],
    Grateful: ['Hope', 'Peace', 'Love'],
    Hopeful: ['Hope', 'Peace', 'Guidance'],
    'Prefer not to say': ['Peace', 'Strength', 'Guidance'],
  };

  const options = new Set<string>();

  const situationMap: Record<string, string[]> = {
    Grief: ['Peace', 'Hope', 'Faith'],
    Purpose: ['Guidance', 'Courage', 'Faith'],
    Marriage: ['Love', 'Forgiveness', 'Guidance'],
    Relationships: ['Love', 'Forgiveness', 'Guidance'],
    Temptation: ['Strength', 'Faith', 'Guidance'],
    Discipline: ['Strength', 'Courage', 'Faith'],
    Anger: ['Peace', 'Forgiveness', 'Strength'],
    Loneliness: ['Love', 'Hope', 'Faith'],
    Stress: ['Peace', 'Strength', 'Hope'],
    Parenting: ['Guidance', 'Strength', 'Love'],
    Finances: ['Guidance', 'Strength', 'Peace'],
    Faith: ['Faith', 'Hope', 'Courage'],
  };

  const goalMap: Record<string, string[]> = {
    'Grow closer to God': ['Faith', 'Peace', 'Love'],
    'Understand the Bible': ['Guidance', 'Faith', 'Hope'],
    'Build a daily habit': ['Strength', 'Peace', 'Hope'],
    'Find guidance': ['Guidance', 'Hope', 'Faith'],
    'Pray more': ['Faith', 'Peace', 'Hope'],
    'Find peace': ['Peace', 'Hope', 'Strength'],
    'Get through something difficult': ['Strength', 'Hope', 'Courage'],
  };

  if (feeling && themeLookup[feeling]) {
    themeLookup[feeling].forEach((theme) => options.add(theme));
  }

  situations.forEach((situation) => {
    (situationMap[situation] ?? []).forEach((theme) => options.add(theme));
  });

  goals.forEach((goal) => {
    (goalMap[goal] ?? []).forEach((theme) => options.add(theme));
  });

  return Array.from(options).length ? Array.from(options) : ['Peace', 'Hope', 'Strength'];
}

export function selectDailySessionForUser(
  userProfile: { feeling: string | null; situations: string[]; goals: string[] },
  dateKey: string = getLocalDateKey(),
): DailySession {
  const candidates = dailySessions.filter((session) =>
    getSessionThemeCandidates(userProfile.feeling, userProfile.situations, userProfile.goals).includes(session.theme),
  );

  const pool = candidates.length > 0 ? candidates : dailySessions;
  const hash = hashString(`${dateKey}|${userProfile.feeling ?? ''}|${userProfile.situations.join(',')}|${userProfile.goals.join(',')}`);

  return pool[Math.abs(hash) % pool.length];
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getNextDailySessionStage(currentStage: DailySessionStage): DailySessionStage | null {
  const index = DAILY_SESSION_STAGE_ORDER.indexOf(currentStage);
  return DAILY_SESSION_STAGE_ORDER[index + 1] ?? null;
}

export function getProgressStageOrder(progress: DailySessionProgress | null): DailySessionStage[] {
  if (!progress) {
    return [];
  }

  return progress.completedStages;
}

export function isSessionComplete(progress: DailySessionProgress | null): boolean {
  if (!progress) {
    return false;
  }

  return progress.completedStages.length === DAILY_SESSION_STAGE_ORDER.length && Boolean(progress.completedAt);
}

export function getCurrentStage(progress: DailySessionProgress | null): DailySessionStage {
  if (!progress) {
    return 'scripture';
  }

  if (isSessionComplete(progress)) {
    return 'act';
  }

  return progress.currentStage;
}

export function updateDailyStreak(
  completionDateKey: string,
  currentState: DailyStreakState,
): DailyStreakState {
  if (currentState.lastCompletedDate === completionDateKey) {
    return currentState;
  }

  const previousDate = currentState.lastCompletedDate ? parseLocalDateKey(currentState.lastCompletedDate) : null;
  const completionDate = parseLocalDateKey(completionDateKey);

  if (!completionDate) {
    return currentState;
  }

  if (!previousDate) {
    const nextStreak = 1;
    return {
      currentStreak: nextStreak,
      lastCompletedDate: completionDateKey,
      longestStreak: Math.max(currentState.longestStreak, nextStreak),
    };
  }

  const dayDifference = diffCalendarDays(completionDate, previousDate);

  if (dayDifference === 1) {
    const nextStreak = currentState.currentStreak + 1;
    return {
      currentStreak: nextStreak,
      lastCompletedDate: completionDateKey,
      longestStreak: Math.max(currentState.longestStreak, nextStreak),
    };
  }

  const resetStreak = 1;
  return {
    currentStreak: resetStreak,
    lastCompletedDate: completionDateKey,
    longestStreak: Math.max(currentState.longestStreak, resetStreak),
  };
}
