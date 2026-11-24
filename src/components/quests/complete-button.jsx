import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ScalePressable } from '@/components/common/scale-pressable';
import { BorderWidth, Colors, Glow, Motion, Radius } from '@/constants/theme';

const SIZE = 40;

/**
 * Circular check button. Animates from an empty glowing ring to a filled check when the quest
 * becomes completed, with a bounce and a success haptic.
 */
export function CompleteButton({ isCompleted, isPending, onPress, accessibilityLabel }) {
  const fill = useSharedValue(isCompleted ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const wasCompleted = fill.get() === 1;
    fill.set(withTiming(isCompleted ? 1 : 0, { duration: Motion.duration.base }));
    if (isCompleted && !wasCompleted) {
      scale.set(withSequence(withSpring(1.25, Motion.spring.bouncy), withSpring(1, Motion.spring.snappy)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isCompleted, fill, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.get(), [0, 1], [Colors.transparent, Colors.success]),
    borderColor: interpolateColor(fill.get(), [0, 1], [Colors.borderGlow, Colors.success]),
    transform: [{ scale: scale.get() }],
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: fill.get(), transform: [{ scale: 0.6 + fill.get() * 0.4 }] }));

  return (
    <ScalePressable
      onPress={onPress}
      haptic="none"
      disabled={isPending || isCompleted}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isPending || isCompleted, checked: isCompleted, busy: isPending }}
      hitSlop={8}>
      <Animated.View style={[styles.circle, circleStyle]}>
        {isPending ? (
          <ActivityIndicator size="small" color={Colors.highlight} />
        ) : (
          <Animated.View style={checkStyle}>
            <Check size={22} color={Colors.textOnAccent} strokeWidth={3} />
          </Animated.View>
        )}
      </Animated.View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.thick,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: Glow.subtle,
  },
});
