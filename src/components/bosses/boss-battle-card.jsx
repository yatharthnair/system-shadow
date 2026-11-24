import { Check, Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { CATEGORY_ICONS } from '@/constants/quest-visuals';
import { BOSS_ICON } from '@/constants/reward-visuals';
import { BorderWidth, BossColors, CategoryColors, Colors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { CATEGORIES_BY_KEY } from '@/features/quests/quest-config';
import { formatNumber } from '@/utils/format';

import { BossHpBar } from './boss-hp-bar';

function WeaknessChip({ category }) {
  if (!category) {
    return (
      <AppText variant="caption" color="textMuted">
        No weakness
      </AppText>
    );
  }
  const Icon = CATEGORY_ICONS[category];
  const color = CategoryColors[category];
  return (
    <View style={[styles.weakness, { borderColor: withAlpha(color, 0.5), backgroundColor: withAlpha(color, 0.12) }]}>
      <Icon size={12} color={color} strokeWidth={2} />
      <AppText variant="label" style={[styles.weaknessLabel, { color }]}>
        Weak to {CATEGORIES_BY_KEY[category].label} · 1.5×
      </AppText>
    </View>
  );
}

function MilestoneStep({ milestone }) {
  const isReached = Boolean(milestone.unlock);
  return (
    <View style={styles.step}>
      <View style={[styles.stepDot, isReached && styles.stepDotReached]}>
        {isReached ? <Check size={12} color={Colors.textOnAccent} strokeWidth={3} /> : <Lock size={10} color={Colors.textMuted} />}
      </View>
      <AppText variant="label" color={isReached ? 'textPrimary' : 'textMuted'} style={styles.stepLabel}>
        {milestone.milestone === 100 ? 'Defeat' : `${milestone.milestone}%`}
      </AppText>
      <AppText variant="caption" color={isReached ? 'success' : 'textMuted'}>
        +{milestone.xp}
      </AppText>
    </View>
  );
}

/** The active boss: identity, weakness, HP bar with milestone ticks, and milestone rewards. */
export function BossBattleCard({ boss, entranceIndex }) {
  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.portrait}>
          <BOSS_ICON size={30} color={BossColors.primary} strokeWidth={1.5} />
        </View>
        <View style={styles.identity}>
          <AppText variant="label" style={{ color: BossColors.primary }}>
            {boss.epithet}
          </AppText>
          <AppText variant="title">{boss.name}</AppText>
          <WeaknessChip category={boss.weakness} />
        </View>
      </View>

      <AppText variant="body" color="textSecondary" style={styles.lore}>
        {boss.lore}
      </AppText>

      <View style={styles.hp}>
        <View style={styles.hpHeader}>
          <AppText variant="label" color="textMuted">
            HP
          </AppText>
          <AppText variant="stat" style={styles.hpValue}>
            {formatNumber(boss.hpRemaining)}
            <AppText variant="caption" color="textMuted">{` / ${formatNumber(boss.hp)}`}</AppText>
          </AppText>
        </View>
        <BossHpBar progress={boss.progress} accessibilityLabel={`${boss.name} HP remaining`} />
        <AppText variant="caption" color="textMuted">
          Clear quests to deal damage equal to their XP.
        </AppText>
      </View>

      <View style={styles.steps}>
        {boss.milestones.map((milestone) => (
          <MilestoneStep key={milestone.milestone} milestone={milestone} />
        ))}
      </View>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.lg, borderColor: withAlpha(BossColors.primary, 0.45), boxShadow: `0 0 18px 0 ${withAlpha(BossColors.primary, 0.18)}` },
  header: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'center' },
  portrait: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidth.thin,
    borderColor: withAlpha(BossColors.primary, 0.5),
    backgroundColor: withAlpha(BossColors.primary, 0.1),
  },
  identity: { flex: 1, gap: Spacing.xxs },
  weakness: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: BorderWidth.thin,
  },
  weaknessLabel: { fontSize: 10, letterSpacing: 1 },
  lore: { fontStyle: 'italic' },
  hp: { gap: Spacing.sm },
  hpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  hpValue: { fontSize: 18 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { alignItems: 'center', gap: Spacing.xxs, flex: 1 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  stepDotReached: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  stepLabel: { fontSize: 10 },
});
