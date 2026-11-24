import { router } from 'expo-router';
import { Bell, ChartColumn, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { SectionLabel } from '@/components/common/section-label';
import { SettingRow } from '@/components/common/setting-row';
import { showSystemError } from '@/components/common/show-system-error';
import { TimePickerField } from '@/components/common/time-picker-field';
import { PermissionBanner } from '@/components/notifications/permission-banner';
import { ReminderEditor } from '@/components/notifications/reminder-editor';
import { BackupPanel } from '@/components/settings/backup-panel';
import { Colors, ComponentTokens, Spacing } from '@/constants/theme';
import { MAX_REMINDERS } from '@/features/notifications/notification-settings';
import { isTimeInQuietHours } from '@/features/notifications/quiet-hours';
import { WEEKDAYS } from '@/features/quests/quest-config';
import { createId } from '@/utils/create-id';
import { useNotificationStore } from '@/store/notification-store';

function WeekdayPicker({ value, onChange, disabled }) {
  return (
    <View style={styles.weekdayPicker}>
      {WEEKDAYS.map((day) => (
        <Pressable
          key={day.value}
          disabled={disabled}
          onPress={() => onChange(day.value)}
          style={[styles.weekdayOption, value === day.value && styles.weekdayOptionSelected]}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === day.value }}
          accessibilityLabel={day.label}>
          <AppText variant="label" color={value === day.value ? 'highlightLight' : 'textMuted'} style={styles.weekdayLabel}>
            {day.label.slice(0, 3)}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const settings = useNotificationStore((state) => state.settings);
  const permission = useNotificationStore((state) => state.permission);
  const scheduledCount = useNotificationStore((state) => state.scheduledCount);
  const setEnabled = useNotificationStore((state) => state.setEnabled);
  const updateSettings = useNotificationStore((state) => state.updateSettings);

  const update = (updater) => updateSettings(updater).catch(showSystemError);
  const isBlocked = permission.state === 'denied';
  const isOff = !settings.enabled;
  const weekly = settings.weeklyChallengeReminder;
  const quiet = settings.quietHours;

  const updateReminder = (next) =>
    update((current) => ({ ...current, questReminders: current.questReminders.map((reminder) => (reminder.id === next.id ? next : reminder)) }));
  const deleteReminder = (id) => update((current) => ({ ...current, questReminders: current.questReminders.filter((reminder) => reminder.id !== id) }));
  const addReminder = () =>
    update((current) => ({
      ...current,
      questReminders: [
        ...current.questReminders,
        { id: createId('reminder'), label: `Reminder ${current.questReminders.length + 1}`, time: '12:00', weekdays: [1, 2, 3, 4, 5, 6, 7], enabled: true },
      ],
    }));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <SectionLabel>Notifications</SectionLabel>
      <GlowPanel highlighted style={styles.panel}>
        <View style={styles.masterRow}>
          <Bell size={20} color={Colors.highlight} />
          <View style={styles.masterText}>
            <SettingRow
              isLast
              title="Allow notifications"
              detail={
                settings.enabled
                  ? `${scheduledCount} reminder${scheduledCount === 1 ? '' : 's'} scheduled for the next 7 days. Everything stays on this device.`
                  : 'Reminders and alerts are delivered on-device. iOS will ask for permission the first time.'
              }
              value={settings.enabled}
              onValueChange={(enabled) => setEnabled(enabled).catch(showSystemError)}
            />
          </View>
        </View>
        {isBlocked ? <PermissionBanner /> : null}
      </GlowPanel>

      <SectionLabel>Daily quest reminders</SectionLabel>
      <GlowPanel style={styles.panel}>
        <AppText variant="caption" color="textMuted">
          Each reminder says how many quests are left, and is skipped once today’s quests are all cleared.
        </AppText>
        {settings.questReminders.map((reminder, index) => (
          <ReminderEditor
            key={reminder.id}
            reminder={reminder}
            quietHours={quiet}
            disabled={isOff}
            isLast={index === settings.questReminders.length - 1}
            onChange={updateReminder}
            onDelete={() => deleteReminder(reminder.id)}
          />
        ))}
        {settings.questReminders.length < MAX_REMINDERS ? (
          <Pressable onPress={addReminder} disabled={isOff} style={[styles.addRow, isOff && styles.dim]} accessibilityRole="button">
            <Plus size={16} color={Colors.highlight} />
            <AppText variant="label" color="highlight">
              Add reminder
            </AppText>
          </Pressable>
        ) : null}
      </GlowPanel>

      <SectionLabel>Weekly challenges</SectionLabel>
      <GlowPanel style={styles.panel}>
        <SettingRow
          title="Challenge reminder"
          detail={isTimeInQuietHours(weekly.time, quiet) ? 'Inside quiet hours: won’t be sent' : 'Only sent while challenges are unfinished.'}
          value={weekly.enabled}
          disabled={isOff}
          onValueChange={(enabled) => update((current) => ({ ...current, weeklyChallengeReminder: { ...current.weeklyChallengeReminder, enabled } }))}
        />
        <WeekdayPicker
          value={weekly.weekday}
          disabled={isOff || !weekly.enabled}
          onChange={(weekday) => update((current) => ({ ...current, weeklyChallengeReminder: { ...current.weeklyChallengeReminder, weekday } }))}
        />
        <SettingRow
          isLast
          title="Time"
          disabled={isOff || !weekly.enabled}
          accessory={
            <TimePickerField
              value={weekly.time}
              onChange={(time) => update((current) => ({ ...current, weeklyChallengeReminder: { ...current.weeklyChallengeReminder, time } }))}
              accessibilityLabel="Weekly challenge reminder time"
            />
          }
        />
      </GlowPanel>

      <SectionLabel>Alerts</SectionLabel>
      <GlowPanel style={styles.panel}>
        <SettingRow
          title="Quest completed"
          detail="Logged to Notification Center when you clear a quest."
          value={settings.questCompletion}
          disabled={isOff}
          onValueChange={(questCompletion) => update((current) => ({ ...current, questCompletion }))}
        />
        <SettingRow
          isLast
          title="Level up"
          detail="When you reach a new level or rank."
          value={settings.levelUp}
          disabled={isOff}
          onValueChange={(levelUp) => update((current) => ({ ...current, levelUp }))}
        />
      </GlowPanel>

      <SectionLabel>Quiet hours</SectionLabel>
      <GlowPanel style={styles.panel}>
        <SettingRow
          title="Quiet hours"
          detail="No notifications of any kind during this window."
          value={quiet.enabled}
          disabled={isOff}
          onValueChange={(enabled) => update((current) => ({ ...current, quietHours: { ...current.quietHours, enabled } }))}
        />
        <SettingRow
          title="From"
          disabled={isOff || !quiet.enabled}
          accessory={
            <TimePickerField value={quiet.start} onChange={(start) => update((current) => ({ ...current, quietHours: { ...current.quietHours, start } }))} accessibilityLabel="Quiet hours start" />
          }
        />
        <SettingRow
          isLast
          title="Until"
          disabled={isOff || !quiet.enabled}
          accessory={
            <TimePickerField value={quiet.end} onChange={(end) => update((current) => ({ ...current, quietHours: { ...current.quietHours, end } }))} accessibilityLabel="Quiet hours end" />
          }
        />
      </GlowPanel>

      <SectionLabel>Data</SectionLabel>
      <BackupPanel />

      <SectionLabel>Insights</SectionLabel>
      <GlowPanel style={styles.panel}>
        <Pressable onPress={() => router.push('/analytics')} style={styles.linkRow} accessibilityRole="button">
          <ChartColumn size={18} color={Colors.highlight} />
          <AppText variant="bodyStrong" style={styles.linkText}>
            Analytics
          </AppText>
          <AppText variant="caption" color="textMuted">
            XP, streaks, consistency
          </AppText>
        </Pressable>
      </GlowPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: ComponentTokens.screen.horizontalPadding, gap: Spacing.md, paddingBottom: Spacing.xxxl * 2 },
  panel: { gap: Spacing.xs, paddingVertical: Spacing.sm },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  masterText: { flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
  dim: { opacity: 0.45 },
  weekdayPicker: { flexDirection: 'row', gap: 4, paddingVertical: Spacing.sm },
  weekdayOption: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  weekdayOptionSelected: { borderColor: Colors.borderGlow, backgroundColor: Colors.highlightSoft },
  weekdayLabel: { fontSize: 10, letterSpacing: 0.6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  linkText: { flex: 1 },
});
