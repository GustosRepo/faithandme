import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    defaultOnboardingState,
    onboardingFeelingOptions,
    onboardingGoalOptions,
    onboardingMomentOptions,
    onboardingSituationOptions,
    type OnboardingState,
} from '@/types/onboarding';

const STORAGE_KEY = 'faithandme.onboarding.v1';

const validGoals = new Set<string>(onboardingGoalOptions);
const validSituations = new Set<string>(onboardingSituationOptions);
const validFeelings = new Set<string>(onboardingFeelingOptions);
const validMoments = new Set<string>(onboardingMomentOptions);

function normalizeList(value: unknown, validValues: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && validValues.has(item));
}

function normalizeState(value: Partial<OnboardingState> | null | undefined): OnboardingState {
  if (!value || typeof value !== 'object') {
    return defaultOnboardingState;
  }

  const goals = normalizeList(value.goals, validGoals);
  const situations = normalizeList(value.situations, validSituations);
  const currentFeeling = typeof value.currentFeeling === 'string' && validFeelings.has(value.currentFeeling) ? value.currentFeeling : null;
  const reminderPreference = typeof value.reminderPreference === 'string' && validMoments.has(value.reminderPreference)
    ? value.reminderPreference
    : defaultOnboardingState.reminderPreference;

  return {
    onboardingCompleted: Boolean(value.onboardingCompleted),
    goals,
    situations,
    currentFeeling,
    reminderPreference,
  };
}

export async function loadOnboardingState(): Promise<OnboardingState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultOnboardingState;
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultOnboardingState;
  }
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
