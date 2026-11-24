import { SectionList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { StatusChip } from '@/components/common/status-chip';
import { Colors, ComponentTokens, Spacing } from '@/constants/theme';
import { formatDayHeading, formatNumber, formatTimeOfDay } from '@/utils/format';
import { toLocalDateKey } from '@/features/quests/quest-periods';

import { CategoryIconTile } from './category-icon-tile';
import { QuestEmptyState } from './quest-empty-state';

/** Groups history entries by the local day they were completed, newest first. */
function groupEntriesByDay(entries) {
  const sections = [];
  for (const entry of entries) {
    const completedAt = new Date(entry.completedAt);
    const dayKey = toLocalDateKey(completedAt);
    let section = sections.at(-1);
    if (!section || section.key !== dayKey) {
      section = { key: dayKey, title: formatDayHeading(completedAt), data: [] };
      sections.push(section);
    }
    section.data.push(entry);
  }
  return sections;
}

function HistoryRow({ entry }) {
  const isUndone = Boolean(entry.undoneAt);
  return (
    <View
      style={[styles.row, isUndone && styles.rowUndone]}
      accessible
      accessibilityLabel={`${entry.questTitle}, ${isUndone ? 'undone' : `${entry.xpAwarded} XP`}, ${formatTimeOfDay(new Date(entry.completedAt))}`}>
      <CategoryIconTile category={entry.category} size={36} />
      <View style={styles.rowText}>
        <AppText variant="bodyStrong" numberOfLines={1} style={isUndone && styles.strike}>
          {entry.questTitle}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {formatTimeOfDay(new Date(entry.completedAt))}
        </AppText>
      </View>
      {isUndone ? (
        <StatusChip label="Undone" tone="muted" />
      ) : (
        <AppText variant="stat" color="success" style={styles.xp}>
          +{entry.xpAwarded}
        </AppText>
      )}
    </View>
  );
}

/** Quest log: lifetime totals, then completions grouped by day. */
export function QuestHistoryList({ entries, totals }) {
  return (
    <SectionList
      sections={groupEntriesByDay(entries)}
      keyExtractor={(entry) => entry.id}
      renderItem={({ item }) => <HistoryRow entry={item} />}
      renderSectionHeader={({ section }) => (
        <AppText variant="label" color="textSecondary" style={styles.sectionHeader}>
          {section.title}
        </AppText>
      )}
      ListHeaderComponent={
        <GlowPanel highlighted style={styles.totals}>
          <View style={styles.total}>
            <AppText variant="label" color="textMuted">
              Quests cleared
            </AppText>
            <AppText variant="display">{formatNumber(totals.completedCount)}</AppText>
          </View>
          <View style={styles.total}>
            <AppText variant="label" color="textMuted">
              XP from quests
            </AppText>
            <AppText variant="display" color="highlightLight">
              {formatNumber(totals.xpTotal)}
            </AppText>
          </View>
        </GlowPanel>
      }
      ListEmptyComponent={
        <QuestEmptyState title="No entries yet" message="Completed quests will be recorded here." />
      }
      stickySectionHeadersEnabled
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: Colors.background },
  content: { padding: ComponentTokens.screen.horizontalPadding, gap: Spacing.xs, paddingBottom: Spacing.xxxl },
  totals: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  total: { alignItems: 'center', gap: Spacing.xs },
  sectionHeader: { paddingVertical: Spacing.sm, backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowUndone: { opacity: 0.5 },
  rowText: { flex: 1, gap: Spacing.xxs },
  strike: { textDecorationLine: 'line-through' },
  xp: { fontSize: 16 },
});
