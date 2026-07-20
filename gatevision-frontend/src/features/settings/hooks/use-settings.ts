import { useState, useCallback, useMemo } from "react";
import type {
  ModelConfig, RecognitionConfig, DecisionWeights, CameraConfig,
  GateConfig, SecurityConfig, NotificationSettings, StorageConfig,
  BackupConfig, MonitoringConfig, AppearanceConfig, AdvancedConfig,
  ConfigHistoryEntry, ConfigValidation, SettingCategory, SettingDefinition,
  DecisionPreview, SimulatorMetrics,
} from "../types";
import {
  MOCK_MODELS, MOCK_RECOGNITION, MOCK_DECISION_WEIGHTS, MOCK_CAMERAS,
  MOCK_GATE_CONFIG, MOCK_SECURITY, MOCK_NOTIFICATIONS, MOCK_STORAGE,
  MOCK_BACKUP, MOCK_MONITORING, MOCK_APPEARANCE, MOCK_ADVANCED,
  MOCK_CONFIG_HISTORY, MOCK_VALIDATIONS, MOCK_SETTINGS, searchSettings,
} from "../mocks/data";
import { computeImpact, computeSimulatorMetrics } from "../utils";

export function useSettings() {
  const [activeTab, setActiveTab] = useState<SettingCategory>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<ModelConfig[]>(MOCK_MODELS);
  const [recognition, setRecognition] = useState<RecognitionConfig>(MOCK_RECOGNITION);
  const [weights, setWeights] = useState<DecisionWeights>(MOCK_DECISION_WEIGHTS);
  const [cameras, setCameras] = useState<CameraConfig[]>(MOCK_CAMERAS);
  const [gateConfig, setGateConfig] = useState<GateConfig>(MOCK_GATE_CONFIG);
  const [security, setSecurity] = useState<SecurityConfig>(MOCK_SECURITY);
  const [notifications, setNotifications] = useState<NotificationSettings>(MOCK_NOTIFICATIONS);
  const [storage, setStorage] = useState<StorageConfig>(MOCK_STORAGE);
  const [backup, setBackup] = useState<BackupConfig>(MOCK_BACKUP);
  const [monitoring, setMonitoring] = useState<MonitoringConfig>(MOCK_MONITORING);
  const [appearance, setAppearance] = useState<AppearanceConfig>(MOCK_APPEARANCE);
  const [advanced, setAdvanced] = useState<AdvancedConfig>(MOCK_ADVANCED);
  const [history, setHistory] = useState<ConfigHistoryEntry[]>(MOCK_CONFIG_HISTORY);
  const [validations] = useState<ConfigValidation[]>(MOCK_VALIDATIONS);

  const allSettings: SettingDefinition[] = MOCK_SETTINGS;

  const filteredSettings = useMemo(() => {
    if (!searchQuery) return [];
    return searchSettings(searchQuery);
  }, [searchQuery]);

  const decisionPreview: DecisionPreview = useMemo(() => {
    const w = weights;
    const scores = {
      plate: 0.85 + (Math.random() - 0.5) * 0.2,
      ocr: 0.90 + (Math.random() - 0.5) * 0.15,
      face: 0.75 + (Math.random() - 0.5) * 0.3,
      vehicle: 0.88 + (Math.random() - 0.5) * 0.2,
    };
    const total = w.plate + w.ocr + w.face + w.vehicle;
    const weighted =
      (scores.plate * w.plate + scores.ocr * w.ocr + scores.face * w.face + scores.vehicle * w.vehicle) / total;
    const decision = weighted > 0.8 ? "GRANT" : weighted > 0.5 ? "MANUAL_REVIEW" : "DENY";
    return { decision, confidence: Math.round(weighted * 100), scores, latency: Math.round(45 + Math.random() * 30) };
  }, [weights]);

  const simulatorMetrics: SimulatorMetrics = useMemo(() => {
    const yCfg = models.find((m) => m.id === "yolo");
    const oCfg = models.find((m) => m.id === "easyocr");
    const fCfg = models.find((m) => m.id === "insightface");
    return computeSimulatorMetrics({
      yoloConfidence: yCfg?.confidenceThreshold ?? 0.65,
      ocrThreshold: recognition.ocr.minConfidence,
      faceThreshold: recognition.faceRecognition.similarityThreshold,
      weights,
    });
  }, [models, recognition, weights]);

  const impact = useMemo(() => {
    const yCfg = models.find((m) => m.id === "yolo");
    return computeImpact({
      yoloConfidence: yCfg?.confidenceThreshold ?? 0.65,
      ocrThreshold: recognition.ocr.minConfidence,
      faceThreshold: recognition.faceRecognition.similarityThreshold,
      weights,
    });
  }, [models, recognition, weights]);

  const updateModels = useCallback((id: string, update: Partial<ModelConfig>) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...update } : m)));
  }, []);

  const updateRecognition = useCallback((update: Partial<RecognitionConfig>) => {
    setRecognition((prev) => ({ ...prev, ...update }));
  }, []);

  const updateWeights = useCallback((update: Partial<DecisionWeights>) => {
    setWeights((prev) => ({ ...prev, ...update }));
  }, []);

  const updateCameras = useCallback((id: string, update: Partial<CameraConfig>) => {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)));
  }, []);

  const addHistoryEntry = useCallback((entry: ConfigHistoryEntry) => {
    setHistory((prev) => [entry, ...prev]);
  }, []);

  const cameraCategories = useMemo(() => {
    const cats: Record<string, CameraConfig[]> = {};
    for (const cam of cameras) {
      const cat = cam.status === "online" ? "online" : cam.status === "degraded" ? "degraded" : "offline";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(cam);
    }
    return cats;
  }, [cameras]);

  return {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    models, updateModels,
    recognition, setRecognition, updateRecognition,
    weights, updateWeights,
    decisionPreview,
    simulatorMetrics,
    impact,
    cameras, cameraCategories, updateCameras,
    gateConfig, setGateConfig,
    security, setSecurity,
    notifications, setNotifications,
    storage, setStorage,
    backup, setBackup,
    monitoring, setMonitoring,
    appearance, setAppearance,
    advanced, setAdvanced,
    history,
    validations,
    allSettings,
    filteredSettings,
    addHistoryEntry,
  };
}
