import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { CornerBrackets } from '@/components/common/corner-brackets';
import { BorderWidth, Colors, Glow, Gradients, Motion, Radius, Spacing } from '@/constants/theme';
import { padNumber } from '@/utils/format';

const VISIBLE_DURATION_MS = 2400;
const RANK_UP_EXTRA_MS = 900;

/**
 * Full-screen system notice for a player level-up (and rank-up, when one happened).
 * @param {{ notice: { fromLevel: number, toLevel: number, levelsGained: number, rankUp: null | { fromRank: string, toRank: string } }, onDismiss: () => void }} props
 */
export function LevelUpOverlay({ notice, onDismiss }) {
  const panelScale = useSharedValue(0.7);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    panelScale.set(
      withSequence(withSpring(1.06, Motion.spring.bouncy), withTiming(1, { duration: Motion.duration.fast })),
    );
    glowOpacity.set(
      withSequence(withTiming(1, { duration: Motion.duration.base }), withDelay(400, withTiming(0.5, { duration: 800 }))),
    );

    const visibleFor = VISIBLE_DURATION_MS + (notice.rankUp ? RANK_UP_EXTRA_MS : 0);
    const dismissTimer = setTimeout(onDismiss, visibleFor);
    return () => clearTimeout(dismissTimer);
  }, [notice, onDismiss, panelScale, glowOpacity]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ scale: panelScale.get() }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.get() }));

  const isMultiLevel = notice.levelsGained > 1;
  const accessibilityMessage =
    `Level up. You reached level ${notice.toLevel}.` +
    (notice.rankUp ? ` Rank up to ${notice.rankUp.toRank}.` : '');

  return (
    <Animated.View
      entering={FadeIn.duration(Motion.duration.base)}
      exiting={FadeOut.duration(Motion.duration.slow)}
      style={styles.scrim}
      pointerEvents="none"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={accessibilityMessage}>
      <Animated.View style={[styles.halo, haloStyle]} />
      <Animated.View style={[styles.panel, panelStyle]}>
        <AppText variant="label" color="highlight">
          System Notice
        </AppText>
        <AppText variant="display" style={styles.headline}>
          LEVEL UP
        </AppText>

        <View style={styles.levelRow}>
          <AppText variant="stat" color="textMuted">
            Lv. {padNumber(notice.fromLevel)}
          </AppText>
          <AppText variant="stat" color="highlight">
            →
          </AppText>
          <AppText variant="title" color="highlightLight">
            Lv. {padNumber(notice.toLevel)}
          </AppText>
        </View>
        {isMultiLevel ? (
          <AppText variant="label" color="textSecondary">
            +{notice.levelsGained} levels
          </AppText>
        ) : null}

        {notice.rankUp ? (
          <Animated.View entering={FadeIn.delay(500).duration(Motion.duration.slow)} style={styles.rankUp}>
            <AppText variant="label" color="warning">
              Rank Up
            </AppText>
            <AppText variant="title">
              {notice.rankUp.fromRank} → {notice.rankUp.toRank}
            </AppText>
          </Animated.View>
        ) : null}
        <CornerBrackets />
      </Animated.View>
    </Animated.View>
  );
}

const HALO_SIZE = 320;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.overlayScrim,
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundImage: 'radial-gradient(circle, rgba(59, 227, 255, 0.28) 0%, rgba(59, 227, 255, 0) 70%)',
  },
  panel: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.surface,
    backgroundImage: Gradients.panel,
    boxShadow: Glow.strong,
  },
  headline: { fontSize: 40, lineHeight: 44, letterSpacing: 4 },
  levelRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  rankUp: {
    alignItems: 'center',
    gap: Spacing.xxs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: BorderWidth.thin,
    borderTopColor: Colors.border,
    alignSelf: 'stretch',
  },
});
