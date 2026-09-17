import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import type { PressableProps, ScrollViewProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View as RNView, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FaithBackground } from '@/components/FaithBackground';
import { useAppTheme } from '@/hooks/useAppTheme';

export type TextVariant =
  | 'display'
  | 'displaySerif'
  | 'heading'
  | 'headingSerif'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'scripture'
  | 'scriptureReference';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ScreenProps = {
  children: ReactNode;
  background?: 'faith' | 'plain';
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  scrollProps?: Partial<ScrollViewProps>;
};

export function Screen({ children, background = 'faith', contentContainerStyle, scrollEnabled = true, scrollProps }: ScreenProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {background === 'faith' ? <FaithBackground /> : null}
      <ScrollView
        style={styles.scroll}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Text({
  variant = 'body',
  style,
  children,
  ...props
}: RNTextProps & { variant?: TextVariant; children: ReactNode }) {
  const theme = useAppTheme();

  return (
    <RNText
      {...props}
      style={[
        { color: theme.colors.text },
        stylesText[variant],
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();

  return (
    <RNView style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}>
      {children}
    </RNView>
  );
}

export function Divider() {
  const theme = useAppTheme();
  return <RNView style={[styles.divider, { backgroundColor: theme.colors.rule }]} />;
}

export function EditorialLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useAppTheme();

  return (
    <Text variant="caption" style={[styles.editorialLabel, { color: theme.colors.textMuted }, style]}>
      {children}
    </Text>
  );
}

export function SectionHeader({
  title,
  secondary,
}: {
  title: string;
  secondary?: string;
}) {
  const theme = useAppTheme();

  return (
    <RNView style={styles.sectionHeaderRow}>
      <EditorialLabel>{title}</EditorialLabel>
      {secondary ? (
        <Text variant="caption" style={{ color: theme.colors.textMuted }}>
          {secondary}
        </Text>
      ) : null}
    </RNView>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: PressableProps['onPress'];
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.accentSoft : 'transparent',
          borderColor: selected ? theme.colors.accent : theme.colors.rule,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text variant="bodySmall" style={{ color: selected ? theme.colors.accent : theme.colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const theme = useAppTheme();
  const safeProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <RNView style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
      <RNView
        style={[
          styles.progressFill,
          {
            width: `${safeProgress * 100}%`,
            backgroundColor: theme.colors.accent,
          },
        ]}
      />
    </RNView>
  );
}

export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  variant = 'default',
}: {
  name: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress?: PressableProps['onPress'];
  variant?: 'default' | 'accent';
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: variant === 'accent' ? theme.colors.accentSoft : theme.colors.surfaceSecondary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons
        name={name}
        size={16}
        color={variant === 'accent' ? theme.colors.accent : theme.colors.textSecondary}
      />
    </Pressable>
  );
}

export function Button({
  title,
  variant = 'primary',
  disabled = false,
  onPress,
}: {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onPress?: PressableProps['onPress'];
}) {
  const theme = useAppTheme();

  const variantStyles: Record<ButtonVariant, { backgroundColor: string; borderColor: string; textColor: string }> = {
    primary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
      textColor: theme.colors.surface,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.accent,
    },
  };

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'ghost' ? styles.buttonGhost : null,
        {
          backgroundColor: variantStyles[variant].backgroundColor,
          borderColor: variantStyles[variant].borderColor,
          opacity: pressed ? 0.9 : disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text variant="bodySmall" style={{ color: variantStyles[variant].textColor, fontWeight: '600' }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function ScriptureCard({
  title,
  reference,
  text,
  translation,
}: {
  title?: string;
  reference?: string;
  text?: string;
  translation?: string;
}) {
  const theme = useAppTheme();

  return (
    <RNView style={[styles.scriptureCard, { borderColor: theme.colors.rule }]}>
      <RNView style={styles.scriptureHeader}>
        <EditorialLabel>Daily Scripture</EditorialLabel>
        <RNView style={styles.scriptureActions}>
          <IconButton name="bookmark-outline" accessibilityLabel="Save verse" onPress={() => undefined} />
          <IconButton name="share-social-outline" accessibilityLabel="Share verse" onPress={() => undefined} />
        </RNView>
      </RNView>

      {title ? (
        <Text variant="bodySmall" style={{ color: theme.colors.accent, marginBottom: 4 }}>
          {title}
        </Text>
      ) : null}

      <Text variant="scripture" style={styles.scriptureText}>
        {text ?? '“Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.”'}
      </Text>

      <Text variant="scriptureReference" style={{ color: theme.colors.textSecondary }}>
        {reference ?? 'Joshua 1:9'}{translation ? ` · ${translation}` : ''}
      </Text>
    </RNView>
  );
}

const stylesText: Record<TextVariant, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  displaySerif: {
    fontSize: 40,
    lineHeight: 47,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia' }),
  },
  heading: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  headingSerif: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia' }),
  },
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
  scripture: {
    fontSize: 28,
    lineHeight: 40,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia' }),
  },
  scriptureReference: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    position: 'relative',
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  editorialLabel: {
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    marginRight: 10,
  },
  button: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhost: {
    minHeight: 40,
    paddingVertical: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptureCard: {
    marginTop: 24,
    marginBottom: 26,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  scriptureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scriptureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scriptureText: {
    marginTop: 8,
  },
  progressTrack: {
    height: 10,
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export type RNTextProps = ComponentProps<typeof RNText>;
