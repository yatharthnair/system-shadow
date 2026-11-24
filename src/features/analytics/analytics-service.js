import { runExclusiveWrite } from '@/database/exclusive-write';

import { readAnalyticsData } from './analytics-repository';

/** Reads the raw activity analytics are computed from. Queued with other DB work for consistency. */
export function loadAnalyticsData() {
  return runExclusiveWrite((txn) => readAnalyticsData(txn));
}
