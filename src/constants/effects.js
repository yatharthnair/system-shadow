/** Glows are native `boxShadow` strings (supported on iOS and Android by React Native). */
export const Glow = {
  none: undefined,
  subtle: '0 0 10px 0 rgba(59, 227, 255, 0.12)',
  soft: '0 0 18px 0 rgba(59, 227, 255, 0.22)',
  strong: '0 0 28px 2px rgba(59, 227, 255, 0.45)',
  accent: '0 0 20px 0 rgba(47, 123, 255, 0.45)',
};

/** Shared motion values so every animation in the app feels like the same system. */
export const Motion = {
  duration: {
    fast: 140,
    base: 240,
    slow: 420,
  },
  spring: {
    snappy: { damping: 18, stiffness: 260 },
    gentle: { damping: 16, stiffness: 140 },
    bouncy: { damping: 9, stiffness: 180 },
  },
  pressedScale: 0.96,
  /** Delay between staggered panel entrances on a screen. */
  staggerStep: 70,
};
