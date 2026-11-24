import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BorderWidth, Colors, ComponentTokens, Glow, Gradients, Motion } from '@/constants/theme';

import { CornerBrackets } from './corner-brackets';

/**
 * The base surface of the interface: a navy panel with a glowing border and HUD corners.
 *
 * @param {object} props
 * @param {boolean} [props.highlighted] Brighter cyan border + stronger glow, for the primary panel on a screen.
 * @param {number} [props.entranceIndex] Position on screen; staggers the fade-in. Omit to skip the entrance animation.
 */
export function GlowPanel({ children, highlighted = false, entranceIndex, style, ...viewProps }) {
  const entering =
    entranceIndex === undefined
      ? undefined
      : FadeInDown.duration(Motion.duration.slow)
          .delay(entranceIndex * Motion.staggerStep)
          .springify()
          .damping(Motion.spring.gentle.damping);

  return (
    <Animated.View
      entering={entering}
      style={[styles.panel, highlighted ? styles.highlighted : styles.standard, style]}
      {...viewProps}>
      {children}
      <CornerBrackets color={highlighted ? Colors.highlight : Colors.borderStrong} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: ComponentTokens.panel.padding,
    borderRadius: ComponentTokens.panel.radius,
    borderWidth: BorderWidth.thin,
    backgroundColor: Colors.surface,
    backgroundImage: Gradients.panel,
  },
  standard: {
    borderColor: Colors.border,
    boxShadow: Glow.subtle,
  },
  highlighted: {
    borderColor: Colors.borderGlow,
    boxShadow: Glow.soft,
  },
});
