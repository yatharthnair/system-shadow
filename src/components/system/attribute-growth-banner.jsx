import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { PulsingDot } from '@/components/common/pulsing-dot';
import { BorderWidth, Colors, ComponentTokens, Glow, Gradients, Motion, Radius, Spacing } from '@/constants/theme';

const VISIBLE_DURATION_MS = 2600;

/**
 * Compact top-of-screen system notice listing attributes that levelled up.
 * @param {{ notice: { attributes: Array<{ key: string, shortLabel: string, label: string, fromLevel: number, toLevel: number }> }, onDismiss: () => void }} props
 */
export function AttributeGrowthBanner({ notice, onDismiss }) {
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const dismissTimer = setTimeout(onDismiss, VISIBLE_DURATION_MS);
    return () => clearTimeout(dismissTimer);
  }, [notice, onDismiss]);

  const accessibilityMessage = notice.attributes
    .map((attribute) => `${attribute.label} reached level ${attribute.toLevel}`)
    .join('. ');

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(Motion.spring.gentle.damping)}
      exiting={FadeOutUp.duration(Motion.duration.base)}
      pointerEvents="none"
      style={[styles.container, { top: top + Spacing.sm }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Attribute growth. ${accessibilityMessage}`}>
      <View style={styles.header}>
        <PulsingDot />
        <AppText variant="label" color="highlight">
          System · Attribute Growth
        </AppText>
      </View>
      {notice.attributes.map((attribute) => (
        <View key={attribute.key} style={styles.row}>
          <AppText variant="heading" style={styles.attributeLabel}>
            {attribute.shortLabel}
          </AppText>
          <AppText variant="stat" color="textMuted" style={styles.levels}>
            Lv. {attribute.fromLevel}
          </AppText>
          <AppText variant="stat" color="highlight" style={styles.levels}>
            →
          </AppText>
          <AppText variant="stat" color="highlightLight" style={styles.levels}>
            Lv. {attribute.toLevel}
          </AppText>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: ComponentTokens.screen.horizontalPadding,
    right: ComponentTokens.screen.horizontalPadding,
    gap: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.surface,
    backgroundImage: Gradients.panel,
    boxShadow: Glow.soft,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  attributeLabel: { width: 44 },
  levels: { fontSize: 16 },
});
