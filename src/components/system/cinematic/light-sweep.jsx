import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/** A single bright sweep across its children (e.g. a headline). Plays once. */
export function LightSweep({ children, delayMs = 250 }) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (width === 0) return undefined;
    progress.set(withDelay(delayMs, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })));
    return () => cancelAnimation(progress);
  }, [width, delayMs, progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SWEEP_WIDTH + progress.get() * (width + SWEEP_WIDTH * 2) }, { skewX: '-20deg' }],
  }));

  return (
    <View style={styles.container} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]} />
    </View>
  );
}

const SWEEP_WIDTH = 60;

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SWEEP_WIDTH,
    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)',
  },
});
