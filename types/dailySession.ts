export const DAILY_SESSION_STAGE_ORDER = ['scripture', 'reflect', 'think', 'pray', 'act'] as const;

export type DailySessionStage = (typeof DAILY_SESSION_STAGE_ORDER)[number];

export type DailySession = {
  id: string;
  theme: string;
  title: string;
  scriptureReference: string;
  reflection: string;
  reflectionQuestions: string[];
  prayer: string;
  action: string;
  tags: string[];
};

export type DailySessionProgress = {
  dateKey: string;
  sessionId: string;
  currentStage: DailySessionStage;
  completedStages: DailySessionStage[];
  completedAt: string | null;
  startedAt: string | null;
  lastUpdatedAt: string | null;
};

export type DailyStreakState = {
  currentStreak: number;
  lastCompletedDate: string | null;
  longestStreak: number;
};
