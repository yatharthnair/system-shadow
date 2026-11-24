import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { BOSS_ICON } from '@/constants/reward-visuals';
import { BossColors, Spacing } from '@/constants/theme';

import { BurstRings } from './cinematic/burst-rings';
import { CinematicBackdrop } from './cinematic/cinematic-backdrop';
import { Emblem } from './cinematic/emblem';
import { LightSweep } from './cinematic/light-sweep';
import { LootRow } from './cinematic/loot-row';
import { RotatingRays } from './cinematic/rotating-rays';

const VISIBLE_DURATION_MS = 4200;

/** Cinematic for defeating a boss. */
export function BossDefeatCinematic({ notice, onDismiss }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const followUp = setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 250);
    return () => clearTimeout(followUp);
  }, [notice]);

  const enter = (delay) => (reduceMotion ? FadeIn : FadeInDown).delay(delay).duration(450);

  return (
    <CinematicBackdrop durationMs={VISIBLE_DURATION_MS} onDismiss={onDismiss} accessibilityLabel={`${notice.title}.`}>
      {reduceMotion ? null : <RotatingRays color={BossColors.glow} />}
      {reduceMotion ? null : <BurstRings color={BossColors.primary} />}

      <Emblem Icon={BOSS_ICON} color={BossColors.primary} animate={!reduceMotion} />

      <View style={styles.text}>
        <AppText variant="label" style={{ color: BossColors.primary }}>
          Gate Cleared
        </AppText>
        <LightSweep>
          <AppText variant="display" style={styles.headline}>
            BOSS DEFEATED
          </AppText>
        </LightSweep>
        <Animated.View entering={enter(300)} style={styles.center}>
          <AppText variant="title">{notice.title.replace(/ defeated$/, '')}</AppText>
          <AppText variant="body" color="textSecondary">
            {notice.subtitle}
          </AppText>
        </Animated.View>
        <Animated.View entering={enter(600)}>
          <LootRow loot={notice.loot} />
        </Animated.View>
      </View>
    </CinematicBackdrop>
  );
}

const styles = StyleSheet.create({
  text: { alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, maxWidth: 340 },
  headline: { fontSize: 40, lineHeight: 44, letterSpacing: 4, paddingHorizontal: Spacing.sm },
  center: { alignItems: 'center', gap: Spacing.xxs },
});
