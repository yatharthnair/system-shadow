import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { BorderWidth, Colors, Glow, Motion, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

/**
 * iOS-style segmented control with a sliding, glowing selection indicator.
 * @param {{ options: Array<{ value: string, label: string }>, value: string, onChange: (value: string) => void, accessibilityLabel?: string }} props
 */
export function SegmentedControl({ options, value, onChange, accessibilityLabel }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = trackWidth > 0 ? (trackWidth - INSET * 2) / options.length : 0;
  const indicatorOffset = useSharedValue(0);

  useEffect(() => {
    indicatorOffset.set(withSpring(selectedIndex * segmentWidth, Motion.spring.snappy));
  }, [selectedIndex, segmentWidth, indicatorOffset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: indicatorOffset.get() }],
  }));

  return (
    <View
      style={styles.track}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {segmentWidth > 0 ? <Animated.View style={[styles.indicator, indicatorStyle]} /> : null}
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (isSelected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}>
            <AppText variant="label" color={isSelected ? 'highlightLight' : 'textMuted'} style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const INSET = 3;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: INSET,
    borderRadius: Radius.sm + INSET,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  indicator: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: INSET,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.highlightSoft,
    boxShadow: Glow.subtle,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  label: { fontSize: 11 },
});
