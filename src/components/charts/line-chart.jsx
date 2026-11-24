import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/common/app-text';
import { ChartColors, Colors, FontFamily, Spacing } from '@/constants/theme';

import { formatAxisValue, getNiceTicks } from './chart-scales';

const AXIS_GUTTER = 34;
const X_LABEL_HEIGHT = 18;
const TOP_PAD = 8;

/**
 * Single-series line with a 10% area wash, end dot, and a press-and-drag crosshair readout.
 * Null values leave a gap (e.g. days with no scheduled quests).
 *
 * @param {{ points: Array<{ key: string, xLabel: string, value: number | null }>, color?: string, height?: number,
 *   yMax?: number, formatValue?: (value: number) => string, describe: (point | null) => string }} props
 */
export function LineChart({ points, color = ChartColors.series[0], height = 140, yMax, yMin = 0, formatValue = formatAxisValue, describe }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);

  const values = points.map((point) => point.value).filter((value) => value != null);
  const ticks = yMax != null ? [yMin, (yMin + yMax) / 2, yMax] : getNiceTicks(Math.max(...values, 0));
  const top = ticks.at(-1);
  const bottom = ticks[0];
  const plotHeight = height - X_LABEL_HEIGHT;
  const plotWidth = Math.max(0, width - AXIS_GUTTER - 6);
  const xFor = (index) => AXIS_GUTTER + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const yFor = (value) => TOP_PAD + (1 - (value - bottom) / (top - bottom || 1)) * (plotHeight - TOP_PAD);

  // Build line + wash paths, breaking at null values.
  let linePath = '';
  let areaPath = '';
  let runStart = null;
  points.forEach((point, index) => {
    if (point.value == null) {
      if (runStart != null) areaPath += ` L${xFor(index - 1)},${plotHeight} L${xFor(runStart)},${plotHeight} Z`;
      runStart = null;
      return;
    }
    const command = runStart == null ? 'M' : 'L';
    linePath += `${command}${xFor(index)},${yFor(point.value)} `;
    areaPath += `${command}${xFor(index)},${yFor(point.value)} `;
    if (runStart == null) runStart = index;
    if (index === points.length - 1) areaPath += ` L${xFor(index)},${plotHeight} L${xFor(runStart)},${plotHeight} Z`;
  });

  const lastIndex = points.map((point) => point.value != null).lastIndexOf(true);
  const focusIndex = activeIndex ?? null;
  const focusPoint = focusIndex != null ? points[focusIndex] : null;

  const indexFromX = (locationX) => {
    if (points.length <= 1 || plotWidth <= 0) return 0;
    const ratio = (locationX - AXIS_GUTTER) / plotWidth;
    return Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1))));
  };
  const labelIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <View>
      <AppText variant="caption" color={focusPoint ? 'textPrimary' : 'textMuted'} style={styles.readout} numberOfLines={1}>
        {focusPoint ? describe(focusPoint) : 'Press and drag to inspect'}
      </AppText>
      <View
        style={{ height }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setActiveIndex(indexFromX(event.nativeEvent.locationX))}
        onResponderMove={(event) => setActiveIndex(indexFromX(event.nativeEvent.locationX))}
        onResponderRelease={() => setActiveIndex(null)}
        onResponderTerminate={() => setActiveIndex(null)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={describe(null)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {ticks.map((tick) => (
              <G key={tick}>
                <Line x1={AXIS_GUTTER} x2={width} y1={yFor(tick)} y2={yFor(tick)} stroke={ChartColors.grid} strokeWidth={StyleSheet.hairlineWidth} />
                <SvgText x={AXIS_GUTTER - 6} y={yFor(tick) + 3} fontSize={10} fontFamily={FontFamily.displaySemiBold} fill={Colors.textMuted} textAnchor="end">
                  {formatValue(tick)}
                </SvgText>
              </G>
            ))}
            {areaPath ? <Path d={areaPath} fill={color} opacity={0.1} /> : null}
            {linePath ? <Path d={linePath} stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" /> : null}
            {lastIndex >= 0 && focusIndex == null ? (
              <Circle cx={xFor(lastIndex)} cy={yFor(points[lastIndex].value)} r={4} fill={color} stroke={ChartColors.surface} strokeWidth={2} />
            ) : null}
            {focusPoint ? (
              <G>
                <Line x1={xFor(focusIndex)} x2={xFor(focusIndex)} y1={TOP_PAD} y2={plotHeight} stroke={Colors.textMuted} strokeWidth={1} />
                {focusPoint.value != null ? (
                  <Circle cx={xFor(focusIndex)} cy={yFor(focusPoint.value)} r={5} fill={color} stroke={ChartColors.surface} strokeWidth={2} />
                ) : null}
              </G>
            ) : null}
            {[...new Set(labelIndexes)].map((index) => (
              <SvgText
                key={points[index]?.key ?? index}
                x={xFor(index)}
                y={height - 4}
                fontSize={10}
                fontFamily={FontFamily.displaySemiBold}
                fill={Colors.textMuted}
                textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}>
                {points[index]?.xLabel}
              </SvgText>
            ))}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { marginBottom: Spacing.xs, minHeight: 16 },
});
