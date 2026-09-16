import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ProgressBar, Screen, ScriptureCard, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';
import { scriptureService } from '@/services/scripture/ScriptureService';

const defaultTopics = ['Peace', 'Strength', 'Guidance', 'Love', 'Hope', 'Forgiveness', 'Courage'];
const sessionSteps = ['Scripture', 'Reflect', 'Think', 'Pray', 'Act'];

function getRecommendedTopics(feeling: string | null, situations: string[]): string[] {
  const basePriority: Record<string, string[]> = {
    Anxiety: ['Peace', 'Strength', 'Hope', 'Guidance'],
    Low: ['Hope', 'Strength', 'Peace', 'Love'],
    Frustrated: ['Peace', 'Forgiveness', 'Guidance', 'Patience'],
    Lonely: ['Love', 'Hope', 'Faith', 'Peace'],
    Lost: ['Guidance', 'Hope', 'Faith', 'Strength'],
    Peaceful: ['Peace', 'Hope', 'Strength', 'Faith'],
    Grateful: ['Hope', 'Peace', 'Love', 'Faith'],
    Hopeful: ['Hope', 'Peace', 'Guidance', 'Strength'],
    Anxious: ['Peace', 'Strength', 'Hope', 'Guidance'],
    'Prefer not to say': ['Peace', 'Strength', 'Guidance', 'Hope'],
  };

  const flags = new Set(situations);

  if (flags.has('Grief')) {
    basePriority.Grief = ['Peace', 'Hope', 'Faith'];
  }
  if (flags.has('Purpose')) {
    basePriority.Purpose = ['Guidance', 'Faith', 'Strength'];
  }

  const feelingBased = feeling ? (basePriority[feeling] ?? defaultTopics.slice(0, 4)) : defaultTopics.slice(0, 4);
  const situationBased = flags.has('Grief') ? ['Peace', 'Hope', 'Faith'] :
    flags.has('Purpose') ? ['Guidance', 'Faith', 'Strength'] : [];

  const prioritized = [...(situationBased.length ? situationBased : feelingBased), ...defaultTopics];
  return Array.from(new Set(prioritized)).slice(0, 4);
}

export default function TodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { state } = useOnboarding();
  const { selectedSession, progress, streak } = useDailySession();
  const scripture = scriptureService.getPassage(selectedSession.scriptureReference);
  const topics = getRecommendedTopics(state.currentFeeling, state.situations);
  const contextText = state.currentFeeling && state.currentFeeling !== 'Prefer not to say'
    ? `Feeling ${state.currentFeeling.toLowerCase()}`
    : null;

  const completedCount = progress?.completedStages.length ?? 0;
  const progressValue = Math.min((completedCount / 5) || 0, 1);
  const isComplete = Boolean(progress?.completedAt);
  const ctaTitle = isComplete ? 'Completed today ✓' : completedCount > 0 ? 'Continue session' : 'Start today\'s moment';

  const handleSessionPress = () => {
    router.push({ pathname: '/moment/[sessionId]', params: { sessionId: selectedSession.id } });
  };

  return (
    <Screen contentContainerStyle={[styles.container, { paddingTop: 28 }]}>
      {contextText ? (
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          {contextText}
        </Text>
      ) : null}
      <Text variant="display" style={styles.heading}>
        What do you need today?
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {topics.map((topic, index) => (
          <Chip key={topic} label={topic} selected={index === 0} />
        ))}
      </ScrollView>

      <ScriptureCard title={selectedSession.theme} reference={scripture?.displayReference ?? selectedSession.scriptureReference} text={scripture?.text ?? 'Scripture is unavailable.'} translation="BSB" />

      <View style={styles.sectionHeaderRow}>
        <Text variant="subheading">Your 5 Minutes With God</Text>
        <Text variant="caption" style={{ color: theme.colors.textMuted }}>
          {completedCount} of 5
        </Text>
      </View>

      <Card style={styles.sessionCard}>
        <ProgressBar progress={progressValue} />

        <View style={styles.stepGrid}>
          {sessionSteps.map((step, index) => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: index < completedCount ? theme.colors.accent : theme.colors.surfaceSecondary,
                    borderColor: index < completedCount ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              />
              <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.streakRow}>
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          Daily streak
        </Text>
        <Text variant="subheading">{streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'} streak</Text>
      </View>

      <Button title={ctaTitle} variant={isComplete ? 'secondary' : 'primary'} onPress={handleSessionPress} disabled={false} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  heading: {
    marginTop: 8,
    maxWidth: 280,
  },
  chipRow: {
    paddingVertical: 10,
    paddingRight: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sessionCard: {
    marginTop: 4,
    paddingVertical: 16,
    gap: 18,
  },
  stepGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
