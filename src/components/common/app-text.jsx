import { Text } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

/**
 * Text with design-system typography.
 * @param {{ variant?: keyof typeof Typography, color?: keyof typeof Colors }} props
 */
export function AppText({ variant = 'body', color = 'textPrimary', style, ...textProps }) {
  return <Text style={[Typography[variant], { color: Colors[color] }, style]} {...textProps} />;
}
