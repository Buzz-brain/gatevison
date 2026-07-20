export type SettingValue = string | number | boolean;

export type SettingCategory =
  | "general"
  | "ai-models"
  | "recognition"
  | "decision-engine"
  | "cameras"
  | "gate-control"
  | "security"
  | "notifications"
  | "storage"
  | "backup"
  | "monitoring"
  | "appearance"
  | "advanced"
  | "about";

export interface SettingDefinition {
  id: string;
  label: string;
  description: string;
  category: SettingCategory;
  value: SettingValue;
  defaultValue: SettingValue;
  recommendedValue?: SettingValue;
  type: "text" | "number" | "boolean" | "select" | "slider" | "color" | "password";
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  tags: string[];
  isDangerous?: boolean;
  requiresRestart?: boolean;
  affectsPerformance?: boolean;
  affectsAccuracy?: boolean;
  changedAt?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  version: string;
  device: "CPU" | "GPU" | "TPU" | "Auto";
  confidenceThreshold: number;
  enabled: boolean;
  modelPath: string;
  performanceMode: "balanced" | "accuracy" | "speed";
  lastReloaded?: string;
}

export interface RecognitionConfig {
  plateDetection: { confidence: number; imageSize: number; nmsThreshold: number; maxPlates: number };
  ocr: { minConfidence: number; preprocessing: boolean; characterValidation: boolean };
  faceRecognition: { similarityThreshold: number; alignment: boolean; multipleFaces: boolean };
  vehicleFingerprint: { similarityThreshold: number; embeddingSize: number; verificationMode: "strict" | "balanced" | "relaxed" };
}

export interface DecisionWeights {
  plate: number;
  ocr: number;
  face: number;
  vehicle: number;
}

export interface DecisionPreview {
  decision: "GRANT" | "DENY" | "MANUAL_REVIEW";
  confidence: number;
  scores: { plate: number; ocr: number; face: number; vehicle: number };
  latency: number;
}

export interface CameraConfig {
  id: string;
  name: string;
  location: string;
  resolution: string;
  fps: number;
  brightness: number;
  exposure: number;
  autoFocus: boolean;
  mirror: boolean;
  rotation: number;
  retryCount: number;
  connectionTimeout: number;
  status: "online" | "offline" | "degraded";
}

export interface GateConfig {
  openDelay: number;
  closeDelay: number;
  safetyTimeout: number;
  barrierSpeed: number;
  emergencyOpen: boolean;
  manualOverride: boolean;
  vehicleDetectionZone: { enabled: boolean; distance: number };
  gateAssignment: Record<string, string[]>;
}

export interface SecurityConfig {
  sessionTimeout: number;
  passwordPolicy: { minLength: number; requireNumbers: boolean; requireSymbols: boolean; requireUppercase: boolean };
  mfa: boolean;
  rateLimit: number;
  jwtExpiry: number;
  rememberMe: boolean;
  ipRestrictions: boolean;
  roleLock: boolean;
  auditLogging: boolean;
}

export interface NotificationSettings {
  email: { enabled: boolean; providers: string[]; templates: Record<string, string> };
  sms: { enabled: boolean; providers: string[]; templates: Record<string, string> };
  push: { enabled: boolean; providers: string[]; templates: Record<string, string> };
  inApp: { enabled: boolean; providers: string[]; templates: Record<string, string> };
  webhook: { enabled: boolean; providers: string[]; templates: Record<string, string> };
  quietHours: { enabled: boolean; start: string; end: string };
  rules: { id: string; event: string; channels: string[]; priority: "low" | "medium" | "high" | "critical" }[];
}

export interface StorageConfig {
  maxUploadSize: number;
  imageRetention: number;
  compression: boolean;
  cleanupFrequency: number;
  backupFolder: string;
  storageThreshold: number;
  used: number;
  total: number;
}

export interface BackupConfig {
  automatic: boolean;
  frequency: string;
  destination: string;
  retention: number;
  compression: boolean;
  encryption: boolean;
  lastBackup?: string;
  lastRestore?: string;
  size?: number;
}

export interface MonitoringConfig {
  healthCheckInterval: number;
  metricsInterval: number;
  alertThreshold: number;
  pipelineMonitoring: boolean;
  logLevel: "debug" | "info" | "warning" | "error";
  performanceSampling: number;
  eventRetention: number;
}

export interface AppearanceConfig {
  theme: "dark" | "light" | "system";
  accentColor: string;
  layoutDensity: "compact" | "comfortable" | "spacious";
  sidebarStyle: "default" | "compact" | "icons";
  animations: boolean;
  reducedMotion: boolean;
  chartStyle: "modern" | "classic" | "minimal";
  dashboardLayout: "grid" | "list" | "columns";
}

export interface AdvancedConfig {
  developerMode: boolean;
  debugLogging: boolean;
  apiEndpoints: boolean;
  experimentalFeatures: boolean;
  environment: "development" | "staging" | "production";
  featureFlags: Record<string, boolean>;
}

export interface AboutInfo {
  version: { frontend: string; backend: string; python: string; fastapi: string; mongodb: string; yolo: string; easyocr: string; insightface: string; resnet50: string };
  license: string;
  credits: string[];
  repository: string;
  authors: string[];
  buildDate: string;
}

export interface ConfigHistoryEntry {
  id: string;
  timestamp: string;
  category: SettingCategory;
  setting: string;
  oldValue: SettingValue;
  newValue: SettingValue;
  changedBy: string;
  description: string;
}

export interface ConfigValidation {
  id: string;
  category: SettingCategory;
  setting: string;
  currentValue: SettingValue;
  severity: "info" | "warning" | "error";
  message: string;
  recommendation: string;
}

export interface ConfigImpact {
  recognitionSpeed: { value: number; direction: "up" | "down"; label: string };
  accuracy: { value: number; direction: "up" | "down"; label: string };
  storage: { value: number; direction: "up" | "down"; label: string };
  security: { value: number; direction: "up" | "down"; label: string };
  latency: { value: number; direction: "up" | "down"; label: string };
}

export interface SimulatorPreset {
  id: string;
  name: string;
  description: string;
  weights: DecisionWeights;
  yoloConfidence: number;
  ocrThreshold: number;
  faceThreshold: number;
}

export interface SimulatorMetrics {
  plateAccuracy: number;
  falsePositiveRate: number;
  inferenceTime: number;
  charAccuracy: number;
  manualReviewRate: number;
  processingTime: number;
  falseAcceptanceRate: number;
  falseRejectionRate: number;
  securityScore: number;
  grantProbability: number;
  denyProbability: number;
  reviewProbability: number;
  overallConfidence: number;
  processingLatency: number;
}

export const SETTING_CATEGORIES: { id: SettingCategory; label: string; icon: string }[] = [
  { id: "general", label: "General", icon: "Settings" },
  { id: "ai-models", label: "AI Models", icon: "BrainCircuit" },
  { id: "recognition", label: "Recognition", icon: "Scan" },
  { id: "decision-engine", label: "Decision Engine", icon: "ArrowUpDown" },
  { id: "cameras", label: "Cameras", icon: "Camera" },
  { id: "gate-control", label: "Gate Control", icon: "ArrowUpDown" },
  { id: "security", label: "Security", icon: "Shield" },
  { id: "notifications", label: "Notifications", icon: "Bell" },
  { id: "storage", label: "Storage", icon: "HardDrive" },
  { id: "backup", label: "Backup & Recovery", icon: "RotateCcw" },
  { id: "monitoring", label: "Monitoring", icon: "Activity" },
  { id: "appearance", label: "Appearance", icon: "Palette" },
  { id: "advanced", label: "Advanced", icon: "Cpu" },
  { id: "about", label: "About", icon: "Info" },
];
