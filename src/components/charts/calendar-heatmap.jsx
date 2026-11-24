import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ChartColors, Radius, Spacing } from '@/constants/theme';
import { getIsoWeekday, toIsoWeekKey } from '@/features/quests/quest-periods';

const WEEKDAY_LABELS = ['M', '', 'W', '', 'F', '', 'S'];

function colorFor(value, maxValue) {
  if (value <= 0) return ChartColors.sequential[0];
  const steps = ChartColors.sequential.length - 1;
  return ChartColors.sequential[Math.min(steps, Math.max(1, Math.ceil((value / Math.max(maxValue, 1)) * steps)))];
}

/**
 * Calendar heatmap: one column per ISO week, one row per weekday (Mon–Sun), sequential blue.
 * Tap a day to read it.
 *
 * @param {{ cells: Array<{ key: string, date: Date, value: number }>, describe: (cell) => string, summary: string }} props
 */
export function CalendarHeatmap({ cells, describe, summary }) {
  const [selected, setSelected] = useState(null);
  const maxValue = Math.max(...cells.map((cell) => cell.value), 1);

  const weeks = [];
  for (const cell of cells) {
    const weekKey = toIsoWeekKey(cell.date);
    if (weeks.at(-1)?.key !== weekKey) weeks.push({ key: weekKey, days: Array(7).fill(null) });
    weeks.at(-1).days[getIsoWeekday(cell.date) - 1] = cell;
  }
  const cellSize = weeks.length > 10 ? 12 : weeks.length > 4 ? 18 : 26;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <AppText variant="caption" color={selected ? 'textPrimary' : 'textMuted'} style={styles.readout}>
        {selected ? describe(selected) : 'Tap a day for details'}
      </AppText>
      <View style={styles.grid}>
        <View style={styles.labels}>
          {WEEKDAY_LABELS.map((label, index) => (
            <AppText key={index} variant="caption" color="textMuted" style={[styles.dayLabel, { height: cellSize }]}>
              {label}
            </AppText>
          ))}
        </View>
        {weeks.map((week) => (
          <View key={week.key} style={styles.week}>
            {week.days.map((cell, index) => (
              <Pressable
                key={index}
                disabled={!cell}
                onPress={() => setSelected(selected?.key === cell?.key ? null : cell)}
                hitSlop={2}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize },
                  cell ? { backgroundColor: colorFor(cell.value, maxValue) } : styles.empty,
                  cell && selected?.key === cell.key && styles.selected,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <AppText variant="caption" color="textMuted">
          Less
        </AppText>
        {ChartColors.sequential.map((color) => (
          <View key={color} style={[styles.legendCell, { backgroundColor: color }]} />
        ))}
        <AppText variant="caption" color="textMuted">
          More
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { marginBottom: Spacing.xs, minHeight: 16 },
  grid: { flexDirection: 'row', gap: 3 },
  labels: { gap: 3, marginRight: Spacing.xxs },
  dayLabel: { fontSize: 9, lineHeight: 12, textAlignVertical: 'center' },
  week: { gap: 3 },
  cell: { borderRadius: Radius.xs / 2 },
  empty: { backgroundColor: 'transparent' },
  selected: { borderWidth: 2, borderColor: ChartColors.series[0] },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, alignSelf: 'flex-end' },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});
