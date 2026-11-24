/**
 * Tiny in-memory event bus for user activity (quest completed, level-up). Lets side effects such as
 * notifications react to activity without stores importing each other.
 */
const listeners = new Set();

/** @param {{ type: 'quest-completed', title: string, xp: number } | { type: 'level-up', toLevel: number, rankUp: object | null }} event */
export function emitActivityEvent(event) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.warn('[activity-events] listener failed', error);
    }
  }
}

/** @returns {() => void} unsubscribe */
export function subscribeToActivityEvents(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
