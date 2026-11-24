import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ChartColors } from '@/constants/theme';

/** Tiny trend line with an end dot; no axes. For small multiples. */
export function Sparkline({ values, color = ChartColors.series[0], height = 32 }) {
  const [width, setWidth] = useState(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 5;
  const xFor = (index) => pad + (values.length <= 1 ? 0 : (index / (values.length - 1)) * (width - pad * 2));
  const yFor = (value) => pad + (1 - (value - min) / span) * (height - pad * 2);
  const path = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${xFor(index)},${yFor(value)}`).join(' ');

  return (
    <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && values.length > 0 ? (
        <Svg width={width} height={height}>
          <Path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={xFor(values.length - 1)} cy={yFor(values.at(-1))} r={4} fill={color} stroke={ChartColors.surface} strokeWidth={2} />
        </Svg>
      ) : null}
    </View>
  );
}
