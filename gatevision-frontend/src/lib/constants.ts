export const APP_NAME = "GateVision";
export const APP_VERSION = "1.0.0";

export const ROUTES = {
  DASHBOARD: "/",
  IDENTITY: "/identity",
  GATE_OPERATIONS: "/gate-operations",
  REPORTS: "/reports",
  SYSTEM: "/system",
  SETTINGS: "/settings",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
  },
  DASHBOARD: "/admin/dashboard",
  SYSTEM: {
    HEALTH: "/system/health",
    MODELS: "/system/health/models",
    PERFORMANCE: "/system/performance",
    CONFIGURATION: "/system/configuration",
    VERSION: "/system/version",
    STORAGE: "/system/storage",
    BACKUPS: "/system/backups",
  },
} as const;

export const QUERY_KEYS = {
  AUTH: {
    ME: ["auth", "me"],
  },
  DASHBOARD: ["dashboard"],
  SYSTEM: {
    HEALTH: ["system", "health"],
    MODELS: ["system", "models"],
    PERFORMANCE: ["system", "performance"],
    CONFIGURATION: ["system", "configuration"],
    VERSION: ["system", "version"],
    STORAGE: ["system", "storage"],
  },
} as const;
