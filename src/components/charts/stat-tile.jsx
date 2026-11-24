import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';

/**
 * Figure tile: label, value, optional signed delta vs a named period. Direction is shown by an
 * arrow icon and sign, not color alone.
 */
export function StatTile({ label, value, delta, deltaLabel }) {
  const hasDelta = delta != null && Number.isFinite(delta);
  const isUp = hasDelta && delta >= 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}${hasDelta ? `, ${isUp ? 'up' : 'down'} ${Math.abs(Math.round(delta * 100))}% ${deltaLabel}` : ''}`}>
      <AppText variant="caption" color="textMuted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="title">{value}</AppText>
      {hasDelta ? (
        <View style={styles.delta}>
          <DeltaIcon size={12} color={isUp ? Colors.success : Colors.danger} strokeWidth={2.5} />
          <AppText variant="caption" color="textSecondary">
            {isUp ? '+' : '−'}
            {Math.abs(Math.round(delta * 100))}% {deltaLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: Spacing.xxs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
