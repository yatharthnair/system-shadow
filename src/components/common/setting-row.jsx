import { StyleSheet, Switch, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

/** A settings row: title, optional detail, and a trailing control (defaults to a native switch). */
export function SettingRow({ title, detail, value, onValueChange, disabled = false, accessory, isLast = false }) {
  return (
    <View style={[styles.row, !isLast && styles.divider, disabled && styles.disabled]}>
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {detail ? (
          <AppText variant="caption" color="textMuted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {accessory ?? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: Colors.accent, false: Colors.surfacePressed }}
          thumbColor={Colors.textPrimary}
          ios_backgroundColor={Colors.surfacePressed}
          accessibilityLabel={title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  disabled: { opacity: 0.45 },
  text: { flex: 1, gap: Spacing.xxs },
});
