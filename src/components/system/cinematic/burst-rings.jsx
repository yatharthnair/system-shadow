import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const RING_COUNT = 3;
const RING_SIZE = 180;

function Ring({ index, color }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withDelay(index * 160, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
    return () => cancelAnimation(progress);
  }, [index, progress]);

  // Transform + opacity only: composited on the UI thread, no layout work per frame.
  const style = useAnimatedStyle(() => ({
    opacity: 0.85 * (1 - progress.get()),
    transform: [{ scale: 0.4 + progress.get() * 1.9 }],
  }));

  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

/** Shockwave rings that expand once from the center. Plays a single time; nothing loops. */
export function BurstRings({ color }) {
  return (
    <View pointerEvents="none" style={styles.container}>
      {Array.from({ length: RING_COUNT }, (_, index) => (
        <Ring key={index} index={index} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
});
