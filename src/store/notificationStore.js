import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
	notifications: [],
	addNotification: (notification) =>
		set((state) => ({ notifications: [notification, ...state.notifications] })),
	markRead: (id) =>
		set((state) => ({
			notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
		})),
	clearAll: () =>
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
		})),
	unreadCount: () => get().notifications.filter((n) => !n.is_read).length,
}));
