import { StyleSheet, View } from 'react-native';

import { OliveBranchVector } from '@/components/OliveBranchVector';
import { useAppTheme } from '@/hooks/useAppTheme';

type BrandMarkProps = {
  size?: 'small' | 'medium' | 'large';
};

const sizeMap = {
  small: { width: 62, height: 34 },
  medium: { width: 82, height: 46 },
  large: { width: 108, height: 60 },
} as const;

export function BrandMark({ size = 'medium' }: BrandMarkProps) {
  const theme = useAppTheme();
  const metrics = sizeMap[size];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.wrap, { width: metrics.width, height: metrics.height }]}
    >
      <OliveBranchVector color={theme.colors.accent} height={metrics.height} width={metrics.width} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    opacity: 0.95,
  },
});
