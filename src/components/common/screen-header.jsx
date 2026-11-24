import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { PulsingDot } from './pulsing-dot';

/**
 * Top-of-screen heading in the system's voice.
 * @param {{ systemCode: string, title: string, subtitle?: string, accessory?: React.ReactNode }} props
 */
export function ScreenHeader({ systemCode, title, subtitle, accessory }) {
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <View style={styles.codeRow}>
          <PulsingDot />
          <AppText variant="label" color="highlight">
            {systemCode}
          </AppText>
        </View>
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  text: { flex: 1, gap: Spacing.xs },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
