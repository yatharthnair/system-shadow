import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { Colors, Motion, Spacing } from '@/constants/theme';

/**
 * Full-screen stage for a cinematic notice: dark scrim, auto-dismiss after `durationMs`,
 * tap anywhere to skip. Children are centered.
 */
export function CinematicBackdrop({ durationMs, onDismiss, accessibilityLabel, children }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

  return (
    <Animated.View
      entering={FadeIn.duration(Motion.duration.base)}
      exiting={FadeOut.duration(Motion.duration.slow)}
      style={styles.scrim}>
      <Pressable
        style={styles.pressable}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Dismisses the notice"
        accessibilityLiveRegion="assertive">
        {children}
        <AppText variant="label" color="textMuted" style={styles.hint}>
          Tap to continue
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlayScrim },
  pressable: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  hint: { position: 'absolute', bottom: Spacing.xxxl * 1.5, fontSize: 10 },
});
