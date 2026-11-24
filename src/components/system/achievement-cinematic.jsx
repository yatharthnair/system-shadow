import * as Haptics from 'expo-haptics';
import { Award } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { Spacing, TierColors, withAlpha } from '@/constants/theme';
import { REWARD_TIERS } from '@/features/rewards/reward-tiers';

import { BurstRings } from './cinematic/burst-rings';
import { CinematicBackdrop } from './cinematic/cinematic-backdrop';
import { Emblem } from './cinematic/emblem';
import { LightSweep } from './cinematic/light-sweep';
import { LootRow } from './cinematic/loot-row';
import { RotatingRays } from './cinematic/rotating-rays';

const BASE_DURATION_MS = 3600;
const PER_EXTRA_MS = 600;

/**
 * Cinematic for achievements unlocked by one action. The highest-tier one is featured; any others
 * are listed beneath it, so several unlocks never queue several full-screen cinematics.
 */
export function AchievementCinematic({ notice, onDismiss }) {
  const reduceMotion = useReducedMotion();
  const tierOrder = Object.keys(REWARD_TIERS);
  const [featured, ...others] = [...notice.achievements].sort(
    (a, b) => tierOrder.indexOf(b.tier) - tierOrder.indexOf(a.tier),
  );
  const color = TierColors[featured.tier];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [notice]);

  const enter = (delay) => (reduceMotion ? FadeIn : FadeInDown).delay(delay).duration(450);

  return (
    <CinematicBackdrop
      durationMs={BASE_DURATION_MS + others.length * PER_EXTRA_MS}
      onDismiss={onDismiss}
      accessibilityLabel={`Achievement unlocked: ${notice.achievements.map((achievement) => achievement.title).join(', ')}`}>
      {reduceMotion ? null : <RotatingRays color={withAlpha(color, 0.55)} />}
      {reduceMotion ? null : <BurstRings color={color} />}

      <Emblem Icon={Award} color={color} animate={!reduceMotion} />

      <View style={styles.text}>
        <AppText variant="label" style={{ color }}>
          Achievement Unlocked · {REWARD_TIERS[featured.tier].label}
        </AppText>
        <LightSweep>
          <AppText variant="display" style={styles.title}>
            {featured.title}
          </AppText>
        </LightSweep>
        <Animated.View entering={enter(300)}>
          <AppText variant="body" color="textSecondary" style={styles.center}>
            {featured.description}
          </AppText>
        </Animated.View>
        <Animated.View entering={enter(500)}>
          <LootRow loot={featured.loot} />
        </Animated.View>
      </View>

      {others.length > 0 ? (
        <Animated.View entering={enter(750)} style={styles.others}>
          <AppText variant="label" color="textMuted">
            Also unlocked
          </AppText>
          {others.map((achievement) => (
            <AppText key={achievement.id} variant="heading" style={{ color: TierColors[achievement.tier] }}>
              {achievement.title}
              <AppText variant="caption" color="textMuted">
                {`  +${achievement.loot.xp} XP`}
              </AppText>
            </AppText>
          ))}
        </Animated.View>
      ) : null}
    </CinematicBackdrop>
  );
}

const styles = StyleSheet.create({
  text: { alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, maxWidth: 340 },
  title: { textAlign: 'center', paddingHorizontal: Spacing.sm },
  center: { textAlign: 'center' },
  others: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xl },
});
