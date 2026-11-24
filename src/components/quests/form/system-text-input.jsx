import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { BorderWidth, Colors, Glow, Radius, Spacing, Typography } from '@/constants/theme';

/** Dark, glowing native text field. Border lights up on focus and turns red on error. */
export function SystemTextInput({ hasError, multiline, style, ...inputProps }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={Colors.textMuted}
      selectionColor={Colors.highlight}
      keyboardAppearance="dark"
      multiline={multiline}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[
        styles.input,
        multiline && styles.multiline,
        isFocused && styles.focused,
        hasError && styles.error,
        style,
      ]}
      {...inputProps}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.md },
  focused: { borderColor: Colors.borderGlow, boxShadow: Glow.subtle },
  error: { borderColor: Colors.danger },
});
