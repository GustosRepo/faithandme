import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';
import { getAskScriptureUsage } from '@/services/ask/AskScriptureService';
import type { AskScriptureUsage } from '@/services/ask/types';
import { defaultBibleActivityState, loadBibleActivityState, type BibleActivityState } from '@/storage/bibleActivity';
import { loadJournalEntries, type JournalEntry } from '@/storage/journal';
import { DAILY_SESSION_STAGE_ORDER } from '@/types/dailySession';

function countCompletedChapters(activity: BibleActivityState) {
  return Object.values(activity.completedChapters).reduce((total, chapters) => total + chapters.length, 0);
}

function formatLastReference(activity: BibleActivityState) {
  if (!activity.lastPosition) return 'Start reading';
  const verse = activity.lastPosition.verse ? `:${activity.lastPosition.verse}` : '';
  return `${activity.lastPosition.bookId} ${activity.lastPosition.chapter}${verse}`;
}

function formatUsage(usage: AskScriptureUsage | null) {
  if (!usage) return 'Offline';
  return `${usage.remaining}/${usage.limit} left`;
}

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.statTile, { borderColor: theme.colors.rule }]}>
      <Text variant="headingSerif">{value}</Text>
      <Text variant="caption" style={{ color: theme.colors.textMuted }}>{label}</Text>
      {detail ? <Text variant="caption" style={{ color: theme.colors.textSecondary }}>{detail}</Text> : null}
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        {
          borderColor: theme.colors.rule,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.colors.accentSoft }]}>
        <Ionicons name={icon} size={18} color={theme.colors.accent} />
      </View>
      <View style={styles.actionText}>
        <Text variant="body">{title}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export default function MeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { state, resetOnboarding } = useOnboarding();
  const { progress, streak, resetToday, resetStreak } = useDailySession();
  const [bibleActivity, setBibleActivity] = useState<BibleActivityState>(defaultBibleActivityState);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [askUsage, setAskUsage] = useState<AskScriptureUsage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void Promise.all([
        loadBibleActivityState(),
        loadJournalEntries(),
        getAskScriptureUsage().catch(() => null),
      ]).then(([nextBibleActivity, nextJournalEntries, nextAskUsage]) => {
        if (!active) return;
        setBibleActivity(nextBibleActivity);
        setJournalEntries(nextJournalEntries);
        setAskUsage(nextAskUsage);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const handleReset = () => {
    resetOnboarding();
    router.replace('/(onboarding)/welcome');
  };

  const handleResetToday = async () => {
    await resetToday();
  };

  const handleResetStreak = async () => {
    await resetStreak();
  };

  const journalCounts = useMemo(() => {
    return journalEntries.reduce(
      (acc, entry) => {
        acc.total += 1;
        acc[entry.kind] += 1;
        if (entry.source === 'ask') acc.ask += 1;
        return acc;
      },
      { total: 0, prayer: 0, reflection: 0, gratitude: 0, ask: 0 },
    );
  }, [journalEntries]);

  const completedChapters = countCompletedChapters(bibleActivity);
  const savedVerseCount = Object.keys(bibleActivity.bookmarks).length;
  const highlightedVerseCount = Object.keys(bibleActivity.highlights).length;
  const todayProgress = progress
    ? Math.round((progress.completedStages.length / DAILY_SESSION_STAGE_ORDER.length) * 100)
    : 0;
  const primaryFocus = state.goals[0] ?? 'Peace';
  const secondaryFocus = state.goals.slice(1, 3).join(', ');

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>Me</EditorialLabel>
      <Text variant="displaySerif">Your walk.</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        A quick view of what you&apos;ve been reading, saving, and bringing into prayer.
      </Text>

      <View style={[styles.heroBlock, { borderColor: theme.colors.rule }]}>
        <Text variant="headingSerif">Your Journey</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {primaryFocus}{secondaryFocus ? `, with ${secondaryFocus}` : ''} · {state.currentFeeling ?? 'Open'}
        </Text>
        <View style={styles.statsGrid}>
          <StatTile label="streak" value={String(streak.currentStreak)} detail={`best ${streak.longestStreak}`} />
          <StatTile label="today" value={`${todayProgress}%`} detail={progress?.completedAt ? 'complete' : 'in progress'} />
          <StatTile label="Ask" value={formatUsage(askUsage)} detail="daily limit" />
        </View>
      </View>

      <EditorialLabel>Shortcuts</EditorialLabel>
      <View style={styles.actionsList}>
        <ActionRow
          icon="sunny-outline"
          title="Today's moment"
          subtitle={progress?.completedAt ? 'Completed for today' : `${progress?.completedStages.length ?? 0} of ${DAILY_SESSION_STAGE_ORDER.length} steps complete`}
          onPress={() => router.push('/(tabs)')}
        />
        <ActionRow
          icon="book-outline"
          title="Continue reading"
          subtitle={formatLastReference(bibleActivity)}
          onPress={() => {
            if (bibleActivity.lastPosition) {
              router.push(`/bible/${bibleActivity.lastPosition.bookId}/${bibleActivity.lastPosition.chapter}`);
            } else {
              router.push('/(tabs)/bible');
            }
          }}
        />
        <ActionRow
          icon="journal-outline"
          title="Open Journal"
          subtitle={`${journalCounts.total} entr${journalCounts.total === 1 ? 'y' : 'ies'} saved`}
          onPress={() => router.push('/(tabs)/journal')}
        />
        <ActionRow
          icon="sparkles-outline"
          title="Ask Scripture"
          subtitle={askUsage ? formatUsage(askUsage) : 'Usage updates when connected'}
          onPress={() => router.push('/(tabs)/ask')}
        />
        <ActionRow
          icon="calendar-outline"
          title="Weekly review"
          subtitle="Review what you prayed, saved, and noticed"
          onPress={() => router.push('/review/weekly')}
        />
        <ActionRow
          icon="star-outline"
          title="Upgrade to Plus"
          subtitle="More Ask Scripture and deeper reflection tools"
          onPress={() => router.push('/upgrade')}
        />
      </View>

      <EditorialLabel>Library</EditorialLabel>
      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statsGrid}>
          <StatTile label="chapters read" value={String(completedChapters)} />
          <StatTile label="saved verses" value={String(savedVerseCount)} />
          <StatTile label="highlights" value={String(highlightedVerseCount)} />
        </View>
        <Button title="Open saved Scripture" variant="secondary" onPress={() => router.push('/bible/saved')} />
      </View>

      <EditorialLabel>Journal</EditorialLabel>
      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statsGrid}>
          <StatTile label="prayers" value={String(journalCounts.prayer)} />
          <StatTile label="reflections" value={String(journalCounts.reflection)} />
          <StatTile label="gratitude" value={String(journalCounts.gratitude)} />
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          {journalCounts.ask} saved from Ask Scripture
        </Text>
      </View>

      <EditorialLabel>Preferences</EditorialLabel>
      <View style={[styles.preferenceBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.infoRow}>
          <Text variant="body">Bible translation</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Berean Standard Bible (BSB)</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">Daily reminder</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{state.reminderPreference}</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">Appearance</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>System</Text>
        </View>
      </View>

      <View style={[styles.upgradeBlock, { borderColor: theme.colors.wine, backgroundColor: theme.colors.surface }]}>
        <EditorialLabel style={{ color: theme.colors.wine }}>Faith & Me Plus</EditorialLabel>
        <Text variant="headingSerif">More room to ask, reflect, and grow.</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          Plus will unlock a higher Ask Scripture limit and richer reflection tools once subscriptions are wired.
        </Text>
        <Button title="View upgrade" variant="secondary" onPress={() => router.push('/upgrade')} />
      </View>

      {__DEV__ ? (
        <View style={[styles.devBlock, { borderColor: theme.colors.rule }]}>
          <Text variant="headingSerif">Developer</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            Clear onboarding state and reset the local daily moment state.
          </Text>
          <Button title="Reset onboarding" variant="secondary" onPress={handleReset} />
          <Button title="Reset today's moment" variant="secondary" onPress={handleResetToday} />
          <Button title="Reset streak" variant="secondary" onPress={handleResetStreak} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 92,
  },
  heroBlock: {
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    minHeight: 86,
    justifyContent: 'center',
    gap: 3,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  actionsList: {
    gap: 0,
  },
  actionRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 3,
  },
  summaryBlock: {
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preferenceBlock: {
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  devBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  upgradeBlock: {
    gap: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
});
