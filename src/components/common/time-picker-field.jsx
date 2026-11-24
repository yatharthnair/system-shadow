import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers';

import { Colors } from '@/constants/theme';
import { timeStringToDate, toTimeString } from '@/features/notifications/notification-settings';

/**
 * Native iOS time picker (SwiftUI compact DatePicker) bound to a local "HH:MM" string.
 * Tapping it opens the system wheel popover.
 */
export function TimePickerField({ value, onChange, accessibilityLabel }) {
  return (
    <Host matchContents colorScheme="dark" seedColor={Colors.highlight} accessibilityLabel={accessibilityLabel}>
      <DatePicker
        selection={timeStringToDate(value)}
        displayedComponents={['hourAndMinute']}
        onDateChange={(date) => onChange(toTimeString(date))}
        modifiers={[labelsHidden(), datePickerStyle('compact')]}
      />
    </Host>
  );
}
