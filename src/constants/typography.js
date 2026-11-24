import {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';

/** Font files loaded at startup (see `useAppBootstrap`). Keys become `fontFamily` names. */
export const FontAssets = {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
};

/**
 * Rajdhani (angular, technical) carries the "system" voice: titles, labels and numbers.
 * Body copy uses the iOS system font (SF Pro) for readability.
 */
export const FontFamily = {
  displayMedium: 'Rajdhani_500Medium',
  displaySemiBold: 'Rajdhani_600SemiBold',
  displayBold: 'Rajdhani_700Bold',
  body: undefined,
};

export const Typography = {
  hero: { fontFamily: FontFamily.displayBold, fontSize: 44, lineHeight: 46, letterSpacing: 1 },
  display: { fontFamily: FontFamily.displayBold, fontSize: 32, lineHeight: 36, letterSpacing: 1.5 },
  title: { fontFamily: FontFamily.displayBold, fontSize: 24, lineHeight: 28, letterSpacing: 1 },
  heading: { fontFamily: FontFamily.displaySemiBold, fontSize: 18, lineHeight: 22, letterSpacing: 0.8 },
  label: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  stat: {
    fontFamily: FontFamily.displayBold,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  body: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontFamily: FontFamily.body, fontSize: 12, lineHeight: 16, fontWeight: '400' },
};
