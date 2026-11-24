import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { Colors, Spacing } from '@/constants/theme';

function Legend({ series }) {
  return (
    <View style={styles.legend}>
      {series.map((item) => (
        <View key={item.key} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <AppText variant="caption" color="textSecondary">
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function DataTable({ columns, rows }) {
  return (
    <View style={styles.table} accessibilityRole="list">
      <View style={styles.tableRow}>
        {columns.map((column, index) => (
          <AppText key={column} variant="label" color="textMuted" style={[styles.tableCell, index > 0 && styles.numeric]}>
            {column}
          </AppText>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row.key} style={styles.tableRow}>
          {row.cells.map((cell, index) => (
            <AppText key={index} variant="caption" color="textSecondary" style={[styles.tableCell, index > 0 && styles.numeric]}>
              {cell}
            </AppText>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * A titled chart panel with a headline, optional legend (always shown for 2+ series), and a
 * Chart/Table toggle so every value is available without relying on the graphic.
 */
export function ChartCard({ title, headline, caption, series, table, entranceIndex, children }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText variant="label" color="textSecondary">
            {title}
          </AppText>
          {headline ? <AppText variant="title">{headline}</AppText> : null}
          {caption ? (
            <AppText variant="caption" color="textMuted">
              {caption}
            </AppText>
          ) : null}
        </View>
        {table ? (
          <Pressable onPress={() => setShowTable((current) => !current)} hitSlop={10} accessibilityRole="button" accessibilityLabel={showTable ? 'Show chart' : 'Show as table'}>
            <AppText variant="label" color="highlight" style={styles.toggle}>
              {showTable ? 'Chart' : 'Table'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {series && series.length >= 2 ? <Legend series={series} /> : null}
      {showTable && table ? <DataTable columns={table.columns} rows={table.rows} /> : children}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  titleBlock: { flex: 1, gap: Spacing.xxs },
  toggle: { fontSize: 10 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  table: { gap: Spacing.xs },
  tableRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  tableCell: { flex: 1 },
  numeric: { textAlign: 'right', fontVariant: ['tabular-nums'] },
});
