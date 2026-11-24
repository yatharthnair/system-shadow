import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Motion } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable that scales down slightly while pressed, with optional light haptic feedback.
 * Base for every tappable element so interactions feel consistent.
 */
export function ScalePressable({ onPress, haptic = 'light', style, children, ...pressableProps }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  function handlePress(event) {
    if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (haptic === 'selection') Haptics.selectionAsync();
    onPress?.(event);
  }

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.set(withSpring(Motion.pressedScale, Motion.spring.snappy));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, Motion.spring.snappy));
      }}
      onPress={handlePress}
      style={[animatedStyle, style]}
      {...pressableProps}>
      {children}
    </AnimatedPressable>
  );
}
