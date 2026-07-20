import type { AppNotification, NotificationCategory, NotificationType } from "@/types/notifications";

interface MockNotification {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  description?: string;
}

const mockData: MockNotification[] = [
  { type: "warning", category: "security", title: "Unauthorized access attempt", description: "Gate B - Vehicle ABC-123 failed 3x" },
  { type: "success", category: "recognition", title: "Plate recognized", description: "Camera 4 — Match confidence 98.7%" },
  { type: "info", category: "system", title: "Model updated", description: "YOLOv8 — v2.4.1 deployed successfully" },
  { type: "warning", category: "manual_review", title: "Manual review required", description: "Vehicle XYZ-789 — Low confidence match" },
  { type: "error", category: "security", title: "Gate communication lost", description: "Service Gate — Offline for 12 minutes" },
  { type: "info", category: "updates", title: "Weekly report ready", description: "Traffic analysis — Last 7 days" },
  { type: "success", category: "recognition", title: "Facial match", description: "Driver J. M. — Authorized personnel" },
  { type: "warning", category: "system", title: "CPU threshold exceeded", description: "Inference server — 87% utilization" },
  { type: "info", category: "security", title: "Shift change", description: "Officer K. Chen — Checked in" },
  { type: "success", category: "updates", title: "Backup completed", description: "System state — 2025-07-11 03:00 UTC" },
  { type: "error", category: "manual_review", title: "Overdue review", description: "12 pending recognitions — Exceeded 24h SLA" },
  { type: "info", category: "recognition", title: "Vehicle fingerprint stored", description: "New vehicle — Plate KDM-452G" },
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

export const mockNotificationService = {
  async getAll(): Promise<AppNotification[]> {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
    return mockData.map((m, i) => ({
      id: `notif-${i + 1}`,
      ...m,
      timestamp: i < 3 ? hoursAgo(i + 1) : i < 6 ? hoursAgo(i + 10) : hoursAgo(i * 12 + 48),
      read: i >= 3,
    }));
  },

  async markAsRead(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
  },

  async markAllAsRead(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
  },

  async getUnreadCount(): Promise<number> {
    await new Promise((r) => setTimeout(r, 50));
    return mockData.filter((_, i) => i < 3).length;
  },
};
