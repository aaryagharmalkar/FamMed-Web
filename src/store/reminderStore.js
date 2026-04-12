import { create } from 'zustand';

export const useReminderStore = create((set) => ({
  viewMode: 'todayView',
  memberFilter: null,
  pendingActions: [],
  toggleView: () =>
    set((state) => ({
      viewMode: state.viewMode === 'todayView' ? 'weekView' : 'todayView',
    })),
  filterByMember: (profileId) => set({ memberFilter: profileId }),
  enqueueAction: (action) => set((state) => ({ pendingActions: [...state.pendingActions, action] })),
  dequeueAction: () =>
    set((state) => ({
      pendingActions: state.pendingActions.slice(1),
    })),
}));
