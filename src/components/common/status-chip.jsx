import { StyleSheet, View } from 'react-native';

import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

const TONES = {
  info: { text: 'highlightLight', border: Colors.borderGlow, background: Colors.highlightSoft },
  muted: { text: 'textMuted', border: Colors.border, background: Colors.surfaceRaised },
};

/** Small uppercase tag, e.g. "LOCKED" or "ONLINE". */
export function StatusChip({ label, tone = 'info' }) {
  const colors = TONES[tone];
  return (
    <View style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <AppText variant="label" color={colors.text} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.xs,
    borderWidth: BorderWidth.thin,
  },
  text: { fontSize: 10, letterSpacing: 1.8 },
});
