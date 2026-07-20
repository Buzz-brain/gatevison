import type { ConfigImpact, SimulatorMetrics, SimulatorPreset, DecisionWeights } from "./types";

export function formatTimestamp(date: string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function computeImpact(params: {
  yoloConfidence: number;
  ocrThreshold: number;
  faceThreshold: number;
  weights: DecisionWeights;
}): ConfigImpact {
  const { yoloConfidence, ocrThreshold, faceThreshold } = params;
  return {
    recognitionSpeed: {
      value: Math.round(85 + (yoloConfidence - 0.5) * 20),
      direction: yoloConfidence > 0.7 ? "down" : "up",
      label: yoloConfidence > 0.7 ? "Slower" : "Faster",
    },
    accuracy: {
      value: Math.round(70 + (yoloConfidence + ocrThreshold + faceThreshold) / 3 * 40),
      direction: (yoloConfidence + ocrThreshold + faceThreshold) / 3 > 0.6 ? "up" : "down",
      label: (yoloConfidence + ocrThreshold + faceThreshold) / 3 > 0.6 ? "Higher" : "Lower",
    },
    storage: {
      value: Math.round(30 + (1 - yoloConfidence) * 50),
      direction: yoloConfidence > 0.7 ? "up" : "down",
      label: yoloConfidence > 0.7 ? "Increased" : "Reduced",
    },
    security: {
      value: Math.round(50 + faceThreshold * 50),
      direction: faceThreshold > 0.7 ? "up" : "down",
      label: faceThreshold > 0.7 ? "Higher" : "Lower",
    },
    latency: {
      value: Math.round(20 + (1 - yoloConfidence) * 80),
      direction: yoloConfidence > 0.6 ? "up" : "down",
      label: yoloConfidence > 0.6 ? "Higher" : "Lower",
    },
  };
}

export function computeSimulatorMetrics(params: {
  yoloConfidence: number;
  ocrThreshold: number;
  faceThreshold: number;
  weights: DecisionWeights;
}): SimulatorMetrics {
  const { yoloConfidence, ocrThreshold, faceThreshold, weights } = params;
  const w = weights;
  const total = w.plate + w.ocr + w.face + w.vehicle;
  const wp = total > 0 ? w.plate / total : 0.25;
  const wo = total > 0 ? w.ocr / total : 0.25;
  const wf = total > 0 ? w.face / total : 0.25;
  const wv = total > 0 ? w.vehicle / total : 0.25;

  const plateAcc = 80 + yoloConfidence * 18;
  const fpRate = (1 - yoloConfidence) * 0.15;
  const infTime = 20 + (1 - yoloConfidence) * 60;
  const charAcc = 70 + ocrThreshold * 28;
  const mrRate = (1 - ocrThreshold) * 0.4;
  const procTime = 15 + (1 - ocrThreshold) * 35;
  const far = (1 - faceThreshold) * 0.1;
  const frr = faceThreshold * 0.15;
  const secScore = 40 + (1 - far) * 30 + (1 - frr) * 30;
  const overallConf = (yoloConfidence * wp + ocrThreshold * wo + faceThreshold * wf + 0.85 * wv);
  const grantProb = Math.min(0.95, overallConf * 0.9 + 0.05);
  const denyProb = Math.max(0.01, (1 - overallConf) * 0.7);
  const revProb = 1 - grantProb - denyProb;

  return {
    plateAccuracy: Math.min(99, Math.round(plateAcc * 10) / 10),
    falsePositiveRate: Math.round(fpRate * 1000) / 1000,
    inferenceTime: Math.round(infTime * 10) / 10,
    charAccuracy: Math.min(99, Math.round(charAcc * 10) / 10),
    manualReviewRate: Math.round(mrRate * 100),
    processingTime: Math.round(procTime * 10) / 10,
    falseAcceptanceRate: Math.round(far * 1000) / 1000,
    falseRejectionRate: Math.round(frr * 1000) / 1000,
    securityScore: Math.min(100, Math.round(secScore)),
    grantProbability: Math.round(grantProb * 100),
    denyProbability: Math.round(denyProb * 100),
    reviewProbability: Math.round(revProb * 100),
    overallConfidence: Math.round(overallConf * 100),
    processingLatency: Math.round(infTime + procTime),
  };
}

export const SIMULATOR_PRESETS: SimulatorPreset[] = [
  {
    id: "balanced",
    name: "Balanced Mode",
    description: "Default configuration balancing speed and accuracy",
    weights: { plate: 25, ocr: 25, face: 25, vehicle: 25 },
    yoloConfidence: 0.65,
    ocrThreshold: 0.70,
    faceThreshold: 0.75,
  },
  {
    id: "performance",
    name: "Performance Optimized",
    description: "Maximizes throughput for high-volume periods",
    weights: { plate: 30, ocr: 35, face: 20, vehicle: 15 },
    yoloConfidence: 0.50,
    ocrThreshold: 0.55,
    faceThreshold: 0.60,
  },
  {
    id: "security",
    name: "Security Optimized",
    description: "Highest accuracy for sensitive areas",
    weights: { plate: 20, ocr: 25, face: 35, vehicle: 20 },
    yoloConfidence: 0.85,
    ocrThreshold: 0.90,
    faceThreshold: 0.95,
  },
  {
    id: "current",
    name: "Current Configuration",
    description: "Your current active settings",
    weights: { plate: 20, ocr: 30, face: 25, vehicle: 25 },
    yoloConfidence: 0.65,
    ocrThreshold: 0.70,
    faceThreshold: 0.75,
  },
];

export const DEVICE_OPTIONS = [
  { value: "Auto", label: "Auto Detect" },
  { value: "CPU", label: "CPU" },
  { value: "GPU", label: "GPU (CUDA)" },
  { value: "TPU", label: "TPU" },
];

export const PERFORMANCE_OPTIONS = [
  { value: "balanced", label: "Balanced" },
  { value: "accuracy", label: "High Accuracy" },
  { value: "speed", label: "High Speed" },
];

export const THEME_OPTIONS = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export const RESOLUTION_OPTIONS = [
  { value: "1920x1080", label: "1080p (1920x1080)" },
  { value: "2560x1440", label: "1440p (2560x1440)" },
  { value: "3840x2160", label: "4K (3840x2160)" },
  { value: "640x480", label: "VGA (640x480)" },
];

export const LOG_LEVEL_OPTIONS = [
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error Only" },
];

export const ENV_OPTIONS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

export const DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export const VERIFICATION_OPTIONS = [
  { value: "strict", label: "Strict" },
  { value: "balanced", label: "Balanced" },
  { value: "relaxed", label: "Relaxed" },
];

export const BACKUP_FREQ_OPTIONS = [
  { value: "every_1h", label: "Every Hour" },
  { value: "every_6h", label: "Every 6 Hours" },
  { value: "every_12h", label: "Every 12 Hours" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export const SIDEBAR_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "compact", label: "Compact" },
  { value: "icons", label: "Icons Only" },
];

export const CHART_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "minimal", label: "Minimal" },
];

export const LAYOUT_OPTIONS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "columns", label: "Columns" },
];
