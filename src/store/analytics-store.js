import { create } from 'zustand';

import { buildAnalytics } from '@/features/analytics/analytics-engine';
import { loadAnalyticsData } from '@/features/analytics/analytics-service';

/**
 * Analytics for the selected range. Raw activity is loaded once per visit; switching ranges only
 * recomputes (pure, in memory) — no extra database reads.
 */
export const useAnalyticsStore = create((set, get) => ({
  rangeDays: 30,
  rawData: null,
  analytics: null,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: get().rawData ? 'refreshing' : 'loading', error: null });
    try {
      const rawData = await loadAnalyticsData();
      set({ rawData, analytics: buildAnalytics(rawData, { now: new Date(), rangeDays: get().rangeDays }), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error });
    }
  },

  setRange: (rangeDays) => {
    const { rawData } = get();
    set({ rangeDays, analytics: rawData ? buildAnalytics(rawData, { now: new Date(), rangeDays }) : null });
  },
}));
