import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { Motion } from '@/constants/theme';

/** "+40 XP" that rises and fades out. Remount (change `key`) to play again. */
export function XpGainBurst({ amount }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withSequence(
        withTiming(0.3, { duration: Motion.duration.base, easing: Easing.out(Easing.quad) }),
        withDelay(500, withTiming(1, { duration: Motion.duration.slow, easing: Easing.in(Easing.quad) })),
      ),
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get() < 0.3 ? progress.get() / 0.3 : 1 - (progress.get() - 0.3) / 0.7,
    transform: [{ translateY: -progress.get() * 36 }, { scale: 0.9 + Math.min(progress.get(), 0.3) / 3 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.container, style]}>
      <AppText variant="stat" color="success">
        +{amount} XP
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', right: 0, top: -6 },
});
