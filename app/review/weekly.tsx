import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
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
  const themes = [
    { label: 'peace', words: ['peace', 'anxious', 'anxiety', 'worry', 'calm'] },
    { label: 'trust', words: ['trust', 'faith', 'wait', 'control'] },
    { label: 'forgiveness', words: ['forgive', 'forgiveness', 'anger', 'hurt'] },
    { label: 'gratitude', words: ['thank', 'grateful', 'gratitude', 'mercy'] },
    { label: 'purpose', words: ['purpose', 'direction', 'calling', 'next'] },
  ];

  let best = { label: 'faithfulness', score: 0 };
  for (const theme of themes) {
    const score = theme.words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { label: theme.label, score };
  }

  return best.label;
}

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const theme = useAppTheme();
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
        accessibilityLabel="Close weekly review"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.75 : 1 }]}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </Pressable>

      <View style={styles.hero}>
        <EditorialLabel>Weekly Review</EditorialLabel>
        <Text variant="displaySerif">What you carried this week.</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          A local summary of what you prayed, saved, highlighted, and brought into reflection.
        </Text>
      </View>

      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statsGrid}>
          <ReviewStat label="journal" value={String(review.recentJournal.length)} />
          <ReviewStat label="Ask saved" value={String(review.askSaved.length)} />
          <ReviewStat label="Scripture" value={String(review.recentBookmarks.length + review.recentHighlights.length)} />
        </View>
        <Divider />
        <Text variant="headingSerif">Theme to notice: {review.themeLabel}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          Look for how this theme showed up in your prayers, Scripture, and next steps.
        </Text>
      </View>

      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>Journal rhythm</EditorialLabel>
        <View style={styles.statsGrid}>
          <ReviewStat label="prayers" value={String(review.prayerCount)} />
          <ReviewStat label="reflections" value={String(review.reflectionCount)} />
          <ReviewStat label="gratitude" value={String(review.gratitudeCount)} />
        </View>
      </View>

      {review.featuredVerse ? (
        <View style={[styles.scriptureBlock, { borderColor: theme.colors.rule }]}>
          <EditorialLabel>Scripture to revisit</EditorialLabel>
          <Text variant="headingSerif">{review.featuredVerse.reference}</Text>
          <Text variant="scripture" style={styles.scriptureText}>"{review.featuredVerse.text}"</Text>
        </View>
      ) : (
        <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
          <EditorialLabel>Scripture to revisit</EditorialLabel>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            Save or highlight Scripture this week and it will appear here.
          </Text>
        </View>
      )}

      <View style={[styles.summaryBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>Reading progress</EditorialLabel>
        <Text variant="headingSerif">{review.completedChapters} chapters marked read</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          Chapter completion is currently tracked as an all-time local count.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Open Journal" variant="secondary" onPress={() => router.push('/(tabs)/journal')} />
        <Button title="Saved Scripture" variant="secondary" onPress={() => router.push('/bible/saved')} />
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
