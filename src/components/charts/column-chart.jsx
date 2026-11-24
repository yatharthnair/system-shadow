import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/common/app-text';
import { ChartColors, Colors, FontFamily, Spacing } from '@/constants/theme';

import { columnPath, formatAxisValue, getNiceTicks } from './chart-scales';

const AXIS_GUTTER = 34;
const X_LABEL_HEIGHT = 18;
const MAX_BAR_WIDTH = 24;
const SEGMENT_GAP = 2;

/**
 * Column chart, optionally stacked. Tap a column to read its values; other columns dim.
 *
 * @param {{
 *   data: Array<{ key: string, xLabel: string, isPartial?: boolean, values: Record<string, number> }>,
 *   series: Array<{ key: string, label: string, color: string }>,
 *   height?: number,
 *   formatValue?: (value: number) => string,
 *   describe: (point) => string,
 * }} props `describe` produces the readout / accessibility text for a column.
 */
export function ColumnChart({ data, series, height = 150, formatValue = formatAxisValue, describe }) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const totals = data.map((point) => series.reduce((sum, item) => sum + (point.values[item.key] ?? 0), 0));
  const ticks = getNiceTicks(Math.max(...totals, 0));
  const maxTick = ticks.at(-1);
  const plotHeight = height - X_LABEL_HEIGHT;
  const plotWidth = Math.max(0, width - AXIS_GUTTER);
  const slotWidth = data.length ? plotWidth / data.length : 0;
  const barWidth = Math.max(2, Math.min(MAX_BAR_WIDTH, slotWidth - SEGMENT_GAP));
  const scale = (value) => (value / maxTick) * (plotHeight - 4);
  const labelIndexes = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
  const selected = selectedIndex == null ? null : data[selectedIndex];

  return (
    <View>
      <AppText variant="caption" color={selected ? 'textPrimary' : 'textMuted'} style={styles.readout} numberOfLines={1}>
        {selected ? describe(selected) : 'Tap a column for details'}
      </AppText>
      <View
        style={{ height }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={describe({ key: 'summary', values: {}, summary: true })}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {ticks.map((tick) => {
              const y = plotHeight - scale(tick);
              return (
                <G key={tick}>
                  <Line x1={AXIS_GUTTER} x2={width} y1={y} y2={y} stroke={ChartColors.grid} strokeWidth={StyleSheet.hairlineWidth} />
                  <SvgText x={AXIS_GUTTER - 6} y={y + 3} fontSize={10} fontFamily={FontFamily.displaySemiBold} fill={Colors.textMuted} textAnchor="end">
                    {formatValue(tick)}
                  </SvgText>
                </G>
              );
            })}

            {data.map((point, index) => {
              const x = AXIS_GUTTER + index * slotWidth + (slotWidth - barWidth) / 2;
              const opacity = selectedIndex == null || selectedIndex === index ? (point.isPartial ? 0.6 : 1) : 0.35;
              let baseline = plotHeight;
              const visible = series.filter((item) => (point.values[item.key] ?? 0) > 0);
              return (
                <G key={point.key} opacity={opacity}>
                  {visible.map((item, segmentIndex) => {
                    const segmentHeight = scale(point.values[item.key]);
                    const gap = segmentIndex > 0 ? SEGMENT_GAP : 0;
                    const top = baseline - segmentHeight;
                    const isTop = segmentIndex === visible.length - 1;
                    const drawHeight = Math.max(0, segmentHeight - gap);
                    const path = isTop
                      ? columnPath(x, top, barWidth, drawHeight)
                      : `M${x},${baseline - gap} V${top} H${x + barWidth} V${baseline - gap} Z`;
                    baseline = top;
                    return drawHeight > 0 ? <Path key={item.key} d={path} fill={item.color} /> : null;
                  })}
                  {labelIndexes.has(index) ? (
                    <SvgText
                      x={x + barWidth / 2}
                      y={height - 4}
                      fontSize={10}
                      fontFamily={FontFamily.displaySemiBold}
                      fill={Colors.textMuted}
                      textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}>
                      {point.xLabel}
                    </SvgText>
                  ) : null}
                  {/* Hit target: the whole slot, taller and wider than the mark. */}
                  <Rect
                    x={AXIS_GUTTER + index * slotWidth}
                    y={0}
                    width={slotWidth}
                    height={plotHeight}
                    fill="transparent"
                    onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                  />
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { marginBottom: Spacing.xs, minHeight: 16 },
});
