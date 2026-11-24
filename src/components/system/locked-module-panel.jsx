import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { StatusChip } from '@/components/common/status-chip';
import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';

/**
 * Placeholder for a system feature that isn't built yet.
 * @param {{ Icon: import('react').ComponentType<any>, title: string, description: string, status?: string }} props
 */
export function LockedModulePanel({ Icon, title, description, status = 'Locked', entranceIndex }) {
  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <View style={styles.iconFrame}>
        <Icon size={24} color={Colors.highlight} strokeWidth={1.5} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="heading" style={styles.title}>
            {title}
          </AppText>
          <StatusChip label={status} tone="muted" />
        </View>
        <AppText variant="body" color="textSecondary">
          {description}
        </AppText>
      </View>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' },
  iconFrame: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.highlightSoft,
  },
  body: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  title: { flexShrink: 1 },
});
