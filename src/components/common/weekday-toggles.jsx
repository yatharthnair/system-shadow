import { StyleSheet, View } from 'react-native';

import { BorderWidth, Colors, Glow } from '@/constants/theme';
import { WEEKDAYS } from '@/features/quests/quest-config';

import { AppText } from './app-text';
import { ScalePressable } from './scale-pressable';

/** Seven round day toggles (Mon–Sun, ISO numbering). */
export function WeekdayToggles({ selectedDays, onToggle, size = 40, disabled = false }) {
  return (
    <View style={styles.row}>
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDays.includes(day.value);
        return (
          <ScalePressable
            key={day.value}
            onPress={() => onToggle(day.value)}
            disabled={disabled}
            haptic="selection"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled }}
            accessibilityLabel={day.label}
            style={[styles.day, { width: size, height: size, borderRadius: size / 2 }, isSelected && styles.daySelected]}>
            <AppText variant="heading" color={isSelected ? 'highlightLight' : 'textMuted'} style={{ fontSize: size * 0.37 }}>
              {day.shortLabel}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  daySelected: { borderColor: Colors.borderGlow, backgroundColor: Colors.highlightSoft, boxShadow: Glow.subtle },
});
