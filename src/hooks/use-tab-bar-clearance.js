import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComponentTokens, Spacing } from '@/constants/theme';

/** Bottom padding a scrolling screen needs so its last item clears the floating tab bar. */
export function useTabBarClearance() {
  const { bottom } = useSafeAreaInsets();
  const { height, bottomGap } = ComponentTokens.tabBar;
  return bottom + bottomGap + height + Spacing.xl;
}
