/**
 * Tab press behaviour, matching Expo Router's built-in tab bar (SDK 58): emit `tabPress` (which
 * screens may prevent), then switch tabs by route key. Long press emits `tabLongPress`.
 *
 * @param {{ route: { key: string }, isFocused: boolean, emitter: { emit: Function }, navigateToTab: (routeKey: string) => void }} args
 */
export function createTabPressHandlers({ route, isFocused, emitter, navigateToTab }) {
  return {
    onPress() {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigateToTab(route.key);
    },
    onLongPress() {
      emitter.emit({ type: 'tabLongPress', target: route.key });
    },
  };
}
