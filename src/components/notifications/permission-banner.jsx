import { BellOff } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { SystemButton } from '@/components/common/system-button';
import { BorderWidth, Colors, Radius, Spacing, withAlpha } from '@/constants/theme';

/** Explains blocked notifications and links to this app's page in iOS Settings. */
export function PermissionBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <BellOff size={18} color={Colors.warning} />
        <AppText variant="bodyStrong">Notifications are blocked</AppText>
      </View>
      <AppText variant="caption" color="textSecondary">
        iOS isn’t allowing SYSTEM: SHADOW to send notifications. Turn them on in Settings › Notifications, then come back.
      </AppText>
      <View style={styles.action}>
        <SystemButton label="Open iOS Settings" onPress={() => Linking.openSettings()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.thin,
    borderColor: withAlpha(Colors.warning, 0.5),
    backgroundColor: withAlpha(Colors.warning, 0.08),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  action: { flexDirection: 'row', marginTop: Spacing.xs },
});
