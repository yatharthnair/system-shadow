import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ProgressBar } from '@/components/common/progress-bar';
import { ACHIEVEMENT_GROUP_ICONS } from '@/constants/reward-visuals';
import { BorderWidth, Colors, Radius, Spacing, TierColors, withAlpha } from '@/constants/theme';
import { REWARD_TIERS } from '@/features/rewards/reward-tiers';
import { formatDayHeading } from '@/utils/format';

/** One achievement. Static (no per-tile animation) so long grids stay cheap to render. */
export const AchievementTile = memo(function AchievementTile({ achievement }) {
  const isUnlocked = Boolean(achievement.unlockedAt);
  const color = TierColors[achievement.tier];
  const Icon = isUnlocked || !achievement.isSecret ? ACHIEVEMENT_GROUP_ICONS[achievement.group] : Lock;
  const { current, target } = achievement.progress;

  return (
    <View
      style={[styles.tile, isUnlocked ? { borderColor: withAlpha(color, 0.6), boxShadow: `0 0 12px 0 ${withAlpha(color, 0.18)}` } : styles.locked]}
      accessible
      accessibilityLabel={`${achievement.title}. ${achievement.description} ${isUnlocked ? 'Unlocked.' : `${current} of ${target}.`}`}>
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: isUnlocked ? color : Colors.border, backgroundColor: isUnlocked ? withAlpha(color, 0.15) : Colors.surfaceRaised }]}>
          <Icon size={16} color={isUnlocked ? color : Colors.textMuted} strokeWidth={1.75} />
        </View>
        <AppText variant="label" style={[styles.tier, { color: isUnlocked ? color : Colors.textMuted }]}>
          {REWARD_TIERS[achievement.tier].label}
        </AppText>
      </View>
      <AppText variant="heading" numberOfLines={2} color={isUnlocked ? 'textPrimary' : 'textSecondary'} style={styles.title}>
        {achievement.title}
      </AppText>
      <AppText variant="caption" color="textMuted" numberOfLines={3}>
        {achievement.description}
      </AppText>
      <View style={styles.footer}>
        {isUnlocked ? (
          <AppText variant="caption" color="success">
            {formatDayHeading(new Date(achievement.unlockedAt))}
          </AppText>
        ) : achievement.isSecret ? null : (
          <>
            <ProgressBar progress={current / target} />
            <AppText variant="caption" color="textMuted" style={styles.count}>
              {current}/{target}
            </AppText>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  locked: { opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tier: { fontSize: 9, letterSpacing: 1.4 },
  title: { fontSize: 16, lineHeight: 19 },
  footer: { marginTop: 'auto', paddingTop: Spacing.xs, gap: Spacing.xxs },
  count: { alignSelf: 'flex-end', fontVariant: ['tabular-nums'] },
});
