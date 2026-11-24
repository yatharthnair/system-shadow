import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { Colors, ComponentTokens, Glow, Motion, Radius, Spacing } from '@/constants/theme';

const { iconSize, indicatorWidth } = ComponentTokens.tabBar;

/**
 * One tab in `SystemTabBar`. Animates between idle and focused:
 * a glowing indicator slides in above the icon and the icon plate lights up.
 */
export function TabBarButton({
  label,
  accessibilityLabel,
  renderIcon,
  isFocused,
  onPress,
  onLongPress,
  testID,
}) {
  const focusProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusProgress.set(withTiming(isFocused ? 1 : 0, { duration: Motion.duration.base }));
  }, [isFocused, focusProgress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.get(),
    transform: [{ scaleX: interpolate(focusProgress.get(), [0, 1], [0.2, 1]) }],
  }));

  const iconPlateStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      focusProgress.get(),
      [0, 1],
      [Colors.transparent, Colors.highlightSoft],
    ),
    transform: [{ translateY: interpolate(focusProgress.get(), [0, 1], [2, 0]) }],
  }));

  const iconColor = isFocused ? Colors.highlight : Colors.textMuted;

  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      haptic={isFocused ? 'none' : 'selection'}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={styles.button}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <Animated.View style={[styles.iconPlate, iconPlateStyle]}>
        {renderIcon?.({ focused: isFocused, color: iconColor, size: iconSize })}
      </Animated.View>
      <View>
        <AppText
          variant="label"
          color={isFocused ? 'highlightLight' : 'textMuted'}
          style={styles.label}
          numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    paddingVertical: Spacing.xs,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: indicatorWidth,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.highlight,
    boxShadow: Glow.strong,
  },
  iconPlate: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  label: { fontSize: 10, lineHeight: 12, letterSpacing: 1.4 },
});
