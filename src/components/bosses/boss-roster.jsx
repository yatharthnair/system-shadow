import { Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { StatusChip } from '@/components/common/status-chip';
import { BOSS_ICON } from '@/constants/reward-visuals';
import { BossColors, Colors, Spacing } from '@/constants/theme';
import { formatDayHeading, formatNumber } from '@/utils/format';

/** Every boss in order: defeated (with date), active, or locked (hidden until reached). */
export function BossRoster({ bosses, entranceIndex }) {
  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      {bosses.map((boss, index) => {
        const isLocked = boss.status === 'locked';
        return (
          <View key={boss.id} style={[styles.row, index < bosses.length - 1 && styles.divider, isLocked && styles.locked]}>
            {isLocked ? (
              <Lock size={18} color={Colors.textMuted} />
            ) : (
              <BOSS_ICON size={18} color={boss.status === 'defeated' ? Colors.textMuted : BossColors.primary} />
            )}
            <View style={styles.text}>
              <AppText variant="bodyStrong" color={boss.status === 'defeated' ? 'textSecondary' : 'textPrimary'}>
                {isLocked ? `Gate ${index + 1} · ???` : boss.name}
              </AppText>
              <AppText variant="caption" color="textMuted">
                {boss.status === 'defeated' && boss.defeatedAt
                  ? `Defeated ${formatDayHeading(new Date(boss.defeatedAt))}`
                  : `${formatNumber(boss.hp)} HP`}
              </AppText>
            </View>
            {boss.status === 'active' ? <StatusChip label="Active" /> : null}
            {boss.status === 'defeated' ? <StatusChip label="Cleared" tone="muted" /> : null}
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
  locked: { opacity: 0.55 },
  text: { flex: 1, gap: Spacing.xxs },
});
