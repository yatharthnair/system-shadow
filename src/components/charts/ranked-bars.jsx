import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ChartColors, Radius, Spacing } from '@/constants/theme';

/**
 * Horizontal bars sorted by value, one hue (magnitude, not identity). Each row's icon and label
 * carry identity; the value sits at the bar tip.
 *
 * @param {{ rows: Array<{ key: string, label: string, Icon?: any, iconColor?: string, value: number, valueLabel: string }> }} props
 */
export function RankedBars({ rows }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row} accessible accessibilityLabel={`${row.label}: ${row.valueLabel}`}>
          <View style={styles.labelCell}>
            {row.Icon ? <row.Icon size={14} color={row.iconColor} strokeWidth={2} /> : null}
            <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.label}>
              {row.label}
            </AppText>
          </View>
          <View style={styles.barCell}>
            {row.value > 0 ? <View style={[styles.bar, { width: `${(row.value / maxValue) * 100}%` }]} /> : null}
            <AppText variant="caption" color={row.value > 0 ? 'textPrimary' : 'textMuted'} style={styles.value}>
              {row.valueLabel}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  labelCell: { width: 112, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  label: { flex: 1 },
  barCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  bar: { height: 10, maxWidth: '75%', borderTopRightRadius: Radius.xs, borderBottomRightRadius: Radius.xs, backgroundColor: ChartColors.series[0] },
  value: { fontVariant: ['tabular-nums'] },
});
