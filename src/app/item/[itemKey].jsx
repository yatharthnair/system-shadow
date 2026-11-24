import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Emblem } from '@/components/system/cinematic/emblem';
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from '@/constants/reward-visuals';
import { Colors, RarityColors, Spacing } from '@/constants/theme';
import { useRewardStore } from '@/store/reward-store';
import { formatDayHeading } from '@/utils/format';

/** Item detail, presented as a native iOS form sheet. */
export default function ItemSheet() {
  const { itemKey } = useLocalSearchParams();
  const item = useRewardStore((state) => state.overview?.inventory.find((candidate) => candidate.key === itemKey));

  if (!item) {
    return (
      <View style={styles.root}>
        <AppText variant="body" color="textMuted">
          This item is no longer in your inventory.
        </AppText>
      </View>
    );
  }

  const color = RarityColors[item.rarity];
  return (
    <View style={styles.root}>
      <Emblem Icon={ITEM_TYPE_ICONS[item.type]} color={color} />
      <AppText variant="label" style={{ color }}>
        {item.rarity} {ITEM_TYPE_LABELS[item.type]}
      </AppText>
      <AppText variant="display" style={styles.center}>
        {item.name}
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.center}>
        {item.description}
      </AppText>
      <AppText variant="caption" color="textMuted">
        {item.quantity > 1 ? `${item.quantity} owned · first ` : 'Acquired '}
        {formatDayHeading(new Date(item.firstAcquiredAt))}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    backgroundColor: Colors.backgroundElevated,
  },
  center: { textAlign: 'center' },
});
