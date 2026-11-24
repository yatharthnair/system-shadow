import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { TimePickerField } from '@/components/common/time-picker-field';
import { WeekdayToggles } from '@/components/common/weekday-toggles';
import { Colors, Spacing } from '@/constants/theme';
import { isTimeInQuietHours } from '@/features/notifications/quiet-hours';

/** One daily quest reminder: on/off, time, days, delete. Warns when it falls inside quiet hours. */
export function ReminderEditor({ reminder, quietHours, disabled, onChange, onDelete, isLast }) {
  const toggleDay = (day) => {
    const weekdays = reminder.weekdays.includes(day) ? reminder.weekdays.filter((existing) => existing !== day) : [...reminder.weekdays, day];
    if (weekdays.length > 0) onChange({ ...reminder, weekdays });
  };
  const isSilenced = isTimeInQuietHours(reminder.time, quietHours);

  return (
    <View style={[styles.container, !isLast && styles.divider, (disabled || !reminder.enabled) && styles.dim]}>
      <View style={styles.header}>
        <View style={styles.title}>
          <AppText variant="bodyStrong">{reminder.label}</AppText>
          {isSilenced ? (
            <AppText variant="caption" color="warning">
              Inside quiet hours: won’t be sent
            </AppText>
          ) : null}
        </View>
        <TimePickerField value={reminder.time} onChange={(time) => onChange({ ...reminder, time })} accessibilityLabel={`${reminder.label} time`} />
        <Switch
          value={reminder.enabled}
          onValueChange={(enabled) => onChange({ ...reminder, enabled })}
          disabled={disabled}
          trackColor={{ true: Colors.accent, false: Colors.surfacePressed }}
          ios_backgroundColor={Colors.surfacePressed}
          accessibilityLabel={`${reminder.label} reminder`}
        />
      </View>
      <WeekdayToggles selectedDays={reminder.weekdays} onToggle={toggleDay} size={34} disabled={disabled} />
      <Pressable onPress={onDelete} disabled={disabled} hitSlop={8} style={styles.delete} accessibilityRole="button" accessibilityLabel={`Delete ${reminder.label}`}>
        <Trash2 size={14} color={Colors.textMuted} />
        <AppText variant="caption" color="textMuted">
          Remove
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md, paddingVertical: Spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  dim: { opacity: 0.55 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { flex: 1, gap: Spacing.xxs },
  delete: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs, alignSelf: 'flex-end' },
});
