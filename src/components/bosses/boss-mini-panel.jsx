import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ScalePressable } from '@/components/common/scale-pressable';
import { BOSS_ICON } from '@/constants/reward-visuals';
import { BossColors, Colors, Spacing } from '@/constants/theme';
import { useRewardStore } from '@/store/reward-store';
import { formatNumber } from '@/utils/format';

import { BossHpBar } from './boss-hp-bar';

/** Dashboard summary of the active boss and this week's challenges. Opens the Trials tab. */
export function BossMiniPanel({ entranceIndex }) {
  const overview = useRewardStore((state) => state.overview);
  if (!overview) return null;

  const boss = overview.activeBoss;
  const challengesDone = overview.challenges.filter((challenge) => challenge.unlock).length;

  return (
    <GlowPanel entranceIndex={entranceIndex}>
      <ScalePressable
        onPress={() => router.navigate('/challenges')}
        haptic="none"
        style={styles.content}
        accessibilityRole="button"
        accessibilityLabel={boss ? `${boss.name}, ${formatNumber(boss.hpRemaining)} HP left. Open trials.` : 'All bosses defeated. Open trials.'}>
        <View style={styles.header}>
          <BOSS_ICON size={18} color={BossColors.primary} />
          <AppText variant="heading" style={styles.name} numberOfLines={1}>
            {boss ? boss.name : 'All gates cleared'}
          </AppText>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>
        {boss ? <BossHpBar progress={boss.progress} height={8} accessibilityLabel={`${boss.name} HP remaining`} /> : null}
        <View style={styles.footer}>
          <AppText variant="caption" color="textMuted">
            {boss ? `${formatNumber(boss.hpRemaining)} HP left` : `${overview.bossesDefeated} bosses defeated`}
          </AppText>
          <AppText variant="caption" color={challengesDone === overview.challenges.length ? 'success' : 'textSecondary'}>
            Weekly challenges {challengesDone}/{overview.challenges.length}
          </AppText>
        </View>
      </ScalePressable>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
