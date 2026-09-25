import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';
import { getAskScriptureUsage } from '@/services/ask/AskScriptureService';
import type { AskScriptureUsage } from '@/services/ask/types';
import { getScriptureService } from '@/services/scripture/ScriptureService';
import type { ScriptureProvider } from '@/services/scripture/types';
import { defaultBibleActivityState, loadBibleActivityState, type BibleActivityState } from '@/storage/bibleActivity';
import { loadJournalEntries, type JournalEntry } from '@/storage/journal';
import { DAILY_SESSION_STAGE_ORDER } from '@/types/dailySession';

function countCompletedChapters(activity: BibleActivityState) {
  return Object.values(activity.completedChapters).reduce((total, chapters) => total + chapters.length, 0);
}

function formatLastReference(activity: BibleActivityState, emptyLabel: string, scriptureService: ScriptureProvider) {
  if (!activity.lastPosition) return emptyLabel;
  const verse = activity.lastPosition.verse ? `:${activity.lastPosition.verse}` : '';
  const book = scriptureService.getBook(activity.lastPosition.bookId);
  return `${book?.name ?? activity.lastPosition.bookId} ${activity.lastPosition.chapter}${verse}`;
}

function formatUsage(
  usage: AskScriptureUsage | null,
  offlineLabel: string,
  formatRemaining: (remaining: number, limit: number) => string,
) {
  if (!usage) return offlineLabel;
  return formatRemaining(usage.remaining, usage.limit);
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
  const { language, setLanguage, t } = useLanguage();
  const scriptureService = getScriptureService(language);
  const scriptureMetadata = scriptureService.getBibleMetadata();
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
  const askUsageLabel = formatUsage(
    askUsage,
    t('common.offline'),
    (remaining, limit) => t('me.usage.left', { remaining, limit }),
  );
  const lastReferenceLabel = formatLastReference(bibleActivity, t('me.startReading'), scriptureService);

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('me.label')}</EditorialLabel>
      <Text variant="displaySerif">{t('me.title')}</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        {t('me.subtitle')}
      </Text>

      <View style={[styles.heroBlock, { borderColor: theme.colors.rule }]}>
        <Text variant="headingSerif">{t('me.journey')}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {primaryFocus}{secondaryFocus ? `, ${t('me.journey.with')} ${secondaryFocus}` : ''} · {state.currentFeeling ?? t('me.open')}
        </Text>
        <View style={styles.statsGrid}>
          <StatTile label={t('me.stat.streak')} value={String(streak.currentStreak)} detail={t('me.stat.best', { count: streak.longestStreak })} />
          <StatTile label={t('me.stat.today')} value={`${todayProgress}%`} detail={progress?.completedAt ? t('me.stat.complete') : t('me.stat.inProgress')} />
          <StatTile label={t('me.stat.ask')} value={askUsageLabel} detail={t('me.stat.dailyLimit')} />
        </View>
      </View>

      <EditorialLabel>{t('me.shortcuts')}</EditorialLabel>
      <View style={styles.actionsList}>
        <ActionRow
          icon="sunny-outline"
          title={t('me.todayMoment')}
          subtitle={progress?.completedAt ? t('me.todayCompleted') : t('me.todaySteps', { completed: progress?.completedStages.length ?? 0, total: DAILY_SESSION_STAGE_ORDER.length })}
          onPress={() => router.push('/(tabs)')}
        />
        <ActionRow
          icon="book-outline"
          title={t('me.continueReading')}
          subtitle={lastReferenceLabel}
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
          title={t('me.openJournal')}
          subtitle={t(journalCounts.total === 1 ? 'me.entriesSaved.one' : 'me.entriesSaved.other', { count: journalCounts.total })}
          onPress={() => router.push('/(tabs)/journal')}
        />
        <ActionRow
          icon="sparkles-outline"
          title={t('me.askScripture')}
          subtitle={askUsage ? askUsageLabel : t('me.usageWhenConnected')}
          onPress={() => router.push('/(tabs)/ask')}
        />
        <ActionRow
          icon="calendar-outline"
          title={t('me.weeklyReview')}
          subtitle={t('me.weeklyReviewSubtitle')}
          onPress={() => router.push('/review/weekly')}
        />
        <ActionRow
          icon="star-outline"
          title={t('me.upgradeTitle')}
          subtitle={t('me.upgradeSubtitle')}
          onPress={() => router.push('/upgrade')}
        />
      </View>

      <EditorialLabel>{t('me.library')}</EditorialLabel>
      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statsGrid}>
          <StatTile label={t('me.chaptersRead')} value={String(completedChapters)} />
          <StatTile label={t('me.savedVerses')} value={String(savedVerseCount)} />
          <StatTile label={t('me.highlights')} value={String(highlightedVerseCount)} />
        </View>
        <Button title={t('me.openSavedScripture')} variant="secondary" onPress={() => router.push('/bible/saved')} />
      </View>

      <EditorialLabel>{t('me.journalSection')}</EditorialLabel>
      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statsGrid}>
          <StatTile label={t('me.prayers')} value={String(journalCounts.prayer)} />
          <StatTile label={t('me.reflections')} value={String(journalCounts.reflection)} />
          <StatTile label={t('me.gratitude')} value={String(journalCounts.gratitude)} />
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          {t('me.savedFromAsk', { count: journalCounts.ask })}
        </Text>
      </View>

      <EditorialLabel>{t('me.preferences')}</EditorialLabel>
      <View style={[styles.preferenceBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.infoRow}>
          <View style={styles.preferenceText}>
            <Text variant="body">{t('me.language')}</Text>
          </View>
          <View style={styles.languageChips}>
            <Chip label={t('language.english')} selected={language === 'en'} onPress={() => { void setLanguage('en'); }} />
            <Chip label={t('language.spanish')} selected={language === 'es'} onPress={() => { void setLanguage('es'); }} />
          </View>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">{t('me.bibleTranslation')}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{scriptureMetadata.name} ({scriptureMetadata.abbreviation})</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">{t('me.dailyReminder')}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{state.reminderPreference}</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">{t('me.appearance')}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('me.appearanceSystem')}</Text>
        </View>
      </View>

      <View style={[styles.upgradeBlock, { borderColor: theme.colors.wine, backgroundColor: theme.colors.surface }]}>
        <EditorialLabel style={{ color: theme.colors.wine }}>{t('me.plusTitle')}</EditorialLabel>
        <Text variant="headingSerif">{t('me.plusHeading')}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {t('me.plusBody')}
        </Text>
        <Button title={t('me.viewUpgrade')} variant="secondary" onPress={() => router.push('/upgrade')} />
      </View>

      {__DEV__ ? (
        <View style={[styles.devBlock, { borderColor: theme.colors.rule }]}>
          <Text variant="headingSerif">{t('me.developer')}</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            {t('me.developerBody')}
          </Text>
          <Button title={t('me.resetOnboarding')} variant="secondary" onPress={handleReset} />
          <Button title={t('me.resetToday')} variant="secondary" onPress={handleResetToday} />
          <Button title={t('me.resetStreak')} variant="secondary" onPress={handleResetStreak} />
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
  preferenceText: {
    flex: 1,
    gap: 3,
  },
  languageChips: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: 8,
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
