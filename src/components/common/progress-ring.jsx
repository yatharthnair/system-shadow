import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Colors, Motion } from '@/constants/theme';
import { clamp } from '@/utils/format';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Animated circular progress with a blue→cyan gradient stroke. `progress` is 0–1.
 * Children render centered inside the ring.
 */
export function ProgressRing({ progress, size = 96, strokeWidth = 8, children, accessibilityLabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.set(withTiming(clamp(progress, 0, 1), { duration: Motion.duration.slow * 2 }));
  }, [progress, animatedProgress]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.get()),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(progress, 0, 1) * 100) }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accent} />
            <Stop offset="1" stopColor={Colors.highlight} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfacePressed}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={arcProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
