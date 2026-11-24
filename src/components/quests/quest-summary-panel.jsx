import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ProgressBar } from '@/components/common/progress-bar';
import { ProgressRing } from '@/components/common/progress-ring';
import { Spacing } from '@/constants/theme';
import { useQuestStore } from '@/store/quest-store';
import { formatNumber } from '@/utils/format';

function GroupProgress({ label, completed, total }) {
  if (total === 0) return null;
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
        <AppText variant="stat" color="textSecondary" style={styles.groupCount}>
          {completed}/{total}
        </AppText>
      </View>
      <ProgressBar progress={completed / total} accessibilityLabel={`${label} quests progress`} />
    </View>
  );
}

/** Ring for overall progress plus per-cadence bars and XP earned / still available. */
export function QuestSummaryPanel({ entranceIndex }) {
  const summary = useQuestStore((state) => state.summary);
  const { overall } = summary;

  return (
    <GlowPanel highlighted entranceIndex={entranceIndex} style={styles.panel}>
      <ProgressRing
        progress={overall.progress}
        size={104}
        accessibilityLabel={`${overall.completed} of ${overall.total} quests complete`}>
        <AppText variant="title">
          {overall.completed}
          <AppText variant="heading" color="textMuted">
            /{overall.total}
          </AppText>
        </AppText>
        <AppText variant="label" color="textMuted" style={styles.ringCaption}>
          Cleared
        </AppText>
      </ProgressRing>

      <View style={styles.details}>
        <GroupProgress label="Daily" {...summary.daily} />
        <GroupProgress label="Weekly" {...summary.weekly} />
        <GroupProgress label="Custom" {...summary.custom} />
        <View style={styles.xpRow}>
          <AppText variant="caption" color="success">
            +{formatNumber(summary.xpEarned)} XP earned
          </AppText>
          <AppText variant="caption" color="textMuted">
            {formatNumber(summary.xpAvailable)} left
          </AppText>
        </View>
      </View>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  ringCaption: { fontSize: 9, letterSpacing: 1.6 },
  details: { flex: 1, gap: Spacing.sm },
  group: { gap: Spacing.xs },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  groupCount: { fontSize: 13, lineHeight: 15 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xxs },
});
