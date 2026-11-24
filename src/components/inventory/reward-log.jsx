import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { StatusChip } from '@/components/common/status-chip';
import { Colors, Spacing } from '@/constants/theme';
import { formatDayHeading, formatNumber } from '@/utils/format';

const KIND_LABELS = {
  achievement: 'Achievement',
  challenge: 'Weekly challenge',
  boss_milestone: 'Boss battle',
  level_milestone: 'Level milestone',
};

/** Recently granted rewards, including any revoked by an undo. */
export function RewardLog({ rewards }) {
  if (rewards.length === 0) {
    return (
      <AppText variant="body" color="textMuted">
        Rewards you earn will be recorded here.
      </AppText>
    );
  }
  return (
    <GlowPanel style={styles.panel}>
      {rewards.map((reward, index) => {
        const isRevoked = Boolean(reward.revokedAt);
        return (
          <View key={reward.id} style={[styles.row, index < rewards.length - 1 && styles.divider, isRevoked && styles.revoked]}>
            <View style={styles.text}>
              <AppText variant="bodyStrong" numberOfLines={1} style={isRevoked && styles.strike}>
                {reward.title}
              </AppText>
              <AppText variant="caption" color="textMuted">
                {KIND_LABELS[reward.kind]} · {formatDayHeading(new Date(reward.unlockedAt))}
              </AppText>
            </View>
            {isRevoked ? (
              <StatusChip label="Revoked" tone="muted" />
            ) : reward.xpReward > 0 ? (
              <AppText variant="stat" color="success" style={styles.xp}>
                +{formatNumber(reward.xpReward)}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divider: { paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  revoked: { opacity: 0.5 },
  text: { flex: 1, gap: Spacing.xxs },
  strike: { textDecorationLine: 'line-through' },
  xp: { fontSize: 15 },
});
