import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors, ComponentTokens, Glow, Gradients, Motion, Radius } from '@/constants/theme';
import { clamp } from '@/utils/format';

/** Animated, glowing progress bar. `progress` is 0–1. */
export function ProgressBar({ progress, accessibilityLabel }) {
  const fillFraction = useSharedValue(0);

  useEffect(() => {
    fillFraction.set(withTiming(clamp(progress, 0, 1), { duration: Motion.duration.slow }));
  }, [progress, fillFraction]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fillFraction.get() * 100}%` }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(progress, 0, 1) * 100) }}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: ComponentTokens.progressBar.height,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfacePressed,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundImage: Gradients.progressFill,
    boxShadow: Glow.accent,
  },
});
