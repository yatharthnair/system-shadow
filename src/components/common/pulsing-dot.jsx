import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Glow } from '@/constants/theme';

/** A small "system online" indicator that slowly breathes. */
export function PulsingDot({ color = Colors.highlight, size = 6 }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.set(
      withRepeat(
        withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { boxShadow: Glow.soft },
});
