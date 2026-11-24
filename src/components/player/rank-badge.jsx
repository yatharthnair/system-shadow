import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { BorderWidth, Colors, Glow } from '@/constants/theme';

const SIZE = 48;
/** Font size by rank-id length so "E", "SS" and "SSS" all fit the diamond. */
const FONT_SIZE_BY_LENGTH = { 1: 24, 2: 19, 3: 15 };

/** Diamond-framed hunter rank (E → S, SS, SSS, EX). */
export function RankBadge({ rank }) {
  const fontSize = FONT_SIZE_BY_LENGTH[rank.length] ?? 13;
  return (
    <View style={styles.container} accessible accessibilityLabel={`Rank ${rank}`}>
      <View style={styles.diamond} />
      <AppText variant="title" color="highlightLight" style={{ fontSize, lineHeight: fontSize + 4 }}>
        {rank}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  diamond: {
    position: 'absolute',
    width: SIZE * 0.72,
    height: SIZE * 0.72,
    transform: [{ rotate: '45deg' }],
    borderWidth: BorderWidth.thick,
    borderColor: Colors.highlight,
    backgroundColor: Colors.highlightSoft,
    boxShadow: Glow.soft,
  },
});
