import { Text } from '@/components/ui';
import type { ComponentProps } from 'react';

export function MonoText(props: ComponentProps<typeof Text>) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}
