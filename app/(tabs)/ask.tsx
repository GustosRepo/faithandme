import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button, Chip, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { askScripture, getAskScriptureUsage } from '@/services/ask/AskScriptureService';
import { getAskTopicLabels } from '@/services/ask/scriptureRetrieval';
import type { AskScriptureErrorCode, AskScriptureResult, AskScriptureUsage } from '@/services/ask/types';
import { AskScriptureError } from '@/services/ask/types';
import { addJournalEntry } from '@/storage/journal';

const MAX_QUESTION_LENGTH = 800;

const topicLabelKeys: Record<string, TranslationKey> = {
  Anxiety: 'topics.anxiety',
  Forgiveness: 'topics.forgiveness',
  Relationships: 'topics.relationships',
  Purpose: 'topics.purpose',
  Money: 'topics.money',
  Faith: 'topics.faith',
};

const suggestedQuestionKeys: Record<string, TranslationKey> = {
  Anxiety: 'ask.suggest.anxiety',
  Forgiveness: 'ask.suggest.forgiveness',
  Relationships: 'ask.suggest.relationships',
  Purpose: 'ask.suggest.purpose',
  Money: 'ask.suggest.money',
  Faith: 'ask.suggest.faith',
};

const followUpActions = [
  {
    labelKey: 'ask.followUp.deep',
    promptKey: 'ask.followPrompt.deep',
  },
  {
    labelKey: 'ask.followUp.context',
    promptKey: 'ask.followPrompt.context',
  },
  {
    labelKey: 'ask.followUp.prayer',
    promptKey: 'ask.followPrompt.prayer',
  },
  {
    labelKey: 'ask.followUp.plan',
    promptKey: 'ask.followPrompt.plan',
  },
] as const satisfies ReadonlyArray<{ labelKey: TranslationKey; promptKey: TranslationKey }>;

function getErrorCopy(error: { code: AskScriptureErrorCode | 'unknown'; message: string }, t: (key: TranslationKey) => string) {
  switch (error.code) {
    case 'daily_ask_limit':
      return {
        title: t('ask.error.dailyTitle'),
        body: t('ask.error.dailyBody'),
        canRetry: false,
        showOfflineLinks: false,
      };
    case 'network':
    case 'missing_api_url':
      return {
        title: error.code === 'missing_api_url' ? t('ask.error.setupTitle') : t('ask.error.networkTitle'),
        body: error.code === 'missing_api_url'
          ? t('ask.error.setupBody')
          : t('ask.error.networkBody'),
        canRetry: error.code === 'network',
        showOfflineLinks: true,
      };
    case 'ai_daily_cap':
    case 'ask_scripture_disabled':
    case 'server':
      return {
        title: t('ask.error.breakTitle'),
        body: t('ask.error.breakBody'),
        canRetry: true,
        showOfflineLinks: true,
      };
    case 'ask_already_in_progress':
      return {
        title: t('ask.error.inProgressTitle'),
        body: t('ask.error.inProgressBody'),
        canRetry: false,
        showOfflineLinks: false,
      };
    default:
      return {
        title: t('ask.error.unknownTitle'),
        body: error.message || t('ask.error.unknownBody'),
        canRetry: true,
        showOfflineLinks: false,
      };
  }
}

export default function AskScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { language, t } = useLanguage();
  const topics = getAskTopicLabels();
  const inputRef = useRef<TextInput>(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AskScriptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(t('ask.loading.finding'));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<{ code: AskScriptureErrorCode | 'unknown'; message: string } | null>(null);
  const [usage, setUsage] = useState<AskScriptureUsage | null>(null);
  const [savingToJournal, setSavingToJournal] = useState(false);
  const [savedToJournal, setSavedToJournal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getAskScriptureUsage()
      .then((nextUsage) => {
        if (!cancelled) setUsage(nextUsage);
      })
      .catch((caught) => {
        if (__DEV__) {
          console.warn('Ask Scripture usage unavailable', caught);
        }
        if (!cancelled) setUsage(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading) return;

    setLoadingMessage(t('ask.loading.finding'));
    const timer = setTimeout(() => setLoadingMessage(t('ask.loading.reflecting')), 1800);
    return () => clearTimeout(timer);
  }, [loading, t]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Keyboard.dismiss();
    setError(null);
    setResult(null);
    setSavedToJournal(false);
    setLoading(true);

    try {
      const answer = await askScripture(question, language);
      setResult(answer);
      setQuestion('');
      setUsage(answer.usage);
    } catch (caught) {
      if (caught instanceof AskScriptureError) {
        setError({ code: caught.code, message: caught.message });
      } else {
        setError({ code: 'unknown', message: t('ask.error.unknownBody') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: string) => {
    const promptKey = suggestedQuestionKeys[topic];
    setQuestion(promptKey ? t(promptKey) : topic);
    setResult(null);
    setError(null);
    setSavedToJournal(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setQuestion('');
    setSavedToJournal(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSaveToJournal = async () => {
    if (!result || savingToJournal || savedToJournal) return;

    setSavingToJournal(true);
    try {
      const scriptureLines = result.scriptures
        .map((scripture) => `${scripture.passage.displayReference}: ${scripture.passage.text}`)
        .join('\n\n');
      const reflectionLines = result.answer.reflectionQuestions
        .map((reflectionQuestion, index) => `${index + 1}. ${reflectionQuestion}`)
        .join('\n');

      await addJournalEntry({
        kind: 'reflection',
        title: t('ask.saveTitle'),
        source: 'ask',
        content: [
          `${t('ask.saveQuestion')}: ${result.question}`,
          result.answer.summary,
          scriptureLines ? `${t('ask.saveScripture')}:\n${scriptureLines}` : '',
          `${t('ask.saveContext')}:\n${result.answer.context}`,
          `${t('ask.saveApplication')}:\n${result.answer.application}`,
          reflectionLines ? `${t('ask.saveReflect')}:\n${reflectionLines}` : '',
          `${t('ask.savePrayer')}:\n${result.answer.prayer}`,
          `${t('ask.saveNextStep')}:\n${result.answer.nextStep}`,
        ].filter(Boolean).join('\n\n'),
      });
      setSavedToJournal(true);
    } finally {
      setSavingToJournal(false);
    }
  };

  const handleFollowUp = (nextQuestion: string) => {
    setQuestion(nextQuestion);
    setResult(null);
    setError(null);
    setSavedToJournal(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const exhausted = usage ? usage.remaining <= 0 : false;
  const normalizedQuestion = question.trim().replace(/\s+/g, ' ');
  const hasMeaningfulContent = normalizedQuestion.length >= 8 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalizedQuestion);
  const canSubmit = hasMeaningfulContent && !loading && !exhausted && !result;
  const usageLabel = usage
    ? t(usage.remaining === 1 ? 'ask.usage.one' : 'ask.usage.other', { count: usage.remaining })
    : t('ask.usage.offline');
  const showCharacterCount = question.length > 0;
  const errorCopy = error ? getErrorCopy(error, t) : null;

  return (
    <Screen
      contentContainerStyle={styles.container}
      scrollProps={{
        keyboardShouldPersistTaps: 'handled',
        keyboardDismissMode: 'interactive',
        automaticallyAdjustKeyboardInsets: true,
      }}
    >
      {!result ? (
        <>
          <View style={styles.hero}>
            <BrandMark size="small" />
            <Text variant="display">{t('ask.title')}</Text>
            <Text variant="headingSerif" style={styles.heartHeading}>
              {t('ask.heart')}
            </Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              {t('ask.subtitle')}
            </Text>
          </View>

          <Text variant="bodySmall" style={{ color: exhausted ? theme.colors.warning : theme.colors.textMuted }}>
            {usageLabel}
          </Text>

          {exhausted ? (
            <View style={[styles.notice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <Text variant="subheading">{t('ask.exhaustedTitle')}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('ask.exhaustedBody')}</Text>
              <Button title={t('ask.viewUpgrade')} variant="secondary" onPress={() => router.push('/upgrade')} />
            </View>
          ) : null}

          <View
            style={[
              styles.composer,
              {
                borderColor: focused ? theme.colors.accent : theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              multiline
              value={question}
              onChangeText={setQuestion}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('ask.placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.text }]}
              maxLength={MAX_QUESTION_LENGTH}
              textAlignVertical="top"
              editable={!loading && !exhausted}
              accessibilityLabel={t('ask.inputLabel')}
              returnKeyType="default"
            />

            <View style={styles.composerFooter}>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                {showCharacterCount ? `${question.length}/${MAX_QUESTION_LENGTH}` : ' '}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ask.sendLabel')}
                accessibilityState={{ disabled: !canSubmit || loading }}
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: canSubmit ? theme.colors.accent : theme.colors.surfaceSecondary,
                    opacity: pressed ? 0.86 : canSubmit ? 1 : 0.55,
                  },
                ]}
              >
                <Ionicons name="arrow-up" size={18} color={canSubmit ? theme.colors.surface : theme.colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.suggestionsBlock}>
            <Text variant="caption" style={{ color: theme.colors.textMuted }}>
              {t('ask.peopleAsk')}
            </Text>
            <View style={styles.suggestionsRow}>
              {topics.map((topic) => (
                <Chip key={topic} label={topicLabelKeys[topic] ? t(topicLabelKeys[topic]) : topic} onPress={() => handleTopicPress(topic)} />
              ))}
            </View>
          </View>

          {errorCopy ? (
            <View style={[styles.notice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <Text variant="subheading">{errorCopy.title}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{errorCopy.body}</Text>
              <View style={styles.noticeActions}>
                {errorCopy.canRetry ? <Button title={t('ask.tryAgain')} variant="secondary" onPress={handleSubmit} disabled={!hasMeaningfulContent || loading || exhausted} /> : null}
                {errorCopy.showOfflineLinks ? (
                  <>
                    <Button title={t('ask.readBible')} variant="ghost" onPress={() => router.push('/(tabs)/bible')} />
                    <Button title={t('ask.todaysMoment')} variant="ghost" onPress={() => router.push('/(tabs)')} />
                  </>
                ) : null}
                {error?.code === 'daily_ask_limit' ? <Button title={t('ask.viewUpgrade')} variant="ghost" onPress={() => router.push('/upgrade')} /> : null}
              </View>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingBlock}>
              <View style={[styles.loadingLine, { backgroundColor: theme.colors.accent }]} />
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{loadingMessage}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.answerWrap}>
          <View style={styles.answerHeader}>
            <EditorialLabel>{t('ask.title')}</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>{t('ask.youAsked')}</Text>
            <Text variant="body" style={[styles.quotedQuestion, { color: theme.colors.textSecondary }]}>
              &quot;{result.question}&quot;
            </Text>
          </View>

          {result.answer.safetyNote ? (
            <View style={[styles.safetyNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <EditorialLabel>{t('ask.safety')}</EditorialLabel>
              <Text variant="body" style={{ color: theme.colors.textSecondary }}>{result.answer.safetyNote}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="body" style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
              {result.answer.summary}
            </Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>{t('ask.scripture')}</EditorialLabel>
            {result.scriptures.map((scripture, index) => (
              <View key={scripture.reference} style={[styles.scriptureBlock, { borderLeftColor: theme.colors.accent }]}>
                {index > 0 ? <Divider /> : null}
                <Text variant="subheading" style={{ color: theme.colors.accent }}>{scripture.passage.displayReference}</Text>
                <Text variant="scripture" style={styles.scriptureText}>&quot;{scripture.passage.text}&quot;</Text>
                <Text variant="scriptureReference" style={{ color: theme.colors.textSecondary }}>
                  {scripture.passage.translation}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.accent, marginTop: 10 }}>{t('ask.whyMatters')}</Text>
                <Text variant="body" style={styles.answerText}>{scripture.reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <EditorialLabel>{t('ask.context')}</EditorialLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.context}</Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>{t('ask.meaning')}</EditorialLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.application}</Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>{t('ask.reflect')}</EditorialLabel>
            {result.answer.reflectionQuestions.map((reflectionQuestion, index) => (
              <View key={reflectionQuestion} style={styles.reflectionRow}>
                <Text variant="caption" style={{ color: theme.colors.accent }}>{String(index + 1).padStart(2, '0')}</Text>
                <Text variant="body" style={[styles.answerText, styles.reflectionText]}>{reflectionQuestion}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <EditorialLabel>{t('ask.prayer')}</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>{t('ask.prayerIntro')}</Text>
            <Text variant="body" style={[styles.answerText, styles.prayerText, { color: theme.colors.textSecondary }]}>{result.answer.prayer}</Text>
          </View>

          <View style={[styles.nextStepBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.accentSoft }]}>
            <EditorialLabel>{t('ask.nextStep')}</EditorialLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.nextStep}</Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>{t('ask.followUp')}</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              {t('ask.followUpBody')}
            </Text>
            <View style={styles.followUpRow}>
              {followUpActions.map((action) => (
                <Chip
                  key={action.labelKey}
                  label={t(action.labelKey)}
                  onPress={() => handleFollowUp(t(action.promptKey, { question: result.question }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.answerActions}>
            <Button
              title={savedToJournal ? t('ask.saved') : savingToJournal ? t('ask.saving') : t('ask.save')}
              variant={savedToJournal ? 'secondary' : 'primary'}
              disabled={savingToJournal || savedToJournal}
              onPress={handleSaveToJournal}
            />
            {savedToJournal ? <Button title={t('ask.openJournal')} variant="ghost" onPress={() => router.push('/(tabs)/journal')} /> : null}
            <Button title={t('ask.askElse')} variant="secondary" onPress={handleReset} />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 92,
  },
  hero: {
    gap: 8,
    paddingTop: 16,
  },
  heartHeading: {
    maxWidth: 300,
  },
  composer: {
    minHeight: 150,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    minHeight: 88,
    fontSize: 16,
    lineHeight: 25,
    padding: 0,
  },
  composerFooter: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sendButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsBlock: {
    gap: 10,
    marginTop: 2,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 10,
    marginTop: 2,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  noticeActions: {
    gap: 8,
    marginTop: 4,
  },
  loadingBlock: {
    marginTop: 6,
    gap: 12,
    alignItems: 'center',
  },
  loadingLine: {
    width: 42,
    height: 2,
    borderRadius: 2,
  },
  answerWrap: {
    gap: 26,
    paddingTop: 16,
  },
  answerHeader: {
    gap: 8,
  },
  section: {
    gap: 10,
  },
  quotedQuestion: {
    fontStyle: 'italic',
  },
  safetyNotice: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  summaryText: {
    fontSize: 19,
    lineHeight: 30,
  },
  scriptureBlock: {
    gap: 8,
    paddingLeft: 16,
    borderLeftWidth: 2,
    paddingVertical: 4,
  },
  scriptureText: {
    fontSize: 25,
    lineHeight: 36,
  },
  answerText: {
    lineHeight: 27,
  },
  reflectionRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  reflectionText: {
    flex: 1,
  },
  prayerText: {
    lineHeight: 28,
  },
  nextStepBlock: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  answerActions: {
    gap: 10,
  },
  followUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 10,
  },
});
