import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Chip, Divider, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { askScripture, getAskScriptureUsage } from '@/services/ask/AskScriptureService';
import { getAskTopicLabels } from '@/services/ask/scriptureRetrieval';
import type { AskScriptureResult, AskScriptureUsage } from '@/services/ask/types';
import { AskScriptureError } from '@/services/ask/types';

const suggestedQuestions: Record<string, string> = {
  Anxiety: "I'm anxious about something I can't control.",
  Forgiveness: "I'm angry with someone and don't know how to let it go.",
  Relationships: 'My relationship has been difficult lately.',
  Purpose: "I don't know what direction to take in life.",
  Money: "I'm worried about money and how to handle it faithfully.",
  Faith: "I'm struggling to trust God right now.",
};

function SectionLabel({ children }: { children: string }) {
  const theme = useAppTheme();

  return (
    <Text variant="caption" style={{ color: theme.colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export default function AskScreen() {
  const theme = useAppTheme();
  const topics = getAskTopicLabels();
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AskScriptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding relevant Scripture...');
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AskScriptureUsage | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getAskScriptureUsage()
      .then((nextUsage) => {
        if (!cancelled) setUsage(nextUsage);
      })
      .catch(() => {
        if (!cancelled) setUsage(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingMessage('Reflecting on these passages...');

    try {
      const answer = await askScripture(question);
      setResult(answer);
      setUsage(answer.usage);
    } catch (caught) {
      if (caught instanceof AskScriptureError) {
        setError(caught.message);
      } else {
        setError('Something went wrong while preparing your response.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exhausted = usage ? usage.remaining <= 0 : false;
  const canSubmit = question.trim().length >= 8 && !loading && !exhausted;
  const usageLabel = usage
    ? `${usage.remaining} question${usage.remaining === 1 ? '' : 's'} available today`
    : 'Ask Scripture usage will update when connected.';

  return (
    <Screen contentContainerStyle={styles.container} scrollProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <Text variant="display">Ask Scripture</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        What&apos;s on your heart?
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.textMuted, marginTop: -4 }}>
        Ask about Scripture, faith, or something you&apos;re going through.
      </Text>

      <Text variant="bodySmall" style={{ color: exhausted ? theme.colors.warning : theme.colors.textMuted }}>
        {usageLabel}
      </Text>

      {exhausted ? (
        <Card style={[styles.statusCard, { borderColor: theme.colors.warning }]}>
          <Text variant="subheading">You&apos;ve used today&apos;s free questions.</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Come back tomorrow for more.</Text>
        </Card>
      ) : null}

      <View style={[styles.composer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <TextInput
          multiline
          value={question}
          onChangeText={setQuestion}
          placeholder="I'm struggling with..."
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
          maxLength={800}
          textAlignVertical="top"
          editable={!loading && !exhausted}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send question"
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSubmit ? theme.colors.accent : theme.colors.surfaceSecondary,
              opacity: pressed ? 0.9 : canSubmit ? 1 : 0.55,
            },
          ]}
        >
          <Text variant="caption" style={{ color: canSubmit ? theme.colors.surface : theme.colors.textMuted }}>Send</Text>
        </Pressable>
      </View>

      <Text variant="caption" style={{ color: theme.colors.textMuted, marginTop: 4 }}>
        People often ask
      </Text>

      <View style={styles.suggestionsRow}>
        {topics.map((topic) => (
          <Chip key={topic} label={topic} onPress={() => setQuestion(suggestedQuestions[topic] ?? topic)} />
        ))}
      </View>

      {error ? (
        <Card style={[styles.statusCard, { borderColor: theme.colors.warning }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{error}</Text>
        </Card>
      ) : null}

      {loading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{loadingMessage}</Text>
        </Card>
      ) : null}

      {result ? (
        <View style={styles.answerWrap}>
          <View style={styles.section}>
            <SectionLabel>Your Question</SectionLabel>
            <Text variant="body" style={styles.quotedQuestion}>&quot;{result.question}&quot;</Text>
          </View>

          {result.answer.safetyNote ? (
            <Card style={[styles.statusCard, { borderColor: theme.colors.warning }]}>
              <SectionLabel>Safety</SectionLabel>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{result.answer.safetyNote}</Text>
            </Card>
          ) : null}

          <View style={styles.section}>
            <SectionLabel>Scripture</SectionLabel>
            {result.scriptures.map((scripture, index) => (
              <View key={scripture.reference} style={styles.scriptureBlock}>
                {index > 0 ? <Divider /> : null}
                <Text variant="subheading">{scripture.passage.displayReference}</Text>
                <Text variant="scripture" style={styles.scriptureText}>{scripture.passage.text}</Text>
                <Text variant="scriptureReference" style={{ color: theme.colors.textSecondary }}>
                  {scripture.passage.displayReference} · {scripture.passage.translation}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.accent, marginTop: 8 }}>Why this matters:</Text>
                <Text variant="body" style={styles.answerText}>{scripture.reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <SectionLabel>Context</SectionLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.context}</Text>
          </View>

          <View style={styles.section}>
            <SectionLabel>What This Could Mean For You</SectionLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.application}</Text>
          </View>

          <View style={styles.section}>
            <SectionLabel>Reflect</SectionLabel>
            {result.answer.reflectionQuestions.map((reflectionQuestion, index) => (
              <Text key={reflectionQuestion} variant="body" style={styles.answerText}>
                {index + 1}. {reflectionQuestion}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <SectionLabel>Prayer</SectionLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>If it&apos;s helpful, you might pray:</Text>
            <Text variant="body" style={styles.answerText}>{result.answer.prayer}</Text>
          </View>

          <View style={styles.section}>
            <SectionLabel>Next Step</SectionLabel>
            <Text variant="body" style={styles.answerText}>{result.answer.nextStep}</Text>
          </View>

          <Button title="Ask another question" variant="secondary" onPress={() => { setResult(null); setQuestion(''); }} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  composer: {
    minHeight: 128,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    minHeight: 72,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  sendButton: {
    alignSelf: 'flex-end',
    minWidth: 72,
    minHeight: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 10,
    marginTop: 2,
  },
  statusCard: {
    marginTop: 4,
  },
  loadingCard: {
    marginTop: 4,
    alignItems: 'center',
  },
  answerWrap: {
    gap: 22,
    marginTop: 10,
  },
  section: {
    gap: 10,
  },
  quotedQuestion: {
    fontStyle: 'italic',
  },
  scriptureBlock: {
    gap: 8,
  },
  scriptureText: {
    fontSize: 24,
    lineHeight: 34,
  },
  answerText: {
    lineHeight: 26,
  },
});
