import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { BorderWidth, Motion, withAlpha } from '@/constants/theme';

const SIZE = 104;

/** Diamond emblem that spins and springs into place, holding an icon. */
export function Emblem({ Icon, color, animate = true }) {
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return undefined;
    progress.set(withDelay(120, withSpring(1, Motion.spring.bouncy)));
    return () => cancelAnimation(progress);
  }, [animate, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.get() * 1.5),
    transform: [{ scale: 0.3 + progress.get() * 0.7 }, { rotate: `${(1 - progress.get()) * -135}deg` }],
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <View
        style={[
          styles.diamond,
          { borderColor: color, backgroundColor: withAlpha(color, 0.14), boxShadow: `0 0 28px 2px ${withAlpha(color, 0.5)}` },
        ]}
      />
      <Icon size={40} color={color} strokeWidth={1.5} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE * 1.42, height: SIZE * 1.42, alignItems: 'center', justifyContent: 'center' },
  diamond: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderWidth: BorderWidth.thick * 1.5,
    transform: [{ rotate: '45deg' }],
  },
});
