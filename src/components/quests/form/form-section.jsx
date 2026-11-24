import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Spacing } from '@/constants/theme';

/** Labelled form group with an optional hint and inline error. */
export function FormSection({ label, hint, error, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" color="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {children}
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
