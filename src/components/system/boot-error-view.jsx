import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { SystemButton } from '@/components/common/system-button';
import { Colors, Spacing } from '@/constants/theme';

/** Shown instead of the app if local data can't be loaded at launch. */
export function BootErrorView({ error, onRetry }) {
  return (
    <View style={styles.root}>
      <GlowPanel style={styles.panel}>
        <AppText variant="label" color="danger">
          System Error
        </AppText>
        <AppText variant="title">Could not load your progress</AppText>
        <AppText variant="body" color="textSecondary">
          {error?.message ?? 'An unknown error occurred while opening local storage.'}
        </AppText>
        <View style={styles.actions}>
          <SystemButton label="Retry" onPress={onRetry} />
        </View>
      </GlowPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  panel: { gap: Spacing.md },
  actions: { flexDirection: 'row', marginTop: Spacing.sm },
});
