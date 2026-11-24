import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ITEM_TYPE_ICONS, TITLE_ICON } from '@/constants/reward-visuals';
import { BorderWidth, Colors, RarityColors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { formatNumber } from '@/utils/format';

function LootChip({ Icon, label, color }) {
  return (
    <View style={[styles.chip, { borderColor: withAlpha(color, 0.6), backgroundColor: withAlpha(color, 0.12) }]}>
      {Icon ? <Icon size={14} color={color} strokeWidth={2} /> : null}
      <AppText variant="label" style={[styles.chipLabel, { color }]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/** Rewards granted by an unlock: XP, items (rarity-colored) and a title. */
export function LootRow({ loot }) {
  if (!loot) return null;
  return (
    <View style={styles.row}>
      {loot.xp > 0 ? <LootChip label={`+${formatNumber(loot.xp)} XP`} color={Colors.success} /> : null}
      {loot.items.map((item) => (
        <LootChip key={item.key} Icon={ITEM_TYPE_ICONS[item.type]} label={item.name} color={RarityColors[item.rarity]} />
      ))}
      {loot.title ? <LootChip Icon={TITLE_ICON} label={`Title: ${loot.title.label}`} color={Colors.highlightLight} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.thin,
  },
  chipLabel: { fontSize: 11, letterSpacing: 1.2 },
});
