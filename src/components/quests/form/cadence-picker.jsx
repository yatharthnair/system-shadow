import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { SegmentedControl } from '@/components/common/segmented-control';
import { BorderWidth, Colors, Glow, Spacing } from '@/constants/theme';
import { CADENCES_BY_KEY, WEEKDAYS } from '@/features/quests/quest-config';

const GROUP_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];
const CUSTOM_OPTIONS = [
  { value: 'weekdays', label: 'Specific days' },
  { value: 'once', label: 'One-time' },
];

const CADENCE_DESCRIPTIONS = {
  daily: 'Resets every day at midnight.',
  weekly: 'Resets every Monday at midnight. Worth 3× XP.',
  weekdays: 'Repeats on the days you choose.',
  once: 'Complete it once. Worth 2× XP.',
};

function WeekdayToggles({ selectedDays, onToggle }) {
  return (
    <View style={styles.weekdays}>
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDays.includes(day.value);
        return (
          <ScalePressable
            key={day.value}
            onPress={() => onToggle(day.value)}
            haptic="selection"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={day.label}
            style={[styles.day, isSelected && styles.daySelected]}>
            <AppText variant="heading" color={isSelected ? 'highlightLight' : 'textMuted'} style={styles.dayLabel}>
              {day.shortLabel}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}

/**
 * Daily / Weekly / Custom (specific days or one-time). Locked after creation, because
 * completions are tracked per period and changing the period type would break that history.
 */
export function CadencePicker({ cadence, weekdays, isLocked, onChangeCadence, onToggleWeekday }) {
  const group = CADENCES_BY_KEY[cadence].group;

  return (
    <View style={styles.container}>
      {isLocked ? (
        <AppText variant="bodyStrong">{CADENCES_BY_KEY[cadence].label}</AppText>
      ) : (
        <>
          <SegmentedControl
            options={GROUP_OPTIONS}
            value={group}
            onChange={(nextGroup) => onChangeCadence(nextGroup === 'custom' ? 'weekdays' : nextGroup)}
            accessibilityLabel="Repeat"
          />
          {group === 'custom' ? (
            <SegmentedControl options={CUSTOM_OPTIONS} value={cadence} onChange={onChangeCadence} accessibilityLabel="Custom schedule" />
          ) : null}
        </>
      )}
      {cadence === 'weekdays' ? <WeekdayToggles selectedDays={weekdays} onToggle={onToggleWeekday} /> : null}
      <AppText variant="caption" color="textMuted">
        {CADENCE_DESCRIPTIONS[cadence]}
        {isLocked ? ' Repeat type can’t be changed after creation.' : ''}
      </AppText>
    </View>
  );
}

const DAY_SIZE = 40;

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  daySelected: { borderColor: Colors.borderGlow, backgroundColor: Colors.highlightSoft, boxShadow: Glow.subtle },
  dayLabel: { fontSize: 15 },
});
