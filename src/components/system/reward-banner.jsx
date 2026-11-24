import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { PulsingDot } from '@/components/common/pulsing-dot';
import { BorderWidth, Colors, ComponentTokens, Glow, Gradients, Motion, Radius, Spacing } from '@/constants/theme';
import { formatNumber } from '@/utils/format';

const VISIBLE_DURATION_MS = 3000;

/**
 * Compact top banner for smaller rewards (weekly challenges, boss milestones, level milestones)
 * and for rewards revoked by an undo (muted tone).
 */
export function RewardBanner({ notice, onDismiss }) {
  const { top } = useSafeAreaInsets();
  const isMuted = notice.tone === 'muted';

  useEffect(() => {
    if (!isMuted) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const timer = setTimeout(onDismiss, VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice, isMuted, onDismiss]);

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(Motion.spring.gentle.damping)}
      exiting={FadeOutUp.duration(Motion.duration.base)}
      pointerEvents="none"
      style={[styles.container, isMuted && styles.muted, { top: top + Spacing.sm }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${notice.heading}. ${notice.lines.map((line) => line.title).join('. ')}`}>
      <View style={styles.header}>
        <PulsingDot color={isMuted ? Colors.textMuted : Colors.highlight} />
        <AppText variant="label" color={isMuted ? 'textMuted' : 'highlight'}>
          {notice.heading}
        </AppText>
      </View>
      {notice.lines.map((line) => (
        <View key={line.key} style={styles.row}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title} color={isMuted ? 'textSecondary' : 'textPrimary'}>
            {line.title}
          </AppText>
          {line.xp !== 0 ? (
            <AppText variant="stat" color={line.xp > 0 ? 'success' : 'textMuted'} style={styles.xp}>
              {line.xp > 0 ? '+' : '−'}
              {formatNumber(Math.abs(line.xp))} XP
            </AppText>
          ) : null}
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
  muted: { borderColor: Colors.border, boxShadow: Glow.none },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  title: { flex: 1 },
  xp: { fontSize: 15 },
});
