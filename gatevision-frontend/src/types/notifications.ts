export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, string>;
}

export type NotificationType = "info" | "warning" | "error" | "success";

export type NotificationCategory =
  | "security"
  | "system"
  | "manual_review"
  | "recognition"
  | "updates";

export type NotificationGroupLabel = "Today" | "Yesterday" | "This Week" | "Earlier";

export interface NotificationGroup {
  label: NotificationGroupLabel;
  notifications: AppNotification[];
}

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
}
