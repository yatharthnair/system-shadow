import { DatabaseBackup, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { Colors, Spacing } from '@/constants/theme';
import { pickBackupFileText, shareBackupFile } from '@/features/backup/backup-files';
import { createBackup, inspectBackup, restoreBackup } from '@/features/backup/backup-service';
import { reloadAppState } from '@/store/reload-app-state';
import { formatDayHeading, formatNumber, formatTimeOfDay } from '@/utils/format';

function ActionRow({ Icon, title, detail, onPress, isBusy, isLast }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isBusy}
      style={[styles.row, !isLast && styles.divider]}
      accessibilityRole="button"
      accessibilityState={{ busy: isBusy }}>
      <Icon size={18} color={Colors.highlight} />
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="textMuted">
          {detail}
        </AppText>
      </View>
      {isBusy ? <ActivityIndicator color={Colors.highlight} /> : null}
    </Pressable>
  );
}

function describeBackup(backup) {
  const exportedAt = new Date(backup.exportedAt);
  const { summary } = backup;
  return [
    `Made ${formatDayHeading(exportedAt)} at ${formatTimeOfDay(exportedAt)}.`,
    `Level ${summary.level ?? 1} · ${formatNumber(summary.totalXp)} XP · ${summary.completions} quest completions · ${summary.rewards} rewards.`,
    '',
    'All current progress on this device will be replaced. This can’t be undone, so export a backup first if you want to keep it.',
  ].join('\n');
}

/** Export everything to a JSON file (share sheet), or restore from one. All local. */
export function BackupPanel() {
  const [busyAction, setBusyAction] = useState(null);

  async function handleExport() {
    setBusyAction('export');
    try {
      const backup = await createBackup();
      await shareBackupFile(backup);
    } catch (error) {
      Alert.alert('Backup failed', error.message);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRestore() {
    setBusyAction('restore');
    try {
      const text = await pickBackupFileText();
      if (text == null) return;
      const backup = inspectBackup(text);
      const confirmed = await new Promise((resolve) =>
        Alert.alert('Restore this backup?', describeBackup(backup), [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Replace & Restore', style: 'destructive', onPress: () => resolve(true) },
        ]),
      );
      if (!confirmed) return;
      await restoreBackup(backup);
      await reloadAppState();
      Alert.alert('Restored', 'Your progress has been restored from the backup.');
    } catch (error) {
      // Restores are atomic: on any error the existing data is untouched.
      Alert.alert('Restore failed', `${error.message}\n\nNothing was changed.`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <GlowPanel style={styles.panel}>
      <ActionRow
        Icon={DatabaseBackup}
        title="Export backup"
        detail="Save all progress as a JSON file (Files, AirDrop…)."
        onPress={handleExport}
        isBusy={busyAction === 'export'}
      />
      <ActionRow
        isLast
        Icon={Upload}
        title="Restore from backup"
        detail="Replace this device’s progress with a backup file."
        onPress={handleRestore}
        isBusy={busyAction === 'restore'}
      />
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 0, paddingVertical: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  text: { flex: 1, gap: Spacing.xxs },
});
