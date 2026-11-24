import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

/** Uppercase section title followed by a fading rule. */
export function SectionLabel({ children }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color="textSecondary">
        {children}
      </AppText>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rule: {
    flex: 1,
    height: 1,
    backgroundImage: `linear-gradient(90deg, ${Colors.borderStrong} 0%, transparent 100%)`,
  },
});
