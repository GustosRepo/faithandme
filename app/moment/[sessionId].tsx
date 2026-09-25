import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button, EditorialLabel, ProgressBar, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { getDailySessionById, localizeDailySession } from '@/data/dailySessions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';
import { getScriptureService } from '@/services/scripture/ScriptureService';
import type { DailySessionStage } from '@/types/dailySession';

const stageMeta: Record<DailySessionStage, { labelKey: TranslationKey; headingKey: TranslationKey }> = {
  scripture: { labelKey: 'today.step.scripture', headingKey: 'today.step.scripture' },
  reflect: { labelKey: 'today.step.reflect', headingKey: 'today.step.reflect' },
  think: { labelKey: 'today.step.think', headingKey: 'today.step.think' },
  pray: { labelKey: 'today.step.pray', headingKey: 'today.step.pray' },
  act: { labelKey: 'today.step.act', headingKey: 'today.step.act' },
};

export default function DailySessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const theme = useAppTheme();
  const { language, t } = useLanguage();
  const { progress, advanceStage, completeSession, selectedSession } = useDailySession();
  const session = localizeDailySession(getDailySessionById(params.sessionId ?? selectedSession.id), language);
  const scriptureService = getScriptureService(language);
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
            <Text variant="caption" style={styles.kicker}>{t('today.step.scripture')}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.accent }}>{session.theme}</Text>
            <Text variant="scripture" style={styles.scriptureText}>{scripture?.text ?? t('moment.scriptureUnavailable')}</Text>
            <Text variant="scriptureReference" style={{ color: theme.colors.textSecondary }}>{scripture?.displayReference ?? session.scriptureReference} · {scripture?.translation ?? scriptureService.getBibleMetadata().abbreviation}</Text>
          </View>
        );
      case 'reflect':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>{t('today.step.reflect')}</Text>
            <Text variant="body" style={styles.bodyText}>{session.reflection}</Text>
          </View>
        );
      case 'think':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>{t('today.step.think')}</Text>
            <View style={styles.questionsWrap}>
              {session.reflectionQuestions.map((question, index) => (
                <View key={question} style={[styles.questionRow, { borderColor: theme.colors.rule }]}>
                  <Text variant="caption" style={{ color: theme.colors.accent }}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text variant="headingSerif" style={styles.questionText}>{question}</Text>
                </View>
              ))}
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>
              {t('moment.thinkHint')}
            </Text>
          </View>
        );
      case 'pray':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>{t('today.step.pray')}</Text>
            <Text variant="body" style={styles.bodyText}>{session.prayer}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>
              {t('moment.prayHint')}
            </Text>
          </View>
        );
      case 'act':
        return (
          <View style={styles.stageWrap}>
            <Text variant="caption" style={styles.kicker}>{t('today.step.act')}</Text>
            <Text variant="headingSerif" style={styles.actionHeading}>{t('moment.actionHeading')}</Text>
            <Text variant="body" style={styles.bodyText}>{session.action}</Text>
          </View>
        );
      default:
        return null;
    }
  }, [currentStage, scripture, session, t, theme.colors.accent, theme.colors.rule, theme.colors.textMuted, theme.colors.textSecondary]);

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
          <BrandMark size="medium" />
          <Text variant="displaySerif">{t('moment.completeTitle')}</Text>
          <Text variant="body" style={styles.bodyText}>{t('moment.completeBody')}</Text>
          {scripture ? (
            <Text variant="scripture" style={styles.completeScriptureExcerpt}>
              {scripture.text}
            </Text>
          ) : null}
          <View style={[styles.completeCard, { borderColor: theme.colors.rule }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.success }}>{t('moment.todaysScripture')}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              {progress?.completedStages.length === 5 ? t('today.streak.one', { count: 1 }) : t('today.dailyStreak')}
            </Text>
          </View>
          <Button title={t('common.done')} onPress={handleDone} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel={t('moment.closeLabel')} onPress={handleDone}>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('moment.close')}</Text>
        </Pressable>
        <EditorialLabel>{t(stageMeta[currentStage].labelKey)}</EditorialLabel>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={((stageIndex + 1) / 5)} />
        <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
          {t('today.progressCount', { completed: stageIndex + 1, total: 5 })}
        </Text>
      </View>

      <View style={styles.titleWrap}>
        <Text variant="headingSerif" style={styles.title}>{t(stageMeta[currentStage].headingKey)}</Text>
      </View>

      {content}

      <View style={styles.footer}>
        <Button title={currentStage === 'act' ? t('moment.completeToday') : t('common.continue')} onPress={handleContinue} />
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
    gap: 0,
  },
  questionRow: {
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  questionText: {
    lineHeight: 36,
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
    paddingVertical: 14,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  completeScriptureExcerpt: {
    fontSize: 24,
    lineHeight: 34,
  },
});
