import { create } from 'zustand';

import { buildQuestBoard, summarizeQuestBoard } from '@/features/quests/quest-board';
import {
  archiveQuest,
  completeQuest,
  createQuest,
  loadQuestBoardData,
  loadQuestHistory,
  undoQuestCompletion,
  updateQuest,
} from '@/features/quests/quest-service';

import { emitActivityEvent } from './activity-events';
import { applyActivityOutcome } from './apply-activity-outcome';
import { useRewardStore } from './reward-store';

function deriveBoard(quests, activeCompletions, now) {
  const board = buildQuestBoard(quests, activeCompletions, now);
  return { board, summary: summarizeQuestBoard(board) };
}

/**
 * Quest state for the UI. SQLite is the source of truth: every mutation goes through the quest
 * service, then the board is reloaded and re-derived for the current time.
 */
export const useQuestStore = create((set, get) => ({
  quests: [],
  board: [],
  summary: summarizeQuestBoard([]),
  /** 'idle' | 'loading' | 'ready' | 'error' */
  status: 'idle',
  error: null,
  /** Quest ids with a completion/undo in flight, to disable their buttons. */
  pendingQuestIds: {},
  filters: { group: 'all', category: null, hideCompleted: false },
  history: { entries: [], totals: { completedCount: 0, xpTotal: 0 }, status: 'idle', error: null },

  hydrate: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      await get().refresh();
      set({ status: 'ready' });
    } catch (error) {
      set({ status: 'error', error });
    }
  },

  /** Reloads quests and current-period completions, and re-derives the board for `now`. */
  refresh: async (now = new Date()) => {
    const { quests, activeCompletions } = await loadQuestBoardData(now);
    set({ quests, ...deriveBoard(quests, activeCompletions, now) });
  },

  setFilters: (partialFilters) => set((state) => ({ filters: { ...state.filters, ...partialFilters } })),

  completeQuest: (questId) => runForQuest(set, get, questId, () => completeQuest(questId)),

  undoCompletion: (questId, completionId) => runForQuest(set, get, questId, () => undoQuestCompletion(completionId)),

  createQuest: async (input) => {
    const { rewards, ...quest } = await createQuest(input);
    applyActivityOutcome({ progression: null, rewards });
    await Promise.all([get().refresh(), refreshRewards()]);
    return quest;
  },

  updateQuest: async (questId, input) => {
    const quest = await updateQuest(questId, input);
    await get().refresh();
    return quest;
  },

  archiveQuest: async (questId) => {
    await archiveQuest(questId);
    await get().refresh();
  },

  loadHistory: async () => {
    set((state) => ({ history: { ...state.history, status: 'loading', error: null } }));
    try {
      const { entries, totals } = await loadQuestHistory({ limit: 200 });
      set({ history: { entries, totals, status: 'ready', error: null } });
    } catch (error) {
      set((state) => ({ history: { ...state.history, status: 'error', error } }));
    }
  },
}));

/** Runs a completion/undo for one quest: marks it pending, syncs XP and refreshes the board. */
async function runForQuest(set, get, questId, operation) {
  if (get().pendingQuestIds[questId]) return null;
  set((state) => ({ pendingQuestIds: { ...state.pendingQuestIds, [questId]: true } }));
  try {
    const outcome = await operation();
    applyActivityOutcome(outcome);
    if (outcome.status === 'completed') {
      emitActivityEvent({ type: 'quest-completed', title: outcome.completion.questTitle, xp: outcome.completion.xpAwarded });
    }
    await Promise.all([get().refresh(), refreshRewards()]);
    return outcome;
  } finally {
    set((state) => {
      const { [questId]: _finished, ...stillPending } = state.pendingQuestIds;
      return { pendingQuestIds: stillPending };
    });
  }
}

/** Reward screens show challenge/boss/achievement progress, which every quest action can change. */
function refreshRewards() {
  return useRewardStore
    .getState()
    .refresh()
    .catch((error) => console.warn('[quests] Failed to refresh rewards', error));
}
