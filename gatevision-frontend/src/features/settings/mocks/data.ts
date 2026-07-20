import type {
  ModelConfig, RecognitionConfig, DecisionWeights, CameraConfig, GateConfig,
  SecurityConfig, NotificationSettings, StorageConfig, BackupConfig,
  MonitoringConfig, AppearanceConfig, AdvancedConfig, AboutInfo,
  ConfigHistoryEntry, ConfigValidation, SettingDefinition,
} from "../types";

export const MOCK_MODELS: ModelConfig[] = [
  { id: "yolo", name: "YOLOv8", version: "8.1.2", device: "GPU", confidenceThreshold: 0.65, enabled: true, modelPath: "/models/yolov8n.pt", performanceMode: "balanced", lastReloaded: "2026-07-14T08:30:00Z" },
  { id: "easyocr", name: "EasyOCR", version: "1.7.1", device: "GPU", confidenceThreshold: 0.70, enabled: true, modelPath: "/models/easyocr.pth", performanceMode: "balanced", lastReloaded: "2026-07-14T08:30:00Z" },
  { id: "insightface", name: "InsightFace", version: "0.7.3", device: "GPU", confidenceThreshold: 0.75, enabled: true, modelPath: "/models/insightface.onnx", performanceMode: "accuracy", lastReloaded: "2026-07-14T08:30:00Z" },
  { id: "resnet50", name: "ResNet-50", version: "2.0.1", device: "GPU", confidenceThreshold: 0.70, enabled: true, modelPath: "/models/resnet50.pth", performanceMode: "balanced", lastReloaded: "2026-07-13T22:00:00Z" },
  { id: "decision", name: "Decision Engine", version: "3.2.0", device: "CPU", confidenceThreshold: 0.60, enabled: true, modelPath: "/models/decision_rules.json", performanceMode: "balanced", lastReloaded: "2026-07-14T08:30:00Z" },
];

export const MOCK_RECOGNITION: RecognitionConfig = {
  plateDetection: { confidence: 0.65, imageSize: 640, nmsThreshold: 0.45, maxPlates: 2 },
  ocr: { minConfidence: 0.70, preprocessing: true, characterValidation: true },
  faceRecognition: { similarityThreshold: 0.75, alignment: true, multipleFaces: false },
  vehicleFingerprint: { similarityThreshold: 0.80, embeddingSize: 512, verificationMode: "balanced" },
};

export const MOCK_DECISION_WEIGHTS: DecisionWeights = { plate: 20, ocr: 30, face: 25, vehicle: 25 };

export const MOCK_CAMERAS: CameraConfig[] = [
  { id: "cam-1", name: "Gate A Main", location: "Main Entrance Gate A", resolution: "1920x1080", fps: 30, brightness: 55, exposure: -2, autoFocus: true, mirror: false, rotation: 0, retryCount: 3, connectionTimeout: 5000, status: "online" },
  { id: "cam-2", name: "Gate B North", location: "North Side Gate B", resolution: "1920x1080", fps: 25, brightness: 60, exposure: -1, autoFocus: true, mirror: false, rotation: 0, retryCount: 3, connectionTimeout: 5000, status: "online" },
  { id: "cam-3", name: "Gate C Service", location: "Service Entrance Gate C", resolution: "2560x1440", fps: 30, brightness: 50, exposure: 0, autoFocus: true, mirror: false, rotation: 180, retryCount: 5, connectionTimeout: 8000, status: "degraded" },
  { id: "cam-4", name: "Parking East", location: "East Parking Lot", resolution: "3840x2160", fps: 20, brightness: 45, exposure: 1, autoFocus: true, mirror: true, rotation: 0, retryCount: 3, connectionTimeout: 5000, status: "online" },
  { id: "cam-5", name: "Perimeter West", location: "West Perimeter Wall", resolution: "1920x1080", fps: 15, brightness: 40, exposure: 2, autoFocus: false, mirror: false, rotation: 0, retryCount: 3, connectionTimeout: 5000, status: "offline" },
  { id: "cam-6", name: "Loading Dock", location: "Loading Dock Area", resolution: "1920x1080", fps: 30, brightness: 60, exposure: -1, autoFocus: true, mirror: false, rotation: 90, retryCount: 3, connectionTimeout: 5000, status: "online" },
];

export const MOCK_GATE_CONFIG: GateConfig = {
  openDelay: 1500, closeDelay: 2000, safetyTimeout: 10000, barrierSpeed: 3,
  emergencyOpen: true, manualOverride: true,
  vehicleDetectionZone: { enabled: true, distance: 5 },
  gateAssignment: { "gate-a": ["cam-1", "cam-6"], "gate-b": ["cam-2"], "gate-c": ["cam-3"] },
};

export const MOCK_SECURITY: SecurityConfig = {
  sessionTimeout: 30, rateLimit: 100, jwtExpiry: 3600, rememberMe: true,
  ipRestrictions: false, roleLock: true, auditLogging: true, mfa: true,
  passwordPolicy: { minLength: 12, requireNumbers: true, requireSymbols: true, requireUppercase: true },
};

export const MOCK_NOTIFICATIONS: NotificationSettings = {
  email: { enabled: true, providers: ["smtp.gatevision.local"], templates: { alert: "alert_email.html", daily: "daily_summary.html" } },
  sms: { enabled: true, providers: ["twilio"], templates: { alert: "alert_sms.txt" } },
  push: { enabled: true, providers: ["fcm"], templates: { alert: "alert_push.json" } },
  inApp: { enabled: true, providers: ["websocket"], templates: { alert: "alert_inapp.json" } },
  webhook: { enabled: false, providers: [], templates: {} },
  quietHours: { enabled: true, start: "22:00", end: "06:00" },
  rules: [
    { id: "nr-1", event: "unauthorized_access", channels: ["sms", "push", "email"], priority: "critical" },
    { id: "nr-2", event: "gate_breach", channels: ["sms", "push"], priority: "critical" },
    { id: "nr-3", event: "model_degraded", channels: ["email", "inApp"], priority: "high" },
    { id: "nr-4", event: "system_maintenance", channels: ["email", "inApp"], priority: "low" },
    { id: "nr-5", event: "daily_report", channels: ["email"], priority: "low" },
  ],
};

export const MOCK_STORAGE: StorageConfig = {
  maxUploadSize: 50, imageRetention: 90, compression: true,
  cleanupFrequency: 24, backupFolder: "/data/backups", storageThreshold: 85,
  used: 2.4 * 1024 * 1024 * 1024 * 1024, total: 8 * 1024 * 1024 * 1024 * 1024,
};

export const MOCK_BACKUP: BackupConfig = {
  automatic: true, frequency: "daily", destination: "s3://gatevision-backups",
  retention: 30, compression: true, encryption: true,
  lastBackup: "2026-07-14T06:00:00Z", lastRestore: "2026-07-10T14:30:00Z",
  size: 1.2 * 1024 * 1024 * 1024 * 1024,
};

export const MOCK_MONITORING: MonitoringConfig = {
  healthCheckInterval: 30, metricsInterval: 15, alertThreshold: 0.8,
  pipelineMonitoring: true, logLevel: "info", performanceSampling: 10, eventRetention: 30,
};

export const MOCK_APPEARANCE: AppearanceConfig = {
  theme: "dark", accentColor: "#3b82f6", layoutDensity: "comfortable",
  sidebarStyle: "default", animations: true, reducedMotion: false,
  chartStyle: "modern", dashboardLayout: "grid",
};

export const MOCK_ADVANCED: AdvancedConfig = {
  developerMode: false, debugLogging: false, apiEndpoints: false,
  experimentalFeatures: false, environment: "production",
  featureFlags: { advanced_analytics: true, beta_alerts: false, new_dashboard: true },
};

export const MOCK_ABOUT: AboutInfo = {
  version: { frontend: "3.2.1", backend: "2.8.0", python: "3.11.4", fastapi: "0.104.1", mongodb: "7.0.2", yolo: "8.1.2", easyocr: "1.7.1", insightface: "0.7.3", resnet50: "2.0.1" },
  license: "MIT License",
  credits: ["Ultralytics YOLO Team", "Jaided AI - EasyOCR", "InsightFace Contributors", "FastAPI Team", "MongoDB Team"],
  repository: "https://github.com/gatevision/gatevision-platform",
  authors: ["GateVision Engineering Team", "AI Security Research Lab"],
  buildDate: "2026-07-14T10:00:00Z",
};

export const MOCK_CONFIG_HISTORY: ConfigHistoryEntry[] = [
  { id: "ch-1", timestamp: "2026-07-14T10:12:00Z", category: "recognition", setting: "OCR Threshold", oldValue: 0.65, newValue: 0.70, changedBy: "admin@gatevision.local", description: "Adjusted OCR minimum confidence" },
  { id: "ch-2", timestamp: "2026-07-14T10:25:00Z", category: "appearance", setting: "Dark Mode", oldValue: false, newValue: true, changedBy: "admin@gatevision.local", description: "Enabled dark mode" },
  { id: "ch-3", timestamp: "2026-07-14T11:02:00Z", category: "backup", setting: "Backup Frequency", oldValue: "weekly", newValue: "daily", changedBy: "sysop@gatevision.local", description: "Increased backup frequency" },
  { id: "ch-4", timestamp: "2026-07-14T11:45:00Z", category: "decision-engine", setting: "Decision Weights Modified", oldValue: JSON.stringify({ plate: 15, ocr: 35, face: 25, vehicle: 25 }), newValue: JSON.stringify({ plate: 20, ocr: 30, face: 25, vehicle: 25 }), changedBy: "admin@gatevision.local", description: "Rebalanced decision weights" },
  { id: "ch-5", timestamp: "2026-07-13T22:00:00Z", category: "ai-models", setting: "YOLO Confidence", oldValue: 0.60, newValue: 0.65, changedBy: "mlops@gatevision.local", description: "Optimized YOLO detection threshold" },
  { id: "ch-6", timestamp: "2026-07-13T16:30:00Z", category: "security", setting: "Session Timeout", oldValue: 15, newValue: 30, changedBy: "admin@gatevision.local", description: "Extended session timeout" },
  { id: "ch-7", timestamp: "2026-07-13T14:00:00Z", category: "cameras", setting: "Gate A Resolution", oldValue: "1280x720", newValue: "1920x1080", changedBy: "tech@gatevision.local", description: "Upgraded gate camera resolution" },
  { id: "ch-8", timestamp: "2026-07-12T09:15:00Z", category: "storage", setting: "Image Retention", oldValue: 180, newValue: 90, changedBy: "admin@gatevision.local", description: "Reduced retention to save space" },
];

export const MOCK_VALIDATIONS: ConfigValidation[] = [
  { id: "cv-1", category: "recognition", setting: "OCR Confidence", currentValue: 0.10, severity: "warning", message: "OCR confidence is set very low", recommendation: "Increase to at least 0.50 to reduce false positives" },
  { id: "cv-2", category: "recognition", setting: "Face Similarity Threshold", currentValue: 0.98, severity: "warning", message: "Face threshold is extremely high", recommendation: "Consider 0.75-0.85 to avoid rejecting valid users" },
  { id: "cv-3", category: "storage", setting: "Cleanup Frequency", currentValue: "Disabled", severity: "error", message: "Storage cleanup is disabled", recommendation: "Enable automatic cleanup to prevent disk overflow" },
  { id: "cv-4", category: "security", setting: "Rate Limit", currentValue: 1000, severity: "info", message: "Rate limit is permissive", recommendation: "Consider lowering to 100 requests/min for better security" },
  { id: "cv-5", category: "backup", setting: "Automatic Backup", currentValue: false, severity: "error", message: "Automatic backup is disabled", recommendation: "Enable automated backups to prevent data loss" },
  { id: "cv-6", category: "ai-models", setting: "YOLO Confidence", currentValue: 0.35, severity: "warning", message: "YOLO confidence is below recommended minimum", recommendation: "Set to at least 0.50 for reliable detection" },
];

export const MOCK_SETTINGS: SettingDefinition[] = [
  { id: "org-name", label: "Organization Name", description: "Legal name of the organization", category: "general", value: "GateVision Security", defaultValue: "GateVision Security", type: "text", tags: ["org", "name"], changedAt: "2026-07-01" },
  { id: "facility-name", label: "Facility Name", description: "Name of this facility/location", category: "general", value: "GateVision HQ", defaultValue: "GateVision HQ", type: "text", tags: ["facility", "location"] },
  { id: "timezone", label: "Timezone", description: "Primary timezone for the system", category: "general", value: "America/New_York", defaultValue: "UTC", recommendedValue: "America/New_York", type: "select", options: [{ value: "UTC", label: "UTC" }, { value: "America/New_York", label: "Eastern (EST/EDT)" }, { value: "America/Chicago", label: "Central (CST/CDT)" }, { value: "America/Denver", label: "Mountain (MST/MDT)" }, { value: "America/Los_Angeles", label: "Pacific (PST/PDT)" }], tags: ["timezone", "time"] },
  { id: "language", label: "Language", description: "System language", category: "general", value: "en-US", defaultValue: "en-US", type: "select", options: [{ value: "en-US", label: "English (US)" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" }, { value: "de", label: "German" }], tags: ["language", "locale"] },
  { id: "date-format", label: "Date Format", description: "Display format for dates", category: "general", value: "MM/DD/YYYY", defaultValue: "MM/DD/YYYY", type: "select", options: [{ value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }], tags: ["date", "format"] },
  { id: "measurement-units", label: "Measurement Units", description: "Unit system for measurements", category: "general", value: "imperial", defaultValue: "imperial", type: "select", options: [{ value: "imperial", label: "Imperial (ft, mph)" }, { value: "metric", label: "Metric (m, km/h)" }], tags: ["units", "measurement"] },
  { id: "auto-save", label: "Auto Save", description: "Automatically save configuration changes", category: "general", value: true, defaultValue: true, type: "boolean", tags: ["save", "auto"] },
  { id: "session-timeout", label: "Session Timeout", description: "Minutes of inactivity before auto-logout", category: "security", value: 30, defaultValue: 30, recommendedValue: 30, type: "slider", min: 5, max: 120, step: 5, unit: "min", tags: ["session", "timeout", "security"], changedAt: "2026-07-13T16:30:00Z" },
  { id: "password-min-length", label: "Minimum Password Length", description: "Minimum characters required for passwords", category: "security", value: 12, defaultValue: 8, recommendedValue: 12, type: "slider", min: 6, max: 32, step: 1, tags: ["password", "security"] },
  { id: "require-numbers", label: "Require Numbers in Password", description: "Passwords must contain at least one number", category: "security", value: true, defaultValue: true, type: "boolean", tags: ["password", "security"] },
  { id: "require-symbols", label: "Require Symbols in Password", description: "Passwords must contain at least one special character", category: "security", value: true, defaultValue: false, recommendedValue: true, type: "boolean", tags: ["password", "security"] },
  { id: "require-uppercase", label: "Require Uppercase in Password", description: "Passwords must contain at least one uppercase letter", category: "security", value: true, defaultValue: true, type: "boolean", tags: ["password", "security"] },
  { id: "mfa", label: "Multi-Factor Authentication", description: "Require MFA for all admin accounts", category: "security", value: true, defaultValue: false, recommendedValue: true, type: "boolean", tags: ["mfa", "security"] },
  { id: "rate-limit", label: "Rate Limit (requests/min)", description: "Maximum API requests per minute per user", category: "security", value: 100, defaultValue: 100, recommendedValue: 100, type: "slider", min: 10, max: 1000, step: 10, tags: ["rate", "limit", "security"] },
  { id: "jwt-expiry", label: "JWT Token Expiry", description: "How long JWT tokens remain valid (seconds)", category: "security", value: 3600, defaultValue: 3600, recommendedValue: 3600, type: "slider", min: 300, max: 86400, step: 300, unit: "s", tags: ["jwt", "token", "security"] },
  { id: "remember-me", label: "Remember Me", description: "Allow persistent login sessions", category: "security", value: true, defaultValue: true, type: "boolean", tags: ["remember", "session"] },
  { id: "ip-restrictions", label: "IP Restrictions", description: "Restrict admin access to whitelisted IPs", category: "security", value: false, defaultValue: false, recommendedValue: true, type: "boolean", tags: ["ip", "restrict", "security"] },
  { id: "role-lock", label: "Role Lock", description: "Prevent admins from modifying their own role", category: "security", value: true, defaultValue: true, type: "boolean", tags: ["role", "lock", "security"] },
  { id: "audit-logging", label: "Audit Logging", description: "Log all configuration changes and access", category: "security", value: true, defaultValue: true, type: "boolean", tags: ["audit", "log"] },
  { id: "theme", label: "Theme", description: "Color theme for the dashboard", category: "appearance", value: "dark", defaultValue: "dark", type: "select", options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }], tags: ["theme", "appearance"], changedAt: "2026-07-14T10:25:00Z" },
  { id: "accent-color", label: "Accent Color", description: "Primary accent color for the UI", category: "appearance", value: "#3b82f6", defaultValue: "#3b82f6", type: "color", tags: ["color", "accent"] },
  { id: "layout-density", label: "Layout Density", description: "Spacing density of the interface", category: "appearance", value: "comfortable", defaultValue: "comfortable", type: "select", options: [{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfortable" }, { value: "spacious", label: "Spacious" }], tags: ["layout", "density"] },
  { id: "sidebar-style", label: "Sidebar Style", description: "Navigation sidebar display mode", category: "appearance", value: "default", defaultValue: "default", type: "select", options: [{ value: "default", label: "Default" }, { value: "compact", label: "Compact" }, { value: "icons", label: "Icons Only" }], tags: ["sidebar", "nav"] },
  { id: "animations", label: "Animations", description: "Enable UI animations and transitions", category: "appearance", value: true, defaultValue: true, type: "boolean", tags: ["animations"] },
  { id: "reduced-motion", label: "Reduced Motion", description: "Minimize animations for accessibility", category: "appearance", value: false, defaultValue: false, type: "boolean", tags: ["motion", "accessibility"] },
  { id: "chart-style", label: "Chart Style", description: "Visual style for charts and graphs", category: "appearance", value: "modern", defaultValue: "modern", type: "select", options: [{ value: "modern", label: "Modern" }, { value: "classic", label: "Classic" }, { value: "minimal", label: "Minimal" }], tags: ["chart", "visualization"] },
  { id: "developer-mode", label: "Developer Mode", description: "Enable developer tools and debug panels", category: "advanced", value: false, defaultValue: false, type: "boolean", tags: ["developer", "debug"], isDangerous: true },
  { id: "debug-logging", label: "Debug Logging", description: "Enable verbose debug logging", category: "advanced", value: false, defaultValue: false, type: "boolean", tags: ["debug", "log"], affectsPerformance: true },
  { id: "api-endpoints", label: "API Endpoints", description: "Show internal API endpoints in UI", category: "advanced", value: false, defaultValue: false, type: "boolean", tags: ["api", "endpoints"], isDangerous: true },
  { id: "experimental-features", label: "Experimental Features", description: "Enable features in active development", category: "advanced", value: false, defaultValue: false, type: "boolean", tags: ["experimental"], isDangerous: true },
  { id: "environment", label: "Environment", description: "Runtime environment mode", category: "advanced", value: "production", defaultValue: "development", type: "select", options: [{ value: "development", label: "Development" }, { value: "staging", label: "Staging" }, { value: "production", label: "Production" }], tags: ["env", "environment"] },
  { id: "image-retention", label: "Image Retention (days)", description: "How long to retain captured images", category: "storage", value: 90, defaultValue: 90, recommendedValue: 90, type: "slider", min: 7, max: 365, step: 1, unit: "days", tags: ["retention", "storage"], changedAt: "2026-07-12T09:15:00Z" },
  { id: "max-upload-size", label: "Max Upload Size (MB)", description: "Maximum file size for uploads", category: "storage", value: 50, defaultValue: 50, type: "slider", min: 1, max: 500, step: 1, unit: "MB", tags: ["upload", "storage"] },
  { id: "storage-compression", label: "Enable Compression", description: "Compress stored images to save space", category: "storage", value: true, defaultValue: true, type: "boolean", tags: ["compress", "storage"] },
  { id: "cleanup-frequency", label: "Cleanup Frequency (hours)", description: "How often to run storage cleanup", category: "storage", value: 24, defaultValue: 24, type: "slider", min: 1, max: 168, step: 1, unit: "hours", tags: ["cleanup", "storage"] },
  { id: "backup-folder", label: "Backup Folder", description: "Local path for backup storage", category: "storage", value: "/data/backups", defaultValue: "/data/backups", type: "text", tags: ["backup", "folder"] },
  { id: "storage-threshold", label: "Storage Warning Threshold (%)", description: "Percentage used before warning", category: "storage", value: 85, defaultValue: 85, type: "slider", min: 50, max: 95, step: 5, unit: "%", tags: ["threshold", "storage"] },
  { id: "auto-backup", label: "Automatic Backup", description: "Enable scheduled automatic backups", category: "backup", value: true, defaultValue: true, type: "boolean", tags: ["backup", "auto"] },
  { id: "backup-frequency", label: "Backup Frequency", description: "How often to perform automatic backups", category: "backup", value: "daily", defaultValue: "weekly", recommendedValue: "daily", type: "select", options: [{ value: "every_1h", label: "Every Hour" }, { value: "every_6h", label: "Every 6 Hours" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }], tags: ["backup", "frequency"], changedAt: "2026-07-14T11:02:00Z" },
  { id: "backup-destination", label: "Backup Destination", description: "Storage location for backups", category: "backup", value: "s3://gatevision-backups", defaultValue: "/data/backups", type: "text", tags: ["backup", "destination"] },
  { id: "backup-retention", label: "Backup Retention (days)", description: "How long to keep backup files", category: "backup", value: 30, defaultValue: 30, type: "slider", min: 1, max: 365, step: 1, unit: "days", tags: ["backup", "retention"] },
  { id: "backup-compression", label: "Backup Compression", description: "Compress backup archives", category: "backup", value: true, defaultValue: true, type: "boolean", tags: ["backup", "compress"] },
  { id: "backup-encryption", label: "Backup Encryption", description: "Encrypt backup files at rest", category: "backup", value: true, defaultValue: true, type: "boolean", tags: ["backup", "encrypt"] },
  { id: "health-check-interval", label: "Health Check Interval (s)", description: "How often to run system health checks", category: "monitoring", value: 30, defaultValue: 30, type: "slider", min: 5, max: 300, step: 5, unit: "s", tags: ["health", "monitor"] },
  { id: "metrics-interval", label: "Metrics Collection (s)", description: "How often to collect performance metrics", category: "monitoring", value: 15, defaultValue: 15, type: "slider", min: 5, max: 120, step: 5, unit: "s", tags: ["metrics", "monitor"] },
  { id: "alert-threshold", label: "Alert Threshold (%)", description: "System load threshold for alerts", category: "monitoring", value: 80, defaultValue: 80, type: "slider", min: 50, max: 99, step: 1, unit: "%", tags: ["alert", "threshold"] },
  { id: "pipeline-monitoring", label: "Pipeline Monitoring", description: "Monitor AI inference pipeline health", category: "monitoring", value: true, defaultValue: true, type: "boolean", tags: ["pipeline", "monitor"] },
  { id: "log-level", label: "Log Level", description: "Minimum severity for log entries", category: "monitoring", value: "info", defaultValue: "info", type: "select", options: [{ value: "debug", label: "Debug" }, { value: "info", label: "Info" }, { value: "warning", label: "Warning" }, { value: "error", label: "Error Only" }], tags: ["log", "level"] },
  { id: "performance-sampling", label: "Performance Sampling (%)", description: "Percentage of requests to profile", category: "monitoring", value: 10, defaultValue: 10, type: "slider", min: 1, max: 100, step: 1, unit: "%", tags: ["sampling", "performance"] },
  { id: "event-retention", label: "Event Retention (days)", description: "How long to keep monitoring events", category: "monitoring", value: 30, defaultValue: 30, type: "slider", min: 1, max: 365, step: 1, unit: "days", tags: ["event", "retention"] },
  { id: "yolo-confidence", label: "YOLO Confidence Threshold", description: "Minimum confidence for plate detection", category: "recognition", value: 0.65, defaultValue: 0.65, recommendedValue: 0.65, type: "slider", min: 0.1, max: 0.99, step: 0.05, tags: ["yolo", "confidence", "detection"], affectsAccuracy: true, affectsPerformance: true, changedAt: "2026-07-13T22:00:00Z" },
  { id: "ocr-confidence", label: "OCR Minimum Confidence", description: "Minimum confidence for OCR character recognition", category: "recognition", value: 0.70, defaultValue: 0.70, recommendedValue: 0.70, type: "slider", min: 0.1, max: 0.99, step: 0.05, tags: ["ocr", "confidence"], affectsAccuracy: true, changedAt: "2026-07-14T10:12:00Z" },
  { id: "face-threshold", label: "Face Similarity Threshold", description: "Minimum similarity for face match", category: "recognition", value: 0.75, defaultValue: 0.75, recommendedValue: 0.75, type: "slider", min: 0.1, max: 0.99, step: 0.05, tags: ["face", "similarity", "recognition"], affectsAccuracy: true },
  { id: "plate-image-size", label: "Plate Image Size (px)", description: "Resolution for plate detection", category: "recognition", value: 640, defaultValue: 640, recommendedValue: 640, type: "slider", min: 320, max: 1280, step: 32, unit: "px", tags: ["plate", "image", "size"], affectsPerformance: true },
  { id: "nms-threshold", label: "NMS Threshold", description: "Non-maximum suppression threshold", category: "recognition", value: 0.45, defaultValue: 0.45, recommendedValue: 0.45, type: "slider", min: 0.1, max: 0.9, step: 0.05, tags: ["nms", "detection"] },
  { id: "max-plates", label: "Max Plates Per Frame", description: "Maximum plates to detect per frame", category: "recognition", value: 2, defaultValue: 2, recommendedValue: 2, type: "slider", min: 1, max: 10, step: 1, tags: ["plates", "max"], affectsPerformance: true },
  { id: "preprocessing", label: "OCR Preprocessing", description: "Apply image preprocessing before OCR", category: "recognition", value: true, defaultValue: true, type: "boolean", tags: ["ocr", "preprocess"] },
  { id: "character-validation", label: "Character Validation", description: "Validate OCR output against license plate patterns", category: "recognition", value: true, defaultValue: true, type: "boolean", tags: ["ocr", "validation"] },
  { id: "face-alignment", label: "Face Alignment", description: "Align faces before comparison", category: "recognition", value: true, defaultValue: true, type: "boolean", tags: ["face", "alignment"] },
  { id: "multiple-faces", label: "Allow Multiple Faces", description: "Detect and process multiple faces per frame", category: "recognition", value: false, defaultValue: false, type: "boolean", tags: ["face", "multiple"], affectsPerformance: true },
  { id: "vehicle-similarity", label: "Vehicle Fingerprint Threshold", description: "Similarity threshold for vehicle matching", category: "recognition", value: 0.80, defaultValue: 0.80, recommendedValue: 0.80, type: "slider", min: 0.1, max: 0.99, step: 0.05, tags: ["vehicle", "fingerprint"], affectsAccuracy: true },
  { id: "embedding-size", label: "Embedding Size", description: "Dimension of vehicle fingerprint vectors", category: "recognition", value: 512, defaultValue: 512, type: "slider", min: 64, max: 2048, step: 64, tags: ["embedding", "vector"], affectsPerformance: true },
  { id: "verification-mode", label: "Verification Mode", description: "Strictness of vehicle verification", category: "recognition", value: "balanced", defaultValue: "balanced", type: "select", options: [{ value: "strict", label: "Strict" }, { value: "balanced", label: "Balanced" }, { value: "relaxed", label: "Relaxed" }], tags: ["verification", "mode"] },
  { id: "gate-open-delay", label: "Gate Open Delay (ms)", description: "Delay before gate opens after approval", category: "gate-control", value: 1500, defaultValue: 1500, type: "slider", min: 0, max: 5000, step: 100, unit: "ms", tags: ["gate", "delay"] },
  { id: "gate-close-delay", label: "Gate Close Delay (ms)", description: "Delay before gate closes after vehicle passes", category: "gate-control", value: 2000, defaultValue: 2000, type: "slider", min: 500, max: 10000, step: 100, unit: "ms", tags: ["gate", "delay"] },
  { id: "safety-timeout", label: "Safety Timeout (ms)", description: "Max time gate stays open before safety override", category: "gate-control", value: 10000, defaultValue: 10000, type: "slider", min: 3000, max: 30000, step: 1000, unit: "ms", tags: ["gate", "safety"] },
  { id: "barrier-speed", label: "Barrier Speed", description: "Gate barrier opening/closing speed", category: "gate-control", value: 3, defaultValue: 3, type: "slider", min: 1, max: 10, step: 1, tags: ["barrier", "speed"] },
  { id: "emergency-open", label: "Emergency Open", description: "Allow emergency override to open all gates", category: "gate-control", value: true, defaultValue: true, type: "boolean", tags: ["emergency", "gate"], isDangerous: true },
  { id: "manual-override", label: "Manual Override", description: "Allow manual gate control from dashboard", category: "gate-control", value: true, defaultValue: true, type: "boolean", tags: ["manual", "override"], isDangerous: true },
];

export function getSettingById(id: string): SettingDefinition | undefined {
  return MOCK_SETTINGS.find((s) => s.id === id);
}

export function searchSettings(query: string): SettingDefinition[] {
  const q = query.toLowerCase();
  return MOCK_SETTINGS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q),
  );
}
