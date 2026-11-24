import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BossColors, Colors, Motion, Radius } from '@/constants/theme';
import { clamp } from '@/utils/format';

const MILESTONE_TICKS = [25, 50, 75];

/**
 * Boss HP remaining (drains right-to-left as damage is dealt), with ticks at the 25/50/75%
 * damage milestones. Ticks light up once reached.
 */
export function BossHpBar({ progress, height = 14, accessibilityLabel }) {
  const remaining = useSharedValue(1);

  useEffect(() => {
    remaining.set(withTiming(clamp(1 - progress, 0, 1), { duration: Motion.duration.slow * 2 }));
  }, [progress, remaining]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${remaining.get() * 100}%` }));

  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(1 - progress, 0, 1) * 100) }}>
      <Animated.View style={[styles.fill, fillStyle]} />
      {MILESTONE_TICKS.map((milestone) => (
        <View
          key={milestone}
          style={[
            styles.tick,
            // A damage milestone at m% sits where the remaining-HP bar ends at (100 − m)%.
            { left: `${100 - milestone}%` },
            progress * 100 >= milestone && styles.tickReached,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radius.xs,
    backgroundColor: BossColors.hpTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundImage: `linear-gradient(90deg, #B3123A 0%, ${BossColors.primary} 100%)`,
    boxShadow: `0 0 12px 0 ${BossColors.glow}`,
  },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: Colors.background },
  tickReached: { backgroundColor: Colors.warning },
});
