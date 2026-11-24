import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const RAY_COUNT = 6;
const RAY_LENGTH = 520;

/**
 * Soft light rays behind an emblem, slowly turning. One rotating container (a single animated
 * transform) with static children, for a cheap but rich effect.
 */
export function RotatingRays({ color, durationMs = 9000 }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.set(withTiming(90, { duration: durationMs, easing: Easing.linear }));
    return () => cancelAnimation(rotation);
  }, [rotation, durationMs]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));
  const rayGradient = `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.rotor, style]}>
        {Array.from({ length: RAY_COUNT }, (_, index) => (
          <View
            key={index}
            style={[styles.ray, { backgroundImage: rayGradient, transform: [{ rotate: `${(180 / RAY_COUNT) * index}deg` }] }]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', opacity: 0.35 },
  rotor: { width: RAY_LENGTH, height: RAY_LENGTH, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: RAY_LENGTH, height: 18 },
});
