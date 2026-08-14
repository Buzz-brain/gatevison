import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const POLL_INTERVALS = {
  REALTIME: 5_000,
  LIVE: 10_000,
  STANDARD: 15_000,
  BACKGROUND: 30_000,
  INFREQUENT: 60_000,
  RARE: 300_000,
} as const;

export const QUERY_KEYS = {
  AUTH: {
    ME: ["auth", "me"] as const,
    SESSION: ["auth", "session"] as const,
  },
  USER: {
    PROFILE: ["user", "profile"] as const,
  },
  HEALTH: ["health"] as const,
  NOTIFICATIONS: {
    ALL: ["notifications"] as const,
  },
  SEARCH: {
    RESULTS: (q: string) => ["search", "results", q] as const,
    RECENT: ["search", "recent"] as const,
    PINNED: ["search", "pinned"] as const,
  },
  RECOGNITION: {
    HISTORY: (page: number, search?: string, decision?: string) =>
      ["recognition", "history", page, search, decision] as const,
    RESULT: (id: string) => ["recognition", "result", id] as const,
    PIPELINE_STATUS: (id: string) => ["recognition", "pipeline", "status", id] as const,
    PIPELINE_METRICS: ["recognition", "pipeline", "metrics"] as const,
    MODELS: ["recognition", "models"] as const,
  },
  CAMERA: {
    STATUS: ["camera", "status"] as const,
  },
  SYSTEM: {
    HEALTH: ["system", "health"] as const,
    MODELS: ["system", "models"] as const,
    VERSION: ["system", "version"] as const,
  },
  GATE: {
    STATISTICS: ["gate", "statistics"] as const,
    ACTIVE: ["gate", "active"] as const,
    TRANSACTIONS: ["gate", "transactions"] as const,
  },
  PIPELINE: {
    STATUS: ["pipeline", "status"] as const,
    METRICS: ["pipeline", "metrics"] as const,
  },
  FACE: {
    MODEL_INFO: ["face", "model-info"] as const,
    HISTORY: ["face", "history"] as const,
  },
  DECISION: {
    STATISTICS: ["decision", "statistics"] as const,
    HISTORY: (page?: number) => ["decision", "history", page] as const,
  },
  REPORTS: {
    ALL: (params?: string) => ["reports", params] as const,
    ANALYTICS: ["reports", "analytics"] as const,
    MANUAL_REVIEWS: ["reports", "manual-reviews"] as const,
  },
  ADMIN: {
    DASHBOARD: ["admin", "dashboard"] as const,
    REVIEWS: ["admin", "reviews"] as const,
    EVENTS: ["admin", "events"] as const,
    HEALTH: ["system", "health"] as const,
    MODELS: ["system", "models"] as const,
    PERFORMANCE: ["system", "performance"] as const,
  },
  IDENTITY: {
    DRIVERS: (search?: string) => ["identity", "drivers", search] as const,
    DRIVER: (id: string) => ["identity", "driver", id] as const,
    VEHICLES: (search?: string) => ["identity", "vehicles", search] as const,
    VEHICLE: (id: string) => ["identity", "vehicle", id] as const,
    POLICIES: (search?: string) => ["identity", "policies", search] as const,
    POLICY: (id: string) => ["identity", "policy", id] as const,
    STATS: ["identity", "stats"] as const,
    ACTIVITY: ["identity", "activity"] as const,
    RELATIONSHIPS: ["identity", "relationships"] as const,
  },
};
