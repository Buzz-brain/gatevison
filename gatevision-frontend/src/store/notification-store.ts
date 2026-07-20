import { create } from "zustand";
import type { AppNotification, NotificationGroup } from "@/types/notifications";
import { mockNotificationService } from "@/services/mock/notifications.service";

function groupNotifications(notifications: AppNotification[]): NotificationGroup[] {
  const now = new Date();
  const today = notifications.filter((n) => {
    const d = new Date(n.timestamp);
    return d.toDateString() === now.toDateString();
  });
  const yesterday = notifications.filter((n) => {
    const d = new Date(n.timestamp);
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  });
  const thisWeek = notifications.filter((n) => {
    const d = new Date(n.timestamp);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d > weekAgo && !today.includes(n) && !yesterday.includes(n);
  });
  const earlier = notifications.filter(
    (n) => !today.includes(n) && !yesterday.includes(n) && !thisWeek.includes(n),
  );

  const groups: NotificationGroup[] = [];
  if (today.length) groups.push({ label: "Today", notifications: today });
  if (yesterday.length) groups.push({ label: "Yesterday", notifications: yesterday });
  if (thisWeek.length) groups.push({ label: "This Week", notifications: thisWeek });
  if (earlier.length) groups.push({ label: "Earlier", notifications: earlier });
  return groups;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  groups: NotificationGroup[];
  isLoading: boolean;
}

interface NotificationStoreActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

type NotificationStore = NotificationStoreState & NotificationStoreActions;

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  groups: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    const notifications = await mockNotificationService.getAll();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const groups = groupNotifications(notifications);
    set({ notifications, unreadCount, groups, isLoading: false });
  },

  markAsRead: async (id) => {
    await mockNotificationService.markAsRead(id);
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    const groups = groupNotifications(notifications);
    set({ notifications, unreadCount, groups });
  },

  markAllAsRead: async () => {
    await mockNotificationService.markAllAsRead();
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    const groups = groupNotifications(notifications);
    set({ notifications, unreadCount: 0, groups });
  },

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
}));
