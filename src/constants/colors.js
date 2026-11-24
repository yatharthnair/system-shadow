/**
 * Raw palette. Components should use the semantic `Colors` below, never `Palette` directly.
 */
const Palette = {
  void: '#020409',
  abyss: '#05080F',
  navy900: '#080E1C',
  navy800: '#0B1428',
  navy700: '#101C36',
  navy600: '#172647',
  navy500: '#22365F',

  electric500: '#2F7BFF',
  electric300: '#6FA4FF',
  cyan400: '#3BE3FF',
  cyan200: '#A8F3FF',

  frost100: '#EAF2FF',
  frost300: '#A9B9D8',
  frost500: '#64779E',

  emerald400: '#2EE6A6',
  amber400: '#FFB84D',
  crimson400: '#FF4D6D',
};

/** Semantic color tokens. */
export const Colors = {
  background: Palette.void,
  backgroundElevated: Palette.abyss,

  surface: Palette.navy900,
  surfaceRaised: Palette.navy800,
  surfacePressed: Palette.navy700,

  border: Palette.navy600,
  borderStrong: Palette.navy500,
  borderGlow: 'rgba(59, 227, 255, 0.55)',

  accent: Palette.electric500,
  accentSoft: 'rgba(47, 123, 255, 0.14)',
  accentLight: Palette.electric300,
  highlight: Palette.cyan400,
  highlightSoft: 'rgba(59, 227, 255, 0.12)',
  highlightLight: Palette.cyan200,

  textPrimary: Palette.frost100,
  textSecondary: Palette.frost300,
  textMuted: Palette.frost500,
  textOnAccent: Palette.void,

  success: Palette.emerald400,
  warning: Palette.amber400,
  danger: Palette.crimson400,

  overlayScrim: 'rgba(2, 4, 9, 0.82)',
  transparent: 'transparent',
};

/** Background gradients (CSS gradient strings, rendered natively by React Native's `backgroundImage`). */
export const Gradients = {
  screen: `linear-gradient(180deg, rgba(23, 38, 71, 0.55) 0%, ${Palette.void} 38%, ${Palette.void} 100%)`,
  panel: `linear-gradient(160deg, ${Palette.navy800} 0%, ${Palette.navy900} 60%, ${Palette.abyss} 100%)`,
  progressFill: `linear-gradient(90deg, ${Palette.electric500} 0%, ${Palette.cyan400} 100%)`,
};
