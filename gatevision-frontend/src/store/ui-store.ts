import { create } from "zustand";
import type { AppNotification as Notification } from "@/types/notifications";

interface UIState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  removeNotification: (id: string) => void;
}

let notifId = 0;

export const useUIStore = create<UIState>()((set) => ({
  notifications: [],
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
}));