import { ScrollText } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { Colors, Spacing } from '@/constants/theme';

export function QuestEmptyState({ title, message }) {
  return (
    <GlowPanel style={styles.panel}>
      <ScrollText size={28} color={Colors.textMuted} strokeWidth={1.5} />
      <AppText variant="heading" color="textSecondary">
        {title}
      </AppText>
      <AppText variant="body" color="textMuted" style={styles.message}>
        {message}
      </AppText>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  message: { textAlign: 'center' },
});
