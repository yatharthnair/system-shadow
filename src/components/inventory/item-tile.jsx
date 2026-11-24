import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { ITEM_TYPE_ICONS } from '@/constants/reward-visuals';
import { BorderWidth, Colors, RarityColors, Radius, Spacing, withAlpha } from '@/constants/theme';

/** Inventory slot: rarity-colored frame, type icon, name and stack count. Opens the item sheet. */
export const ItemTile = memo(function ItemTile({ item }) {
  const color = RarityColors[item.rarity];
  const Icon = ITEM_TYPE_ICONS[item.type];
  return (
    <ScalePressable
      onPress={() => router.push({ pathname: '/item/[itemKey]', params: { itemKey: item.key } })}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.rarity}${item.quantity > 1 ? `, ${item.quantity} owned` : ''}`}
      style={[
        styles.tile,
        { borderColor: withAlpha(color, 0.55), backgroundImage: `radial-gradient(circle at 50% 35%, ${withAlpha(color, 0.2)} 0%, transparent 70%)` },
      ]}>
      <Icon size={28} color={color} strokeWidth={1.5} />
      <AppText variant="label" numberOfLines={2} style={styles.name} color="textPrimary">
        {item.name}
      </AppText>
      {item.quantity > 1 ? (
        <View style={[styles.quantity, { borderColor: color }]}>
          <AppText variant="stat" style={[styles.quantityText, { color }]}>
            ×{item.quantity}
          </AppText>
        </View>
      ) : null}
    </ScalePressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '33%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.thin,
    backgroundColor: Colors.surface,
  },
  name: { fontSize: 10, letterSpacing: 0.8, textAlign: 'center', textTransform: 'none' },
  quantity: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: BorderWidth.thin,
    backgroundColor: Colors.background,
  },
  quantityText: { fontSize: 11, lineHeight: 14 },
});
