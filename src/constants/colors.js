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

/**
 * Accent hues for quest categories. Kept muted and cool so they sit inside the blue system
 * palette; each is used at low opacity for tiles and full strength only for icons.
 */
export const CategoryColors = {
  fitness: '#FF6B6B',
  nutrition: '#5BE39B',
  family: '#FFB86B',
  social: '#FF7EDB',
  career: '#6FA4FF',
  gaming: '#B18CFF',
  livestreaming: '#FF5C8A',
  recovery: '#3BE3FF',
};

/** Difficulty accents, rising in intensity. */
export const DifficultyColors = {
  easy: '#7FD1AE',
  normal: '#6FA4FF',
  hard: '#FFB84D',
  elite: '#FF4D6D',
};

/** Appends an alpha channel to a #RRGGBB color, e.g. withAlpha('#3BE3FF', 0.15). */
export function withAlpha(hexColor, alpha) {
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hexColor}${alphaHex}`;
}

/** Achievement tier accents. */
export const TierColors = {
  bronze: '#D08A5B',
  silver: '#C9D6EA',
  gold: '#FFC857',
  platinum: '#A8F3FF',
};

/** Item rarity accents, used for borders and glows in the inventory. */
export const RarityColors = {
  common: '#8FA3C7',
  rare: '#3BA7FF',
  epic: '#B18CFF',
  legendary: '#FFB84D',
};

/** Boss / danger accent for battle UI. */
export const BossColors = {
  primary: '#FF4D6D',
  glow: 'rgba(255, 77, 109, 0.45)',
  hpTrack: '#2A1220',
};

/**
 * Chart colors. Categorical series take slots in fixed order (never cycled); validated with the
 * dataviz palette checker against the dark chart surface (#080E1C): lightness band, chroma floor,
 * CVD separation (worst adjacent ΔE 9.4) and contrast all pass. Sequential = one hue, dark → bright.
 */
export const ChartColors = {
  series: ['#3987e5', '#d95926', '#199e70'],
  surface: Palette.navy900,
  grid: Palette.navy600,
  wash: 'rgba(57, 135, 229, 0.10)',
  sequential: [Palette.navy700, 'rgba(57, 135, 229, 0.35)', 'rgba(57, 135, 229, 0.6)', 'rgba(57, 135, 229, 0.85)', '#5aa0f0'],
};
