import * as Haptics from 'expo-haptics';
import { Zap } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { Colors, Spacing, withAlpha } from '@/constants/theme';
import { padNumber } from '@/utils/format';

import { BurstRings } from './cinematic/burst-rings';
import { CinematicBackdrop } from './cinematic/cinematic-backdrop';
import { Emblem } from './cinematic/emblem';
import { LightSweep } from './cinematic/light-sweep';
import { RotatingRays } from './cinematic/rotating-rays';

const VISIBLE_DURATION_MS = 2800;
const RANK_UP_EXTRA_MS = 1200;

/**
 * Cinematic level-up (and rank-up) notice: shockwave rings, turning light rays, an emblem
 * that springs in, and a light sweep across the headline. Simplifies to a fade with Reduce Motion.
 *
 * @param {{ notice: { fromLevel: number, toLevel: number, levelsGained: number, rankUp: null | { fromRank: string, toRank: string } }, onDismiss: () => void }} props
 */
export function LevelUpOverlay({ notice, onDismiss }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [notice]);

  const accessibilityLabel =
    `Level up. You reached level ${notice.toLevel}.` + (notice.rankUp ? ` Rank up to ${notice.rankUp.toRank}.` : '');

  return (
    <CinematicBackdrop
      durationMs={VISIBLE_DURATION_MS + (notice.rankUp ? RANK_UP_EXTRA_MS : 0)}
      onDismiss={onDismiss}
      accessibilityLabel={accessibilityLabel}>
      {reduceMotion ? null : <RotatingRays color={withAlpha(Colors.highlight, 0.5)} />}
      {reduceMotion ? null : <BurstRings color={Colors.highlight} />}

      <Emblem Icon={Zap} color={Colors.highlight} animate={!reduceMotion} />

      <View style={styles.text}>
        <AppText variant="label" color="highlight">
          System Notice
        </AppText>
        <LightSweep>
          <AppText variant="display" style={styles.headline}>
            LEVEL UP
          </AppText>
        </LightSweep>
        <View style={styles.levelRow}>
          <AppText variant="stat" color="textMuted">
            Lv. {padNumber(notice.fromLevel)}
          </AppText>
          <AppText variant="stat" color="highlight">
            →
          </AppText>
          <AppText variant="title" color="highlightLight">
            Lv. {padNumber(notice.toLevel)}
          </AppText>
        </View>
        {notice.levelsGained > 1 ? (
          <AppText variant="label" color="textSecondary">
            +{notice.levelsGained} levels
          </AppText>
        ) : null}
      </View>

      {notice.rankUp ? (
        <Animated.View entering={(reduceMotion ? FadeIn : FadeInDown).delay(700).duration(500)} style={styles.rankUp}>
          <AppText variant="label" color="warning">
            Rank Up
          </AppText>
          <AppText variant="display" style={styles.rank}>
            {notice.rankUp.fromRank} → {notice.rankUp.toRank}
          </AppText>
        </Animated.View>
      ) : null}
    </CinematicBackdrop>
  );
}

const styles = StyleSheet.create({
  text: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  headline: { fontSize: 46, lineHeight: 50, letterSpacing: 6, paddingHorizontal: Spacing.sm },
  levelRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  rankUp: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xl },
  rank: { color: Colors.warning },
});
