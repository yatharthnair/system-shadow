import { StyleSheet, View } from 'react-native';

import { CATEGORY_ICONS } from '@/constants/quest-visuals';
import { BorderWidth, CategoryColors, Radius, withAlpha } from '@/constants/theme';

/** Tinted square tile with the category's icon. */
export function CategoryIconTile({ category, size = 44 }) {
  const Icon = CATEGORY_ICONS[category];
  const color = CategoryColors[category];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderColor: withAlpha(color, 0.45), backgroundColor: withAlpha(color, 0.12) },
      ]}>
      <Icon size={size * 0.48} color={color} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
  },
});
