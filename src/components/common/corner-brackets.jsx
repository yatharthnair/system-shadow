import { StyleSheet, View } from 'react-native';

import { BorderWidth, Colors, ComponentTokens } from '@/constants/theme';

const SIZE = ComponentTokens.panel.cornerBracketSize;

/** HUD-style corner marks drawn over a panel's four corners. */
export function CornerBrackets({ color = Colors.highlight }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
      <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
      <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
      <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
    </View>
  );
}

const OFFSET = -1;

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: SIZE, height: SIZE },
  topLeft: { top: OFFSET, left: OFFSET, borderTopWidth: BorderWidth.thick, borderLeftWidth: BorderWidth.thick },
  topRight: { top: OFFSET, right: OFFSET, borderTopWidth: BorderWidth.thick, borderRightWidth: BorderWidth.thick },
  bottomLeft: { bottom: OFFSET, left: OFFSET, borderBottomWidth: BorderWidth.thick, borderLeftWidth: BorderWidth.thick },
  bottomRight: { bottom: OFFSET, right: OFFSET, borderBottomWidth: BorderWidth.thick, borderRightWidth: BorderWidth.thick },
});
