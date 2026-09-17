import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

function withAlpha(hex: string, opacity: number) {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function PageMarks({ color }: { color: string }) {
  return (
    <View style={styles.pageMarks}>
      {Array.from({ length: 7 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.pageMark,
            {
              backgroundColor: color,
              left: `${7 + index * 15}%`,
              top: `${11 + (index % 3) * 28}%`,
              transform: [{ rotate: index % 2 === 0 ? '-12deg' : '9deg' }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function FaithBackground() {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDark = theme.mode === 'dark';
  const doveColor = withAlpha(isDark ? theme.colors.text : theme.colors.accent, isDark ? 0.09 : 0.08);
  const markColor = withAlpha(theme.colors.rule, isDark ? 0.12 : 0.18);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.background}
    >
      <PageMarks color={markColor} />
      <FontAwesome5
        name="dove"
        size={96}
        color={doveColor}
        style={[styles.topDove, { right: -width * 0.03 }]}
      />
      <FontAwesome5
        name="dove"
        size={58}
        color={doveColor}
        style={[styles.lowerDove, { right: width * 0.04, top: height * 0.7 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  pageMarks: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pageMark: {
    position: 'absolute',
    width: StyleSheet.hairlineWidth,
    height: 128,
  },
  topDove: {
    position: 'absolute',
    top: 192,
    transform: [{ rotate: '-10deg' }],
  },
  lowerDove: {
    position: 'absolute',
    opacity: 0.62,
    transform: [{ rotate: '8deg' }],
  },
});
