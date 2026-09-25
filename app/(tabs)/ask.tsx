import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button, Chip, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { askScripture, getAskScriptureUsage } from '@/services/ask/AskScriptureService';
import { getAskTopicLabels } from '@/services/ask/scriptureRetrieval';
import type { AskScriptureErrorCode, AskScriptureResult, AskScriptureUsage } from '@/services/ask/types';
import { AskScriptureError } from '@/services/ask/types';
import { addJournalEntry } from '@/storage/journal';

const MAX_QUESTION_LENGTH = 800;

const suggestedQuestions: Record<string, string> = {
  Anxiety: "I'm anxious about something I can't control.",
  Forgiveness: "I'm angry with someone and don't know how to let it go.",
  Relationships: 'My relationship has been difficult lately.',
  Purpose: "I don't know what direction to take in life.",
  Money: "I'm worried about money and how to handle it faithfully.",
  Faith: "I'm struggling to trust God right now.",
};

const followUpActions = [
  {
    label: 'Go deeper',
    prompt: (result: AskScriptureResult) => `Go deeper on this answer to my question: "${result.question}". Help me understand what I may be missing and how to sit with this Scripture.`,
  },
  {
    label: 'Explain context',
    prompt: (result: AskScriptureResult) => `Explain the biblical context behind these passages from my question: "${result.question}". Keep it pastoral and easy to understand.`,
  },
  {
    label: 'Turn into prayer',
    prompt: (result: AskScriptureResult) => `Turn this answer into a personal prayer for me: "${result.question}".`,
  },
  {
    label: '3-day plan',
    prompt: (result: AskScriptureResult) => `Give me a simple 3-day Scripture reflection plan based on this question: "${result.question}".`,
  },
] as const;

function getErrorCopy(error: { code: AskScriptureErrorCode | 'unknown'; message: string }) {
  switch (error.code) {
    case 'daily_ask_limit':
      return {
        title: "That's all for today.",
        body: "You've used today's free Ask Scripture questions. Come back tomorrow for more.",
        canRetry: false,
        showOfflineLinks: false,
      };
    case 'network':
    case 'missing_api_url':
      return {
        title: error.code === 'missing_api_url' ? 'Ask Scripture needs setup.' : "Couldn't connect right now.",
        body: error.code === 'missing_api_url'
          ? 'Ask Scripture needs a Faith & Me API connection before it can respond.'
          : 'Check your connection and try again. You can still read the Bible or continue today\'s moment offline.',
        canRetry: error.code === 'network',
        showOfflineLinks: true,
      };
    case 'ai_daily_cap':
    case 'ask_scripture_disabled':
    case 'server':
      return {
        title: 'Ask Scripture is taking a break.',
        body: 'Your Bible, daily Scripture, and 5 Minutes With God are still available.',
        canRetry: true,
        showOfflineLinks: true,
      };
    case 'ask_already_in_progress':
      return {
        title: 'Still preparing your answer.',
        body: 'Your previous question is still being prepared.',
        canRetry: false,
        showOfflineLinks: false,
      };
    default:
      return {
        title: 'Try that again?',
        body: error.message,
        canRetry: true,
        showOfflineLinks: false,
      };
  }
}

export default function AskScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const topics = getAskTopicLabels();
  const inputRef = useRef<TextInput>(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AskScriptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding relevant Scripture...');
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

    setLoadingMessage('Finding relevant Scripture...');
    const timer = setTimeout(() => setLoadingMessage('Reflecting on these passages...'), 1800);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Keyboard.dismiss();
    setError(null);
    setResult(null);
    setSavedToJournal(false);
    setLoading(true);

    try {
      const answer = await askScripture(question);
      setResult(answer);
      setQuestion('');
      setUsage(answer.usage);
    } catch (caught) {
      if (caught instanceof AskScriptureError) {
        setError({ code: caught.code, message: caught.message });
      } else {
        setError({ code: 'unknown', message: 'Something went wrong while preparing your response.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: string) => {
    setQuestion(suggestedQuestions[topic] ?? topic);
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
        title: 'Ask Scripture Reflection',
        source: 'ask',
        content: [
          `Question: ${result.question}`,
          result.answer.summary,
          scriptureLines ? `Scripture:\n${scriptureLines}` : '',
          `Context:\n${result.answer.context}`,
          `Application:\n${result.answer.application}`,
          reflectionLines ? `Reflect:\n${reflectionLines}` : '',
          `Prayer:\n${result.answer.prayer}`,
          `Next step:\n${result.answer.nextStep}`,
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
  const hasMeaningfulContent = normalizedQuestion.length >= 8 && /[A-Za-z]/.test(normalizedQuestion);
  const canSubmit = hasMeaningfulContent && !loading && !exhausted && !result;
  const usageLabel = usage
    ? `${usage.remaining} question${usage.remaining === 1 ? '' : 's'} available today`
    : 'Ask Scripture usage will update when connected.';
  const showCharacterCount = question.length > 0;
  const errorCopy = error ? getErrorCopy(error) : null;

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
            <Text variant="display">Ask Scripture</Text>
            <Text variant="headingSerif" style={styles.heartHeading}>
              What&apos;s on your heart?
            </Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              Ask about Scripture, faith, or something you&apos;re going through.
            </Text>
          </View>

          <Text variant="bodySmall" style={{ color: exhausted ? theme.colors.warning : theme.colors.textMuted }}>
            {usageLabel}
          </Text>

          {exhausted ? (
            <View style={[styles.notice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <Text variant="subheading">You&apos;ve used today&apos;s free questions.</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Come back tomorrow for more.</Text>
              <Button title="View upgrade" variant="secondary" onPress={() => router.push('/upgrade')} />
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
              placeholder="I'm struggling with..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.text }]}
              maxLength={MAX_QUESTION_LENGTH}
              textAlignVertical="top"
              editable={!loading && !exhausted}
              accessibilityLabel="Ask Scripture question"
              returnKeyType="default"
            />

            <View style={styles.composerFooter}>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                {showCharacterCount ? `${question.length}/${MAX_QUESTION_LENGTH}` : ' '}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send question"
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
              People often ask
            </Text>
            <View style={styles.suggestionsRow}>
              {topics.map((topic) => (
                <Chip key={topic} label={topic} onPress={() => handleTopicPress(topic)} />
              ))}
            </View>
          </View>

          {errorCopy ? (
            <View style={[styles.notice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <Text variant="subheading">{errorCopy.title}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{errorCopy.body}</Text>
              <View style={styles.noticeActions}>
                {errorCopy.canRetry ? <Button title="Try again" variant="secondary" onPress={handleSubmit} disabled={!hasMeaningfulContent || loading || exhausted} /> : null}
                {errorCopy.showOfflineLinks ? (
                  <>
                    <Button title="Read the Bible" variant="ghost" onPress={() => router.push('/(tabs)/bible')} />
                    <Button title={"Today's Moment"} variant="ghost" onPress={() => router.push('/(tabs)')} />
                  </>
                ) : null}
                {error?.code === 'daily_ask_limit' ? <Button title="View upgrade" variant="ghost" onPress={() => router.push('/upgrade')} /> : null}
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
            <EditorialLabel>Ask Scripture</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>You asked</Text>
            <Text variant="body" style={[styles.quotedQuestion, { color: theme.colors.textSecondary }]}>
              &quot;{result.question}&quot;
            </Text>
          </View>

          {result.answer.safetyNote ? (
            <View style={[styles.safetyNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <EditorialLabel>Safety</EditorialLabel>
              <Text variant="body" style={{ color: theme.colors.textSecondary }}>{result.answer.safetyNote}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="body" style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
              {result.answer.summary}
            </Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>Scripture</EditorialLabel>
            {result.scriptures.map((scripture, index) => (
              <View key={scripture.reference} style={[styles.scriptureBlock, { borderLeftColor: theme.colors.accent }]}>
                {index > 0 ? <Divider /> : null}
                <Text variant="subheading" style={{ color: theme.colors.accent }}>{scripture.passage.displayReference}</Text>
                <Text variant="scripture" style={styles.scriptureText}>&quot;{scripture.passage.text}&quot;</Text>
                <Text variant="scriptureReference" style={{ color: theme.colors.textSecondary }}>
                  BSB
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.accent, marginTop: 10 }}>Why this matters</Text>
                <Text variant="body" style={styles.answerText}>{scripture.reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <EditorialLabel>Context</EditorialLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.context}</Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>What This Could Mean For You</EditorialLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.application}</Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>Reflect</EditorialLabel>
            {result.answer.reflectionQuestions.map((reflectionQuestion, index) => (
              <View key={reflectionQuestion} style={styles.reflectionRow}>
                <Text variant="caption" style={{ color: theme.colors.accent }}>{String(index + 1).padStart(2, '0')}</Text>
                <Text variant="body" style={[styles.answerText, styles.reflectionText]}>{reflectionQuestion}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <EditorialLabel>Prayer</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>If it&apos;s helpful, you might pray:</Text>
            <Text variant="body" style={[styles.answerText, styles.prayerText, { color: theme.colors.textSecondary }]}>{result.answer.prayer}</Text>
          </View>

          <View style={[styles.nextStepBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.accentSoft }]}>
            <EditorialLabel>One Small Step</EditorialLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.nextStep}</Text>
          </View>

          <View style={styles.section}>
            <EditorialLabel>Follow up</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              Use this answer as a starting point for a deeper question.
            </Text>
            <View style={styles.followUpRow}>
              {followUpActions.map((action) => (
                <Chip key={action.label} label={action.label} onPress={() => handleFollowUp(action.prompt(result))} />
              ))}
            </View>
          </View>

          <View style={styles.answerActions}>
            <Button
              title={savedToJournal ? 'Saved to Journal' : savingToJournal ? 'Saving...' : 'Save to Journal'}
              variant={savedToJournal ? 'secondary' : 'primary'}
              disabled={savingToJournal || savedToJournal}
              onPress={handleSaveToJournal}
            />
            {savedToJournal ? <Button title="Open Journal" variant="ghost" onPress={() => router.push('/(tabs)/journal')} /> : null}
            <Button title="Ask something else" variant="secondary" onPress={handleReset} />
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
