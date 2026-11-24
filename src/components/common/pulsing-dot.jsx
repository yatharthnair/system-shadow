import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Glow } from '@/constants/theme';

/**
 * A small "system online" indicator that slowly breathes. The loop runs only while its screen is
 * focused (tabs stay mounted in the background) and never with Reduce Motion.
 */
export function PulsingDot({ color = Colors.highlight, size = 6 }) {
  const opacity = useSharedValue(1);
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const shouldAnimate = isFocused && !reduceMotion;

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(opacity);
      opacity.set(1);
      return undefined;
    }
    opacity.set(
      withRepeat(
        withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [shouldAnimate, opacity]);

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
