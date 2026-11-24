import { StyleSheet } from 'react-native';

import { BorderWidth, Colors, Radius, Spacing, withAlpha } from '@/constants/theme';

import { AppText } from './app-text';
import { ScalePressable } from './scale-pressable';

/**
 * Toggleable pill. `accentColor` tints the selected state (defaults to the system cyan).
 * @param {{ label: string, isSelected: boolean, onPress: () => void, Icon?: import('react').ComponentType<any>, accentColor?: string }} props
 */
export function FilterChip({ label, isSelected, onPress, Icon, accentColor = Colors.highlight }) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        isSelected && { borderColor: accentColor, backgroundColor: withAlpha(accentColor, 0.14) },
      ]}>
      {Icon ? <Icon size={14} color={isSelected ? accentColor : Colors.textMuted} strokeWidth={2} /> : null}
      <AppText variant="label" color={isSelected ? 'textPrimary' : 'textMuted'} style={styles.label}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  label: { fontSize: 11, letterSpacing: 1.4 },
});
