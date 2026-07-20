import type { SearchResult, RecentSearch, PinnedAction } from "@/types/search";

const mockResults: SearchResult[] = [
  { id: "s-1", type: "page", title: "Dashboard", description: "System overview and metrics", url: "/" },
  { id: "s-2", type: "page", title: "Live Monitoring", description: "Real-time camera feeds", url: "/live-monitoring" },
  { id: "s-3", type: "page", title: "Access Control", description: "Gate permissions and rules", url: "/access-control" },
  { id: "s-4", type: "page", title: "Identity", description: "Vehicle and driver management", url: "/identity" },
  { id: "s-5", type: "page", title: "Gate Operations", description: "Barrier and queue management", url: "/gate-operations" },
  { id: "s-6", type: "page", title: "Reports", description: "Analytics and audit logs", url: "/reports" },
  { id: "s-7", type: "page", title: "System", description: "Health, models, and configuration", url: "/system" },
  { id: "s-8", type: "page", title: "Settings", description: "Preferences and parameters", url: "/settings" },
  { id: "s-9", type: "vehicle", title: "ABC-123X", description: "Toyota Camry 2024 — White", metadata: { plate: "ABC-123X", owner: "Acme Corp" } },
  { id: "s-10", type: "vehicle", title: "XYZ-789G", description: "Ford Transit 2023 — Blue", metadata: { plate: "XYZ-789G", owner: "FastLogistics" } },
  { id: "s-11", type: "driver", title: "Alex Drake", description: "Administrator — Security clearance Level 4" },
  { id: "s-12", type: "driver", title: "Sarah Chen", description: "Security Officer — Gate B" },
  { id: "s-13", type: "report", title: "Weekly Traffic Report", description: "Jul 5–11, 2025" },
  { id: "s-14", type: "report", title: "Access Log Audit", description: "Q2 2025 — Compliance review" },
  { id: "s-15", type: "setting", title: "Notification Preferences", description: "Configure alerts and channels" },
  { id: "s-16", type: "setting", title: "Security Policies", description: "Password and session rules" },
];

export const mockSearchService = {
  async search(query: string): Promise<SearchResult[]> {
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 150));
    const q = query.toLowerCase();
    if (!q) return [];
    return mockResults.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.metadata?.plate?.toLowerCase().includes(q),
    );
  },

  async getRecentSearches(): Promise<RecentSearch[]> {
    return [
      { id: "rs-1", query: "ABC-123X", timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: "rs-2", query: "Gate B", timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: "rs-3", query: "Sarah Chen", timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  },

  async getPinnedActions(): Promise<PinnedAction[]> {
    return [
      { id: "pa-1", label: "New Vehicle Registration", icon: "Car", action: () => {} },
      { id: "pa-2", label: "Quick Report", icon: "FileText", action: () => {} },
      { id: "pa-3", label: "Emergency Override", icon: "AlertTriangle", action: () => {} },
    ];
  },

  async saveRecentSearch(query: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
  },

  async clearRecentSearches(): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
  },
};
