import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearOnboardingState, loadOnboardingState, saveOnboardingState } from '@/storage/onboarding';
import { defaultOnboardingState, type OnboardingState } from '@/types/onboarding';

type OnboardingContextValue = {
  state: OnboardingState;
  hydrated: boolean;
  updateState: (nextState: OnboardingState) => void;
  setGoals: (goals: string[]) => void;
  toggleGoal: (goal: string) => void;
  setSituations: (situations: string[]) => void;
  toggleSituation: (situation: string) => void;
  setCurrentFeeling: (feeling: string | null) => void;
  setReminderPreference: (value: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  onboardingCompleted: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultOnboardingState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadOnboardingState().then((storedState) => {
      if (!isMounted) {
        return;
      }

      setState(storedState);
      setHydrated(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistState = useCallback((nextState: OnboardingState) => {
    setState((current) => {
      const mergedState = { ...current, ...nextState };
      void saveOnboardingState(mergedState);
      return mergedState;
    });
  }, []);

  const updateState = useCallback((nextState: OnboardingState) => {
    persistState(nextState);
  }, [persistState]);

  const setGoals = useCallback((goals: string[]) => {
    setState((current) => {
      const nextState = { ...current, goals };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const toggleGoal = useCallback((goal: string) => {
    setState((current) => {
      const nextGoals = current.goals.includes(goal)
        ? current.goals.filter((item) => item !== goal)
        : [...current.goals, goal];

      const nextState = { ...current, goals: nextGoals };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const setSituations = useCallback((situations: string[]) => {
    setState((current) => {
      const nextState = { ...current, situations };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const toggleSituation = useCallback((situation: string) => {
    setState((current) => {
      let nextSituations: string[];

      if (situation === 'Nothing specific right now') {
        nextSituations = current.situations.includes(situation)
          ? current.situations.filter((item) => item !== situation)
          : [situation];
      } else {
        nextSituations = current.situations.includes(situation)
          ? current.situations.filter((item) => item !== situation)
          : [...current.situations.filter((item) => item !== 'Nothing specific right now'), situation];
      }

      const nextState = { ...current, situations: nextSituations };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const setCurrentFeeling = useCallback((currentFeeling: string | null) => {
    setState((current) => {
      const nextState = { ...current, currentFeeling };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const setReminderPreference = useCallback((reminderPreference: string) => {
    setState((current) => {
      const nextState = { ...current, reminderPreference };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((current) => {
      const nextState = { ...current, onboardingCompleted: true };
      void saveOnboardingState(nextState);
      return nextState;
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(defaultOnboardingState);
    void clearOnboardingState();
  }, []);

  const value = useMemo<OnboardingContextValue>(() => ({
    state,
    hydrated,
    updateState,
    setGoals,
    toggleGoal,
    setSituations,
    toggleSituation,
    setCurrentFeeling,
    setReminderPreference,
    completeOnboarding,
    resetOnboarding,
    onboardingCompleted: state.onboardingCompleted,
  }), [completeOnboarding, hydrated, resetOnboarding, setCurrentFeeling, setGoals, setReminderPreference, setSituations, state, toggleGoal, toggleSituation, updateState]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }

  return context;
}
