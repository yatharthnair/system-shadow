/**
 * Built-in quests seeded on first launch (and when new templates are added in an update).
 * `templateId` is permanent: seeding is keyed on it, so edited or archived system quests are
 * never recreated. Add new templates freely; never reuse or rename an id.
 */
export const QUEST_TEMPLATES = [
  { templateId: 'daily-strength-session', title: '50 push-ups', category: 'fitness', difficulty: 'normal', cadence: 'daily' },
  { templateId: 'daily-steps', title: 'Walk 8,000 steps', category: 'fitness', difficulty: 'easy', cadence: 'daily' },
  { templateId: 'daily-hydration', title: 'Drink 2 L of water', category: 'nutrition', difficulty: 'easy', cadence: 'daily' },
  { templateId: 'daily-sleep', title: 'Sleep 7+ hours', category: 'recovery', difficulty: 'normal', cadence: 'daily' },
  { templateId: 'daily-deep-work', title: '1 hour of deep work', category: 'career', difficulty: 'normal', cadence: 'daily' },
  { templateId: 'daily-family-checkin', title: 'Check in with family', category: 'family', difficulty: 'easy', cadence: 'daily' },
  { templateId: 'weekly-run-10k', title: 'Run 10 km this week', category: 'fitness', difficulty: 'hard', cadence: 'weekly' },
  { templateId: 'weekly-meet-friend', title: 'See a friend in person', category: 'social', difficulty: 'normal', cadence: 'weekly' },
  { templateId: 'weekly-meal-prep', title: 'Meal prep for the week', category: 'nutrition', difficulty: 'normal', cadence: 'weekly' },
  { templateId: 'weekly-stream', title: 'Go live for 2 hours', category: 'livestreaming', difficulty: 'normal', cadence: 'weekly' },
  { templateId: 'weekly-vod-review', title: 'Review a gameplay VOD', category: 'gaming', difficulty: 'easy', cadence: 'weekly' },
];
