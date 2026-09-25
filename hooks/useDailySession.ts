import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLanguage } from '@/context/LanguageContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { localizeDailySession } from '@/data/dailySessions';
import { clearDailySessionState, clearDailyStreakState, createInitialDailySessionProgress, defaultDailyStreakState, loadDailySessionState, loadDailyStreakState, saveDailySessionState, saveDailyStreakState } from '@/storage/dailySession';
import { DAILY_SESSION_STAGE_ORDER, type DailySessionProgress, type DailySessionStage, type DailyStreakState } from '@/types/dailySession';
import { selectDailySessionForUser, updateDailyStreak } from '@/utils/dailySession';
import { getLocalDateKey } from '@/utils/localDate';

export function useDailySession() {
  const { language } = useLanguage();
  const { state: onboardingState } = useOnboarding();
  const dateKey = getLocalDateKey();

  const selectedBaseSession = useMemo(
    () => selectDailySessionForUser({
      feeling: onboardingState.currentFeeling,
      situations: onboardingState.situations,
      goals: onboardingState.goals,
    }, dateKey),
    [dateKey, onboardingState.currentFeeling, onboardingState.goals, onboardingState.situations],
  );

  const selectedSession = useMemo(
    () => localizeDailySession(selectedBaseSession, language),
    [language, selectedBaseSession],
  );

  const [progress, setProgress] = useState<DailySessionProgress | null>(null);
  const [streak, setStreak] = useState<DailyStreakState>(defaultDailyStreakState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const savedProgress = await loadDailySessionState();
      const savedStreak = await loadDailyStreakState();

      if (!isMounted) {
        return;
      }

      const nextProgress = savedProgress && savedProgress.dateKey === dateKey
        ? { ...savedProgress, sessionId: selectedSession.id, dateKey }
        : createInitialDailySessionProgress(selectedSession.id, dateKey);

      setProgress(nextProgress);
      setStreak(savedStreak);
      setHydrated(true);

      if (!savedProgress || savedProgress.dateKey !== dateKey || savedProgress.sessionId !== selectedSession.id) {
        await saveDailySessionState(nextProgress);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [dateKey, selectedSession.id]);

  useEffect(() => {
    if (!hydrated || !progress) {
      return;
    }

    void saveDailySessionState(progress);
  }, [hydrated, progress]);

  const advanceStage = useCallback(() => {
    setProgress((current) => {
      if (!current) {
        return current;
      }

      const stageIndex = DAILY_SESSION_STAGE_ORDER.indexOf(current.currentStage as DailySessionStage);
      const nextStage = DAILY_SESSION_STAGE_ORDER[stageIndex + 1] ?? 'act';
      const nextCompletedStages = current.completedStages.includes(current.currentStage as DailySessionStage)
        ? current.completedStages
        : [...current.completedStages, current.currentStage as DailySessionStage];

      return {
        ...current,
        currentStage: nextStage,
        completedStages: Array.from(new Set(nextCompletedStages)),
        lastUpdatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const completeSession = useCallback(() => {
    setProgress((current) => {
      if (!current || current.completedAt) {
        return current;
      }

      const completeState: DailySessionProgress = {
        ...current,
        completedStages: Array.from(new Set([...current.completedStages, 'scripture', 'reflect', 'think', 'pray', 'act'])),
        currentStage: 'act',
        completedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      setStreak((previous) => {
        const nextStreak = updateDailyStreak(dateKey, previous);
        void saveDailyStreakState(nextStreak);
        return nextStreak;
      });

      return completeState;
    });
  }, [dateKey]);

  const resetToday = useCallback(async () => {
    const nextProgress = createInitialDailySessionProgress(selectedSession.id, dateKey);
    setProgress(nextProgress);
    await saveDailySessionState(nextProgress);
  }, [dateKey, selectedSession.id]);

  const resetStreak = useCallback(async () => {
    const nextStreak = defaultDailyStreakState;
    setStreak(nextStreak);
    await saveDailyStreakState(nextStreak);
  }, []);

  const clearAll = useCallback(async () => {
    setProgress(null);
    setStreak(defaultDailyStreakState);
    await Promise.all([clearDailySessionState(), clearDailyStreakState()]);
  }, []);

  return {
    hydrated,
    dateKey,
    selectedSession,
    progress,
    streak,
    advanceStage,
    completeSession,
    resetToday,
    resetStreak,
    clearAll,
  };
}
