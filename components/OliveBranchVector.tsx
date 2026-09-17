import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

type OliveBranchVectorProps = {
  color: string;
  height?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  width?: number;
};

const leaves = [
  { x: 34, y: 78, angle: -96, scale: 0.62 },
  { x: 47, y: 68, angle: 24, scale: 0.54 },
  { x: 64, y: 55, angle: -86, scale: 0.76 },
  { x: 81, y: 44, angle: 20, scale: 0.66 },
  { x: 101, y: 31, angle: -76, scale: 0.76 },
  { x: 122, y: 20, angle: 18, scale: 0.58 },
];

const leafPath = 'M0 0 C13 -17 35 -22 50 -10 C36 5 11 7 0 0 Z';

export function OliveBranchVector({
  color,
  height = 86,
  opacity = 1,
  style,
  width = 180,
}: OliveBranchVectorProps) {
  return (
    <Svg
      accessibilityElementsHidden
      height={height}
      importantForAccessibility="no-hide-descendants"
      style={style}
      viewBox="0 0 180 100"
      width={width}
    >
      <G opacity={opacity}>
        <Path
          d="M14 88 C42 70 61 53 84 38 C108 23 132 13 164 8"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={2.8}
        />
        {leaves.map((leaf) => (
          <G key={`${leaf.x}-${leaf.y}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle}) scale(${leaf.scale})`}>
            <Path d={leafPath} fill={color} />
          </G>
        ))}
        <Circle cx={68} cy={52} fill={color} r={5.2} />
        <Circle cx={82} cy={46} fill={color} r={4.4} />
      </G>
    </Svg>
  );
}
