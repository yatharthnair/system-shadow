import { Radius, Spacing } from './spacing';

/** Component-level tokens: dimensions shared by a component and the layouts that make room for it. */
export const ComponentTokens = {
  screen: {
    horizontalPadding: Spacing.lg,
    sectionGap: Spacing.lg,
  },
  panel: {
    padding: Spacing.lg,
    radius: Radius.md,
    cornerBracketSize: 10,
  },
  tabBar: {
    height: 64,
    horizontalInset: Spacing.lg,
    bottomGap: Spacing.sm,
    radius: Radius.lg,
    iconSize: 22,
    indicatorWidth: 22,
  },
  progressBar: {
    height: 6,
  },
  iconButton: {
    size: 40,
    iconSize: 20,
  },
};
