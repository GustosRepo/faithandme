import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, ProgressBar, Screen, Text } from '@/components/ui';
import { getDailySessionById } from '@/data/dailySessions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';
import { scriptureService } from '@/services/scripture/ScriptureService';
import type { DailySessionStage } from '@/types/dailySession';

const stageMeta: Record<DailySessionStage, { label: string; heading: string }> = {
  scripture: { label: 'Scripture', heading: 'Scripture' },
  reflect: { label: 'Reflect', heading: 'Reflect' },
  think: { label: 'Think', heading: 'Think' },
  pray: { label: 'Pray', heading: 'Pray' },
  act: { label: 'Act', heading: 'Act' },
};

export default function DailySessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const theme = useAppTheme();
  const { progress, advanceStage, completeSession, selectedSession } = useDailySession();
  const session = getDailySessionById(params.sessionId ?? selectedSession.id);
  const scripture = scriptureService.getPassage(session.scriptureReference);
  const currentStage = progress?.currentStage ?? 'scripture';
  const [completed, setCompleted] = useState(false);

  const stageIndex = useMemo(
    () => ['scripture', 'reflect', 'think', 'pray', 'act'].indexOf(currentStage),
    [currentStage],
  );

  const content = useMemo(() => {
    switch (currentStage) {
      case 'scripture':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>Scripture</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.accent }}>{session.theme}</Text>
            <Text variant="scripture" style={styles.scriptureText}>{scripture?.text ?? 'Scripture is unavailable.'}</Text>
            <Text variant="scriptureReference" style={{ color: theme.colors.textSecondary }}>{scripture?.displayReference ?? session.scriptureReference} · BSB</Text>
          </View>
        );
      case 'reflect':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>Reflect</Text>
            <Text variant="body" style={styles.bodyText}>{session.reflection}</Text>
          </View>
        );
      case 'think':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>Think</Text>
            <View style={styles.questionsWrap}>
              {session.reflectionQuestions.map((question) => (
                <Card key={question} style={styles.questionCard}>
                  <Text variant="body" style={styles.bodyText}>{question}</Text>
                </Card>
              ))}
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>
              Take a moment. You don&apos;t have to write anything down.
            </Text>
          </View>
        );
      case 'pray':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>Pray</Text>
            <Text variant="body" style={styles.bodyText}>{session.prayer}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>
              Read slowly, or make these words your own.
            </Text>
          </View>
        );
      case 'act':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>Act</Text>
            <Text variant="heading" style={styles.actionHeading}>One small step.</Text>
            <Text variant="body" style={styles.bodyText}>{session.action}</Text>
          </View>
        );
      default:
        return null;
    }
  }, [currentStage, session, theme.colors.accent, theme.colors.textMuted, theme.colors.textSecondary]);

  const handleContinue = () => {
    if (currentStage === 'act') {
      completeSession();
      setCompleted(true);
      return;
    }

    advanceStage();
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  if (completed) {
    return (
      <Screen contentContainerStyle={styles.completeContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.completeBox}>
          <Text variant="display">Moment complete.</Text>
          <Text variant="body" style={styles.bodyText}>Five minutes. One moment to carry with you.</Text>
          <Card style={styles.completeCard}>
            <Text variant="bodySmall" style={{ color: theme.colors.success }}>✓ Today&apos;s Scripture</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>🔥 {progress?.completedStages.length === 5 ? '1 day streak' : 'Daily streak'}</Text>
          </Card>
          <Button title="Done" onPress={handleDone} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Close session" onPress={handleDone}>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Close</Text>
        </Pressable>
        <Text variant="caption" style={{ color: theme.colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {stageMeta[currentStage].label}
        </Text>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={((stageIndex + 1) / 5)} />
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          {stageIndex + 1} of 5
        </Text>
      </View>

      <View style={styles.titleWrap}>
        <Text variant="heading" style={styles.title}>{stageMeta[currentStage].heading}</Text>
      </View>

      {content}

      <View style={styles.footer}>
        <Button title={currentStage === 'act' ? 'Complete today\'s moment' : 'Continue'} onPress={handleContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    flexGrow: 1,
  },
  stageWrap: {
    gap: 18,
  },
  kicker: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scriptureText: {
    marginTop: 10,
  },
  bodyText: {
    lineHeight: 28,
  },
  questionsWrap: {
    gap: 10,
  },
  questionCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  titleWrap: {
    marginTop: 6,
  },
  title: {
    maxWidth: 220,
  },
  actionHeading: {
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressWrap: {
    gap: 8,
  },
  footer: {
    marginTop: 'auto',
  },
  completeContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  completeBox: {
    gap: 16,
  },
  completeCard: {
    padding: 16,
    gap: 8,
  },
});
