import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, Divider, EditorialLabel, Screen, SectionHeader, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  addJournalEntry,
  defaultJournalTitle,
  deleteJournalEntry,
  journalKindLabel,
  loadJournalEntries,
  type JournalEntry,
  type JournalEntryKind,
} from '@/storage/journal';

const journalKinds: JournalEntryKind[] = ['prayer', 'reflection', 'gratitude'];
const INITIAL_VISIBLE_ENTRIES = 12;
const VISIBLE_ENTRY_INCREMENT = 12;
const ENTRY_PREVIEW_LINES = 4;

type JournalFilter = JournalEntryKind | 'all' | 'ask';

const draftPrompts: Record<JournalEntryKind, string> = {
  prayer: 'Lord,',
  reflection: 'Today I noticed...',
  gratitude: 'I am thankful for...',
};

const guidedPrompts: Record<JournalEntryKind, { label: string; text: string }[]> = {
  prayer: [
    { label: 'Surrender', text: 'Lord, today I need to surrender...' },
    { label: 'Intercession', text: 'Lord, I want to pray for...' },
    { label: 'Courage', text: 'Lord, give me courage to...' },
  ],
  reflection: [
    { label: 'What I noticed', text: 'Today I noticed God meeting me in...' },
    { label: 'What felt heavy', text: 'Something that felt heavy today was...' },
    { label: 'What to practice', text: 'One faithful thing I can practice next is...' },
  ],
  gratitude: [
    { label: 'Small mercy', text: 'A small mercy I received today was...' },
    { label: 'Person', text: 'I am thankful for this person because...' },
    { label: 'Provision', text: 'God provided for me today through...' },
  ],
};

function formatEntryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function JournalScreen() {
  const theme = useAppTheme();
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
        journalKindLabel(entry.kind),
        entry.source === 'ask' ? 'Ask Scripture' : '',
      ].join(' ').toLowerCase().includes(normalizedSearch);
    });
  }, [activeFilter, entries, normalizedSearch]);
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
        title: defaultJournalTitle(selectedKind),
        content: draft,
      });
      setEntries((current) => [entry, ...current]);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert('Delete entry?', 'This journal entry will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
      <Text variant="displaySerif">Private reflection.</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        Prayer, gratitude, and the thoughts you want to keep with God.
      </Text>

      <View style={styles.kindRow}>
        {journalKinds.map((kind) => (
          <Chip
            key={kind}
            label={`${defaultJournalTitle(kind)} ${entryCounts[kind] ? entryCounts[kind] : ''}`.trim()}
            selected={selectedKind === kind}
            onPress={() => setSelectedKind(kind)}
          />
        ))}
      </View>

      <View style={[styles.composer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.composerHeader}>
          <EditorialLabel>{journalKindLabel(selectedKind)}</EditorialLabel>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>
            {draft.length ? `${draft.length} characters` : ' '}
          </Text>
        </View>
        <TextInput
          multiline
          value={draft}
          onChangeText={setDraft}
          placeholder={draftPrompts[selectedKind]}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
          textAlignVertical="top"
          accessibilityLabel="Journal entry"
        />
        <View style={styles.promptBlock}>
          <EditorialLabel>Guided prompts</EditorialLabel>
          <View style={styles.kindRow}>
            {guidedPrompts[selectedKind].map((prompt) => (
              <Chip key={prompt.label} label={prompt.label} onPress={() => handlePromptPress(prompt.text)} />
            ))}
          </View>
        </View>
        <Button title={saving ? 'Saving...' : 'Save entry'} disabled={!canSave} onPress={handleSave} />
      </View>

      <View style={[styles.searchBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={17} color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search journal"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            accessibilityLabel="Search journal"
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear journal search"
              hitSlop={10}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={17} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.kindRow}>
          <Chip label="All" selected={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
          <Chip label="Prayer" selected={activeFilter === 'prayer'} onPress={() => setActiveFilter('prayer')} />
          <Chip label="Reflection" selected={activeFilter === 'reflection'} onPress={() => setActiveFilter('reflection')} />
          <Chip label="Gratitude" selected={activeFilter === 'gratitude'} onPress={() => setActiveFilter('gratitude')} />
          <Chip label="From Ask" selected={activeFilter === 'ask'} onPress={() => setActiveFilter('ask')} />
        </View>
      </View>

      <SectionHeader title="Recent entries" secondary={entries.length ? `${filteredEntries.length}/${entries.length} shown` : undefined} />
      <View style={styles.entriesList}>
        {entries.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.rule }]}>
            <Text variant="headingSerif">A quiet place to begin.</Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              Your prayers and reflections will stay on this device.
            </Text>
          </View>
        ) : null}

        {entries.length > 0 && filteredEntries.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.rule }]}>
            <Text variant="headingSerif">Nothing matched.</Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              Try a different word or filter.
            </Text>
          </View>
        ) : null}

        {visibleEntries.map((entry, index) => (
          <View key={entry.id}>
            <View style={styles.entryShell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open journal entry"
                onPress={() => setSelectedEntry(entry)}
                style={({ pressed }) => [styles.entryPreview, { opacity: pressed ? 0.72 : 1 }]}
              >
                <View style={styles.entryRow}>
                  <View style={styles.entryTitleBlock}>
                    <EditorialLabel>{journalKindLabel(entry.kind)}</EditorialLabel>
                    {entry.source === 'ask' ? (
                      <Text variant="caption" style={{ color: theme.colors.accent }}>From Ask Scripture</Text>
                    ) : null}
                  </View>
                  <Text variant="caption" style={{ color: theme.colors.textMuted }}>{formatEntryDate(entry.createdAt)}</Text>
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
                  accessibilityLabel="Delete journal entry"
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
            title={`Show ${Math.min(hiddenEntryCount, VISIBLE_ENTRY_INCREMENT)} more`}
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
                  <EditorialLabel>{journalKindLabel(selectedEntry.kind)}</EditorialLabel>
                  <Text variant="displaySerif">{selectedEntry.title}</Text>
                  <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                    {formatEntryDate(selectedEntry.createdAt)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close journal entry"
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
              <Button title="Delete entry" variant="secondary" onPress={() => handleDelete(selectedEntry)} />
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
