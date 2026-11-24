import { StyleSheet } from 'react-native';

import { BorderWidth, Colors, ComponentTokens, Glow, Radius } from '@/constants/theme';

import { ScalePressable } from './scale-pressable';

const { size, iconSize } = ComponentTokens.iconButton;

/** Round icon-only button. `Icon` is a Lucide icon component. */
export function IconButton({ Icon, accessibilityLabel, onPress }) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={styles.button}>
      <Icon size={iconSize} color={Colors.highlightLight} strokeWidth={1.75} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size,
    height: size,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
    boxShadow: Glow.subtle,
  },
});
