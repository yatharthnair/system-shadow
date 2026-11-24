import { Text } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

/** Larger accessibility text sizes are honoured up to this factor; beyond it, HUD layouts break. */
const MAX_FONT_SCALE = 1.35;

/**
 * Text with design-system typography. Scales with iOS Dynamic Type (capped).
 * @param {{ variant?: keyof typeof Typography, color?: keyof typeof Colors }} props
 */
export function AppText({ variant = 'body', color = 'textPrimary', style, ...textProps }) {
  return <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[Typography[variant], { color: Colors[color] }, style]} {...textProps} />;
}
