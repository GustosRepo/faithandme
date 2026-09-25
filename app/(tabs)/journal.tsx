import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, Divider, EditorialLabel, Screen, SectionHeader, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  addJournalEntry,
  deleteJournalEntry,
  loadJournalEntries,
  type JournalEntry,
  type JournalEntryKind,
} from '@/storage/journal';

const journalKinds: JournalEntryKind[] = ['prayer', 'reflection', 'gratitude'];
const INITIAL_VISIBLE_ENTRIES = 12;
const VISIBLE_ENTRY_INCREMENT = 12;
const ENTRY_PREVIEW_LINES = 4;

type JournalFilter = JournalEntryKind | 'all' | 'ask';

const kindTitleKeys: Record<JournalEntryKind, TranslationKey> = {
  prayer: 'journal.kind.prayer',
  reflection: 'journal.kind.reflection',
  gratitude: 'journal.kind.gratitude',
};

const kindLabelKeys: Record<JournalEntryKind, TranslationKey> = {
  prayer: 'journal.kindLabel.prayer',
  reflection: 'journal.kindLabel.reflection',
  gratitude: 'journal.kindLabel.gratitude',
};

const draftPromptKeys: Record<JournalEntryKind, TranslationKey> = {
  prayer: 'journal.prompt.prayer',
  reflection: 'journal.prompt.reflection',
  gratitude: 'journal.prompt.gratitude',
};

const guidedPrompts: Record<JournalEntryKind, { labelKey: TranslationKey; textKey: TranslationKey }[]> = {
  prayer: [
    { labelKey: 'journal.prompt.surrender', textKey: 'journal.prompt.surrenderText' },
    { labelKey: 'journal.prompt.intercession', textKey: 'journal.prompt.intercessionText' },
    { labelKey: 'journal.prompt.courage', textKey: 'journal.prompt.courageText' },
  ],
  reflection: [
    { labelKey: 'journal.prompt.noticed', textKey: 'journal.prompt.noticedText' },
    { labelKey: 'journal.prompt.heavy', textKey: 'journal.prompt.heavyText' },
    { labelKey: 'journal.prompt.practice', textKey: 'journal.prompt.practiceText' },
  ],
  gratitude: [
    { labelKey: 'journal.prompt.mercy', textKey: 'journal.prompt.mercyText' },
    { labelKey: 'journal.prompt.person', textKey: 'journal.prompt.personText' },
    { labelKey: 'journal.prompt.provision', textKey: 'journal.prompt.provisionText' },
  ],
};

function formatEntryDate(value: string, t: (key: TranslationKey) => string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t('common.today');
  if (date.toDateString() === yesterday.toDateString()) return t('common.yesterday');

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function JournalScreen() {
  const theme = useAppTheme();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedKind, setSelectedKind] = useState<JournalEntryKind>('prayer');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [visibleEntryCount, setVisibleEntryCount] = useState(INITIAL_VISIBLE_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<JournalFilter>('all');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void loadJournalEntries().then((nextEntries) => {
        if (active) {
          setEntries(nextEntries);
          setVisibleEntryCount(INITIAL_VISIBLE_ENTRIES);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const entryCounts = useMemo(() => {
    return entries.reduce<Record<JournalEntryKind, number>>(
      (acc, entry) => {
        acc[entry.kind] += 1;
        return acc;
      },
      { prayer: 0, reflection: 0, gratitude: 0 },
    );
  }, [entries]);

  const canSave = draft.trim().length >= 3 && !saving;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesFilter = activeFilter === 'all'
        ? true
        : activeFilter === 'ask'
          ? entry.source === 'ask'
          : entry.kind === activeFilter;

      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      return [
        entry.title,
        entry.content,
        t(kindTitleKeys[entry.kind]),
        entry.source === 'ask' ? 'Ask Scripture' : '',
      ].join(' ').toLowerCase().includes(normalizedSearch);
    });
  }, [activeFilter, entries, normalizedSearch, t]);
  const visibleEntries = filteredEntries.slice(0, visibleEntryCount);
  const hiddenEntryCount = Math.max(filteredEntries.length - visibleEntries.length, 0);

  useEffect(() => {
    setVisibleEntryCount(INITIAL_VISIBLE_ENTRIES);
  }, [activeFilter, normalizedSearch]);

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const entry = await addJournalEntry({
        kind: selectedKind,
        title: t(kindTitleKeys[selectedKind]),
        content: draft,
      });
      setEntries((current) => [entry, ...current]);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(t('journal.deleteTitle'), t('journal.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setEntries((current) => current.filter((item) => item.id !== entry.id));
          setSelectedEntry((current) => current?.id === entry.id ? null : current);
          void deleteJournalEntry(entry.id);
        },
      },
    ]);
  };

  const handlePromptPress = (text: string) => {
    setDraft((current) => current.trim().length > 0 ? `${current.trim()}\n\n${text}` : text);
  };

  return (
    <Screen
      contentContainerStyle={styles.container}
      scrollProps={{
        keyboardShouldPersistTaps: 'handled',
        keyboardDismissMode: 'interactive',
        automaticallyAdjustKeyboardInsets: true,
      }}
    >
      <EditorialLabel>Journal</EditorialLabel>
      <Text variant="displaySerif">{t('journal.title')}</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        {t('journal.subtitle')}
      </Text>

      <View style={styles.kindRow}>
        {journalKinds.map((kind) => (
          <Chip
            key={kind}
            label={`${t(kindTitleKeys[kind])} ${entryCounts[kind] ? entryCounts[kind] : ''}`.trim()}
            selected={selectedKind === kind}
            onPress={() => setSelectedKind(kind)}
          />
        ))}
      </View>

      <View style={[styles.composer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.composerHeader}>
          <EditorialLabel>{t(kindLabelKeys[selectedKind])}</EditorialLabel>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>
            {draft.length ? t('journal.characters', { count: draft.length }) : ' '}
          </Text>
        </View>
        <TextInput
          multiline
          value={draft}
          onChangeText={setDraft}
          placeholder={t(draftPromptKeys[selectedKind])}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
          textAlignVertical="top"
          accessibilityLabel={t('journal.entryLabel')}
        />
        <View style={styles.promptBlock}>
          <EditorialLabel>{t('journal.guided')}</EditorialLabel>
          <View style={styles.kindRow}>
            {guidedPrompts[selectedKind].map((prompt) => (
              <Chip key={prompt.labelKey} label={t(prompt.labelKey)} onPress={() => handlePromptPress(t(prompt.textKey))} />
            ))}
          </View>
        </View>
        <Button title={saving ? t('journal.saving') : t('journal.save')} disabled={!canSave} onPress={handleSave} />
      </View>

      <View style={[styles.searchBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={17} color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('journal.search')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            accessibilityLabel={t('journal.searchLabel')}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('journal.clearSearch')}
              hitSlop={10}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={17} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.kindRow}>
          <Chip label={t('common.all')} selected={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
          <Chip label={t('journal.filter.prayer')} selected={activeFilter === 'prayer'} onPress={() => setActiveFilter('prayer')} />
          <Chip label={t('journal.filter.reflection')} selected={activeFilter === 'reflection'} onPress={() => setActiveFilter('reflection')} />
          <Chip label={t('journal.filter.gratitude')} selected={activeFilter === 'gratitude'} onPress={() => setActiveFilter('gratitude')} />
          <Chip label={t('journal.filter.ask')} selected={activeFilter === 'ask'} onPress={() => setActiveFilter('ask')} />
        </View>
      </View>

      <SectionHeader title={t('journal.recent')} secondary={entries.length ? t('journal.shown', { filtered: filteredEntries.length, total: entries.length }) : undefined} />
      <View style={styles.entriesList}>
        {entries.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.rule }]}>
            <Text variant="headingSerif">{t('journal.emptyTitle')}</Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              {t('journal.emptyBody')}
            </Text>
          </View>
        ) : null}

        {entries.length > 0 && filteredEntries.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.rule }]}>
            <Text variant="headingSerif">{t('journal.noMatchTitle')}</Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              {t('journal.noMatchBody')}
            </Text>
          </View>
        ) : null}

        {visibleEntries.map((entry, index) => (
          <View key={entry.id}>
            <View style={styles.entryShell}>
                <Pressable
                  accessibilityRole="button"
                accessibilityLabel={t('journal.openEntry')}
                onPress={() => setSelectedEntry(entry)}
                style={({ pressed }) => [styles.entryPreview, { opacity: pressed ? 0.72 : 1 }]}
              >
                <View style={styles.entryRow}>
                  <View style={styles.entryTitleBlock}>
                    <EditorialLabel>{t(kindLabelKeys[entry.kind])}</EditorialLabel>
                    {entry.source === 'ask' ? (
                      <Text variant="caption" style={{ color: theme.colors.accent }}>{t('journal.fromAsk')}</Text>
                    ) : null}
                  </View>
                  <Text variant="caption" style={{ color: theme.colors.textMuted }}>{formatEntryDate(entry.createdAt, t)}</Text>
                </View>
                <Text
                  variant="body"
                  numberOfLines={ENTRY_PREVIEW_LINES}
                  style={{ color: theme.colors.textSecondary, marginTop: 8 }}
                >
                  {entry.content}
                </Text>
              </Pressable>
              <View style={styles.entryActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('journal.deleteEntryLabel')}
                  hitSlop={10}
                  onPress={() => handleDelete(entry)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="trash-outline" size={17} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            </View>
            {index < visibleEntries.length - 1 ? <Divider /> : null}
          </View>
        ))}

        {hiddenEntryCount > 0 ? (
          <Button
            title={t('journal.showMore', { count: Math.min(hiddenEntryCount, VISIBLE_ENTRY_INCREMENT) })}
            variant="secondary"
            onPress={() => setVisibleEntryCount((current) => current + VISIBLE_ENTRY_INCREMENT)}
          />
        ) : null}
      </View>

      <Modal
        visible={Boolean(selectedEntry)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEntry(null)}
      >
        {selectedEntry ? (
          <View style={[styles.detailScreen, { backgroundColor: theme.colors.background }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailContent}
            >
              <View style={styles.detailHeader}>
                <View style={styles.entryTitleBlock}>
                  <EditorialLabel>{t(kindLabelKeys[selectedEntry.kind])}</EditorialLabel>
                  <Text variant="displaySerif">{selectedEntry.title}</Text>
                  <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                    {formatEntryDate(selectedEntry.createdAt, t)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('journal.closeEntry')}
                  hitSlop={10}
                  onPress={() => setSelectedEntry(null)}
                  style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.75 : 1 }]}
                >
                  <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <Divider />
              <Text variant="body" style={[styles.detailBody, { color: theme.colors.textSecondary }]}>
                {selectedEntry.content}
              </Text>
              <Button title={t('journal.deleteEntry')} variant="secondary" onPress={() => handleDelete(selectedEntry)} />
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 92,
  },
  kindRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  composer: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
    padding: 16,
  },
  composerHeader: {
    minHeight: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    minHeight: 140,
    padding: 0,
    fontSize: 17,
    lineHeight: 27,
  },
  promptBlock: {
    gap: 10,
  },
  searchBlock: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
    padding: 14,
  },
  searchRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 22,
  },
  entriesList: {
    gap: 12,
    paddingTop: 4,
  },
  emptyState: {
    gap: 8,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryShell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  entryPreview: {
    flex: 1,
    minWidth: 0,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6,
  },
  entryTitleBlock: {
    gap: 4,
    flex: 1,
  },
  entryActions: {
    minHeight: 34,
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  detailScreen: {
    flex: 1,
  },
  detailContent: {
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 42,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: {
    fontSize: 18,
    lineHeight: 30,
  },
});
