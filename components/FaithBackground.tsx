import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

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

const grainDots = [
  { x: 9, y: 7, r: 0.7, o: 0.48 },
  { x: 22, y: 18, r: 0.45, o: 0.34 },
  { x: 39, y: 10, r: 0.55, o: 0.3 },
  { x: 56, y: 24, r: 0.65, o: 0.36 },
  { x: 74, y: 13, r: 0.4, o: 0.26 },
  { x: 88, y: 34, r: 0.58, o: 0.34 },
  { x: 15, y: 42, r: 0.5, o: 0.32 },
  { x: 32, y: 57, r: 0.72, o: 0.38 },
  { x: 49, y: 47, r: 0.42, o: 0.26 },
  { x: 68, y: 62, r: 0.55, o: 0.34 },
  { x: 83, y: 52, r: 0.45, o: 0.28 },
  { x: 93, y: 73, r: 0.68, o: 0.36 },
  { x: 6, y: 82, r: 0.52, o: 0.28 },
  { x: 27, y: 91, r: 0.4, o: 0.25 },
  { x: 44, y: 78, r: 0.62, o: 0.34 },
  { x: 61, y: 88, r: 0.48, o: 0.27 },
  { x: 79, y: 84, r: 0.52, o: 0.31 },
];

function PaperTexture({
  fiberColor,
  grainColor,
  marginColor,
  opacity,
}: {
  fiberColor: string;
  grainColor: string;
  marginColor: string;
  opacity: number;
}) {
  return (
    <Svg
      accessibilityElementsHidden
      height="100%"
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      width="100%"
    >
      <G opacity={opacity}>
        <Rect x="0" y="0" width="100" height="100" fill="none" />
        <G>
          {grainDots.map((dot) => (
            <Circle
              key={`${dot.x}-${dot.y}`}
              cx={dot.x}
              cy={dot.y}
              fill={grainColor}
              opacity={dot.o}
              r={dot.r}
            />
          ))}
        </G>
        <G opacity={0.64}>
          <Path d="M-2 17 C19 15 35 18 54 16 C72 14 87 16 102 13" fill="none" stroke={fiberColor} strokeLinecap="round" strokeWidth={0.22} />
          <Path d="M-4 38 C17 41 28 35 45 38 C63 42 77 36 104 40" fill="none" stroke={fiberColor} strokeLinecap="round" strokeWidth={0.18} />
          <Path d="M-3 69 C18 66 35 72 55 69 C72 66 86 70 103 67" fill="none" stroke={fiberColor} strokeLinecap="round" strokeWidth={0.2} />
          <Path d="M7 -2 C9 17 7 34 10 52 C13 70 9 84 12 102" fill="none" stroke={fiberColor} strokeLinecap="round" strokeWidth={0.16} />
          <Path d="M88 -2 C86 20 90 39 87 61 C85 76 89 88 86 102" fill="none" stroke={fiberColor} strokeLinecap="round" strokeWidth={0.14} />
        </G>
        <G opacity={0.52}>
          <Line x1="12" y1="0" x2="12" y2="100" stroke={marginColor} strokeWidth={0.16} />
          <Line x1="88" y1="0" x2="88" y2="100" stroke={marginColor} strokeWidth={0.1} />
          <Circle cx="12" cy="18" fill={marginColor} r="0.42" />
          <Circle cx="12" cy="49" fill={marginColor} r="0.36" />
          <Circle cx="12" cy="81" fill={marginColor} r="0.42" />
        </G>
      </G>
    </Svg>
  );
}

export function FaithBackground() {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDark = theme.mode === 'dark';
  const doveColor = withAlpha(isDark ? theme.colors.text : theme.colors.accent, isDark ? 0.09 : 0.08);
  const markColor = withAlpha(theme.colors.rule, isDark ? 0.12 : 0.18);
  const fiberColor = withAlpha(isDark ? theme.colors.textSecondary : theme.colors.text, isDark ? 0.11 : 0.08);
  const grainColor = withAlpha(isDark ? theme.colors.text : theme.colors.accent, isDark ? 0.1 : 0.11);
  const marginColor = withAlpha(theme.colors.rule, isDark ? 0.26 : 0.28);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.background}
    >
      <PaperTexture
        fiberColor={fiberColor}
        grainColor={grainColor}
        marginColor={marginColor}
        opacity={isDark ? 0.5 : 0.72}
      />
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
