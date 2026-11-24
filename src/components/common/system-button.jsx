import { StyleSheet } from 'react-native';

import { BorderWidth, Colors, Glow, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { ScalePressable } from './scale-pressable';

/** Outlined, glowing text button. */
export function SystemButton({ label, onPress, accessibilityHint }) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={styles.button}>
      <AppText variant="label" color="highlightLight">
        {label}
      </AppText>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.highlightSoft,
    boxShadow: Glow.subtle,
  },
});
