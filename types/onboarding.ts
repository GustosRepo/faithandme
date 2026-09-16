export const onboardingGoalOptions = [
  'Grow closer to God',
  'Understand the Bible',
  'Build a daily habit',
  'Find guidance',
  'Pray more',
  'Find peace',
  'Get through something difficult',
] as const;

export const onboardingSituationOptions = [
  'Anxiety',
  'Relationships',
  'Marriage',
  'Purpose',
  'Temptation',
  'Anger',
  'Grief',
  'Loneliness',
  'Stress',
  'Discipline',
  'Finances',
  'Parenting',
  'Faith',
  'Nothing specific right now',
] as const;

export const onboardingFeelingOptions = [
  'Peaceful',
  'Grateful',
  'Hopeful',
  'Anxious',
  'Low',
  'Frustrated',
  'Lonely',
  'Lost',
  'Prefer not to say',
] as const;

export const onboardingMomentOptions = ['Morning', 'Afternoon', 'Evening', "I'll decide later"] as const;

export type OnboardingState = {
  onboardingCompleted: boolean;
  goals: string[];
  situations: string[];
  currentFeeling: string | null;
  reminderPreference: string;
};

export const defaultOnboardingState: OnboardingState = {
  onboardingCompleted: false,
  goals: [],
  situations: [],
  currentFeeling: null,
  reminderPreference: 'Morning',
};
