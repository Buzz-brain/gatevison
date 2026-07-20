import { create } from "zustand";
import type { AppNotification as Notification } from "@/types/notifications";

interface UIState {
  notifications: Notification[];
  globalLoading: boolean;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

let notifId = 0;

export const useUIStore = create<UIState>()((set) => ({
  notifications: [],
  globalLoading: false,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `notif-${++notifId}`,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
