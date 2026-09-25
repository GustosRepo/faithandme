import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { defaultBibleActivityState, loadBibleActivityState, type BibleActivityState } from '@/storage/bibleActivity';
import { loadJournalEntries, type JournalEntry } from '@/storage/journal';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isRecent(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= WEEK_MS;
}

function countCompletedChapters(activity: BibleActivityState) {
  return Object.values(activity.completedChapters).reduce((total, chapters) => total + chapters.length, 0);
}

function pickTheme(journalEntries: JournalEntry[]) {
  const text = journalEntries.map((entry) => entry.content).join(' ').toLowerCase();
  const themes: { key: TranslationKey; words: string[] }[] = [
    { key: 'weekly.theme.peace', words: ['peace', 'paz', 'anxious', 'anxiety', 'ansiedad', 'worry', 'preocupado', 'calm', 'calma'] },
    { key: 'weekly.theme.trust', words: ['trust', 'confianza', 'faith', 'fe', 'wait', 'esperar', 'control'] },
    { key: 'weekly.theme.forgiveness', words: ['forgive', 'forgiveness', 'perdon', 'perdón', 'anger', 'enojo', 'hurt', 'dolor'] },
    { key: 'weekly.theme.gratitude', words: ['thank', 'grateful', 'gratitude', 'gracias', 'agradecido', 'gratitud', 'mercy', 'misericordia'] },
    { key: 'weekly.theme.purpose', words: ['purpose', 'propósito', 'proposito', 'direction', 'dirección', 'direccion', 'calling', 'llamado', 'next'] },
  ];

  let best = { key: 'weekly.theme.faithfulness' as TranslationKey, score: 0 };
  for (const theme of themes) {
    const score = theme.words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { key: theme.key, score };
  }

  return best.key;
}

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useLanguage();
  const [activity, setActivity] = useState<BibleActivityState>(defaultBibleActivityState);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void Promise.all([loadBibleActivityState(), loadJournalEntries()]).then(([nextActivity, nextEntries]) => {
        if (!active) return;
        setActivity(nextActivity);
        setJournalEntries(nextEntries);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const review = useMemo(() => {
    const recentJournal = journalEntries.filter((entry) => isRecent(entry.createdAt));
    const recentBookmarks = Object.values(activity.bookmarks).filter((verse) => isRecent(verse.createdAt));
    const recentHighlights = Object.values(activity.highlights).filter((verse) => isRecent(verse.createdAt));
    const askSaved = recentJournal.filter((entry) => entry.source === 'ask');
    const prayerCount = recentJournal.filter((entry) => entry.kind === 'prayer').length;
    const reflectionCount = recentJournal.filter((entry) => entry.kind === 'reflection').length;
    const gratitudeCount = recentJournal.filter((entry) => entry.kind === 'gratitude').length;
    const themeLabel = pickTheme(recentJournal);
    const featuredVerse = recentHighlights[0] ?? recentBookmarks[0] ?? null;

    return {
      recentJournal,
      recentBookmarks,
      recentHighlights,
      askSaved,
      prayerCount,
      reflectionCount,
      gratitudeCount,
      themeLabel,
      featuredVerse,
      completedChapters: countCompletedChapters(activity),
    };
  }, [activity, journalEntries]);

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('weekly.close')}
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.75 : 1 }]}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </Pressable>

      <View style={styles.hero}>
        <EditorialLabel>{t('weekly.label')}</EditorialLabel>
        <Text variant="displaySerif">{t('weekly.title')}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {t('weekly.subtitle')}
        </Text>
      </View>

      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statsGrid}>
          <ReviewStat label={t('weekly.stat.journal')} value={String(review.recentJournal.length)} />
          <ReviewStat label={t('weekly.stat.askSaved')} value={String(review.askSaved.length)} />
          <ReviewStat label={t('weekly.stat.scripture')} value={String(review.recentBookmarks.length + review.recentHighlights.length)} />
        </View>
        <Divider />
        <Text variant="headingSerif">{t('weekly.theme', { theme: t(review.themeLabel) })}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {t('weekly.themeBody')}
        </Text>
      </View>

      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>{t('weekly.journalRhythm')}</EditorialLabel>
        <View style={styles.statsGrid}>
          <ReviewStat label={t('me.prayers')} value={String(review.prayerCount)} />
          <ReviewStat label={t('me.reflections')} value={String(review.reflectionCount)} />
          <ReviewStat label={t('me.gratitude')} value={String(review.gratitudeCount)} />
        </View>
      </View>

      {review.featuredVerse ? (
        <View style={[styles.scriptureBlock, { borderColor: theme.colors.rule }]}>
          <EditorialLabel>{t('weekly.scriptureRevisit')}</EditorialLabel>
          <Text variant="headingSerif">{review.featuredVerse.reference}</Text>
          <Text variant="scripture" style={styles.scriptureText}>"{review.featuredVerse.text}"</Text>
        </View>
      ) : (
        <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
          <EditorialLabel>{t('weekly.scriptureRevisit')}</EditorialLabel>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            {t('weekly.scriptureEmpty')}
          </Text>
        </View>
      )}

      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>{t('weekly.readingProgress')}</EditorialLabel>
        <Text variant="headingSerif">{t('weekly.chaptersMarked', { count: review.completedChapters })}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          {t('weekly.chaptersNote')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title={t('weekly.openJournal')} variant="secondary" onPress={() => router.push('/(tabs)/journal')} />
        <Button title={t('weekly.savedScripture')} variant="secondary" onPress={() => router.push('/bible/saved')} />
      </View>
    </Screen>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.statTile, { borderColor: theme.colors.rule }]}>
      <Text variant="headingSerif">{value}</Text>
      <Text variant="caption" style={{ color: theme.colors.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingBottom: 92,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    gap: 10,
  },
  summaryBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scriptureBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scriptureText: {
    fontSize: 24,
    lineHeight: 35,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    minHeight: 80,
    justifyContent: 'center',
    gap: 3,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  actions: {
    gap: 10,
  },
});
