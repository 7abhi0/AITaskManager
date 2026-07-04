import { create } from 'zustand';
import api from '../utils/api';
import { INotification } from '../shared/types';
import { useTaskStore } from './useTaskStore';

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setupSocketListener: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      const { notifications, unreadCount } = response.data.data;
      set({ notifications, unreadCount });
    } catch (error) {}
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(state.unreadCount - 1, 0),
      }));
    } catch (error) {}
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/mark-all-read');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {}
  },

  setupSocketListener: () => {
    const socket = useTaskStore.getState().socket;
    if (!socket) return;

    // Listen for new notifications
    socket.off('notification'); // Prevent double binding
    socket.on('notification', (notification: INotification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });
  },
}));
