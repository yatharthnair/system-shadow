import { Alert } from 'react-native';

/** Native alert for a failed action (e.g. a quest period ended before an undo). */
export function showSystemError(error) {
  Alert.alert('System', error?.message ?? 'Something went wrong. Please try again.');
}
