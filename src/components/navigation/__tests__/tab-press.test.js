import { createTabPressHandlers } from '../tab-press';

// Regression: on device, tapping a tab crashed with "Cannot read property 'emit' of undefined"
// because the tab bar expected a `navigation` prop. Expo Router (SDK 58) passes `emitter` +
// `navigateToTab` instead; these tests pin that contract.
const setup = ({ isFocused = false, defaultPrevented = false } = {}) => {
  const emitter = { emit: jest.fn(() => ({ defaultPrevented })) };
  const navigateToTab = jest.fn();
  const handlers = createTabPressHandlers({ route: { key: 'quests-abc', name: 'quests' }, isFocused, emitter, navigateToTab });
  return { emitter, navigateToTab, handlers };
};

test('pressing an unfocused tab emits tabPress and switches to it by route key', () => {
  const { emitter, navigateToTab, handlers } = setup();
  handlers.onPress();
  expect(emitter.emit).toHaveBeenCalledWith({ type: 'tabPress', target: 'quests-abc', canPreventDefault: true });
  expect(navigateToTab).toHaveBeenCalledWith('quests-abc');
});

test('pressing the focused tab does not navigate', () => {
  const { navigateToTab, handlers } = setup({ isFocused: true });
  handlers.onPress();
  expect(navigateToTab).not.toHaveBeenCalled();
});

test('a screen can prevent the tab switch', () => {
  const { navigateToTab, handlers } = setup({ defaultPrevented: true });
  handlers.onPress();
  expect(navigateToTab).not.toHaveBeenCalled();
});

test('long press emits tabLongPress', () => {
  const { emitter, handlers } = setup();
  handlers.onLongPress();
  expect(emitter.emit).toHaveBeenCalledWith({ type: 'tabLongPress', target: 'quests-abc' });
});
