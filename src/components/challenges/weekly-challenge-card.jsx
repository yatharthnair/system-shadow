import { Check, Hexagon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ProgressBar } from '@/components/common/progress-bar';
import { CATEGORY_ICONS } from '@/constants/quest-visuals';
import { BorderWidth, CategoryColors, Colors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { formatNumber } from '@/utils/format';

/** One weekly challenge: icon, goal, progress bar and reward. */
export function WeeklyChallengeCard({ challenge }) {
  const isComplete = Boolean(challenge.unlock);
  const { current, target } = challenge.progress;
  const Icon = challenge.category ? CATEGORY_ICONS[challenge.category] : Hexagon;
  const accent = challenge.category ? CategoryColors[challenge.category] : Colors.highlight;

  return (
    <View
      style={[styles.card, isComplete && styles.complete]}
      accessible
      accessibilityLabel={`${challenge.title}. ${challenge.description} ${isComplete ? 'Complete.' : `${current} of ${target}.`} Reward ${challenge.xpReward} XP.`}>
      <View style={[styles.icon, { borderColor: withAlpha(accent, 0.5), backgroundColor: withAlpha(accent, 0.12) }]}>
        {isComplete ? <Check size={20} color={Colors.success} strokeWidth={3} /> : <Icon size={20} color={accent} strokeWidth={1.75} />}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="heading" style={styles.title} numberOfLines={1}>
            {challenge.title}
          </AppText>
          <AppText variant="stat" color={isComplete ? 'success' : 'highlightLight'} style={styles.xp}>
            +{challenge.xpReward}
          </AppText>
        </View>
        <AppText variant="caption" color="textSecondary">
          {challenge.description}
        </AppText>
        <View style={styles.progressRow}>
          <View style={styles.bar}>
            <ProgressBar progress={current / target} />
          </View>
          <AppText variant="stat" color="textMuted" style={styles.count}>
            {formatNumber(current)}/{formatNumber(target)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  complete: { opacity: 0.75 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  title: { flex: 1 },
  xp: { fontSize: 15 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxs },
  bar: { flex: 1 },
  count: { fontSize: 13, minWidth: 56, textAlign: 'right' },
});
