import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  useSystemHealth, useSystemModels, useSystemDatabase,
  useSystemPerformance, useSystemStorageInfo,
  useSystemVersion, useSystemLogStatistics,
  useSystemBackups,
} from "./use-system-api";
import {
  mapOverallHealth, mapAiModels, mapPerfMetrics,
  mapStorageInfo, mapVersionInfo, mapBackupRecords,
  mapLogEntries, mapAlerts, generateEvents,
} from "../api/mapper";
import type { AiModelInfo, CameraInfo, InfrastructureMetric, PipelineStatus, SecurityHealth, TopologyData, LogEntry, Alert, LogLevel, AlertSeverity } from "../types";

function generateInfraMetrics(): InfrastructureMetric[] {
  const now = Date.now();
  return [
    { id: "cpu", label: "CPU Usage", current: +(Math.random() * 30 + 40).toFixed(1), peak: 94.2, average: 55.1, unit: "%", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 50 + 30).toFixed(1) })) },
    { id: "memory", label: "Memory", current: +(Math.random() * 20 + 60).toFixed(1), peak: 88.3, average: 65.2, unit: "%", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 30 + 50).toFixed(1) })) },
    { id: "disk", label: "Disk Usage", current: +(Math.random() * 10 + 70).toFixed(1), peak: 82.1, average: 76.5, unit: "%", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 10 + 70).toFixed(1) })) },
    { id: "gpu", label: "GPU Load", current: +(Math.random() * 40 + 30).toFixed(1), peak: 92.7, average: 38.9, unit: "%", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 60 + 20).toFixed(1) })) },
    { id: "network", label: "Network I/O", current: +(Math.random() * 400 + 150).toFixed(1), peak: 890.2, average: 210.3, unit: "Mbps", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 600 + 100).toFixed(1) })) },
    { id: "processes", label: "Active Processes", current: Math.round(Math.random() * 40 + 100), peak: 156, average: 112, unit: "count", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 50 + 90).toFixed(0) })) },
    { id: "threads", label: "Threads", current: Math.round(Math.random() * 300 + 700), peak: 1240, average: 780, unit: "count", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 400 + 600).toFixed(0) })) },
    { id: "temperature", label: "Temperature", current: +(Math.random() * 10 + 65).toFixed(1), peak: 84.6, average: 68.1, unit: "C", trend: Array.from({ length: 12 }, (_, i) => ({ timestamp: `${i}m`, value: +(Math.random() * 15 + 60).toFixed(1) })) },
  ];
}

function generateCameras(): CameraInfo[] {
  return [
    { id: "cam-1", name: "Gate A - Entry", status: "online", fps: 30, resolution: "1920x1080", connection: "GigE", lastFrame: new Date().toISOString(), bandwidth: 45.2, temperature: 42.1, latency: 12, signal: 92, location: "Main Gate Entry" },
    { id: "cam-2", name: "Gate A - Exit", status: "online", fps: 30, resolution: "1920x1080", connection: "GigE", lastFrame: new Date().toISOString(), bandwidth: 44.8, temperature: 41.5, latency: 11, signal: 95, location: "Main Gate Exit" },
    { id: "cam-3", name: "Gate B - Entry", status: "degraded", fps: 18, resolution: "1280x720", connection: "WiFi", lastFrame: new Date().toISOString(), bandwidth: 22.3, temperature: 48.7, latency: 34, signal: 62, location: "West Wing Entry" },
    { id: "cam-4", name: "Parking Lot A", status: "online", fps: 15, resolution: "2560x1440", connection: "GigE", lastFrame: new Date().toISOString(), bandwidth: 68.1, temperature: 38.2, latency: 8, signal: 98, location: "Parking Lot A" },
    { id: "cam-5", name: "Loading Dock", status: "offline", fps: 0, resolution: "1920x1080", connection: "GigE", lastFrame: new Date(Date.now() - 1800000).toISOString(), bandwidth: 0, temperature: 35.0, latency: 0, signal: 0, location: "Loading Dock" },
    { id: "cam-6", name: "Visitor Entry", status: "reconnecting", fps: 0, resolution: "1920x1080", connection: "WiFi", lastFrame: new Date(Date.now() - 300000).toISOString(), bandwidth: 5.2, temperature: 44.3, latency: 120, signal: 28, location: "Visitor Center" },
    { id: "cam-7", name: "Gate B - Exit", status: "online", fps: 30, resolution: "1920x1080", connection: "GigE", lastFrame: new Date().toISOString(), bandwidth: 46.0, temperature: 40.8, latency: 10, signal: 93, location: "West Wing Exit" },
    { id: "cam-8", name: "Perimeter East", status: "online", fps: 25, resolution: "3840x2160", connection: "Fiber", lastFrame: new Date().toISOString(), bandwidth: 95.3, temperature: 36.5, latency: 5, signal: 97, location: "East Perimeter" },
  ];
}

function generatePipeline(): PipelineStatus {
  return {
    stages: [
      { id: "capture", name: "Frame Capture", avgTimeMs: 5.2, fastestMs: 3.1, slowestMs: 18.4, failures: 2, successPct: 99.8, status: "healthy" },
      { id: "detect", name: "Object Detection (YOLO)", avgTimeMs: 12.4, fastestMs: 8.7, slowestMs: 42.1, failures: 8, successPct: 99.2, status: "healthy" },
      { id: "ocr", name: "License OCR (EasyOCR)", avgTimeMs: 28.7, fastestMs: 18.2, slowestMs: 89.3, failures: 15, successPct: 98.5, status: "degraded" },
      { id: "face", name: "Face Recognition", avgTimeMs: 45.2, fastestMs: 30.1, slowestMs: 120.8, failures: 23, successPct: 97.8, status: "degraded" },
      { id: "classify", name: "Vehicle Classification", avgTimeMs: 8.9, fastestMs: 5.4, slowestMs: 22.6, failures: 1, successPct: 99.9, status: "healthy" },
      { id: "decision", name: "Decision Engine", avgTimeMs: 2.1, fastestMs: 1.2, slowestMs: 8.9, failures: 0, successPct: 100, status: "healthy" },
      { id: "gate", name: "Gate Actuation", avgTimeMs: 150.3, fastestMs: 95.2, slowestMs: 340.7, failures: 3, successPct: 99.5, status: "healthy" },
    ],
    currentRequests: 42,
    queueSize: 8,
    dropped: 12,
    totalLatencyMs: 252.8,
    bottleneck: "Face Recognition",
  };
}

function generateSecurityHealth(): SecurityHealth {
  return {
    failedLogins: Math.round(Math.random() * 200 + 100),
    rateLimitHits: Math.round(Math.random() * 80 + 20),
    blockedRequests: Math.round(Math.random() * 40 + 10),
    expiredSessions: Math.round(Math.random() * 100 + 50),
    manualReviews: Math.round(Math.random() * 10 + 5),
    auditEvents: Math.round(Math.random() * 2000 + 2000),
    score: +(Math.random() * 10 + 80).toFixed(1),
  };
}

function generateTopology(): TopologyData {
  return {
    nodes: [
      { id: "users", label: "Users", type: "user", status: "healthy", latency: 0, throughput: 420, requests: 1280, children: [] },
      { id: "gateway", label: "API Gateway", type: "gateway", status: "healthy", latency: 2.1, throughput: 380, requests: 1200, children: [] },
      { id: "backend", label: "FastAPI Backend", type: "service", status: "healthy", latency: 5.8, throughput: 350, requests: 1150, children: [] },
      { id: "mongo", label: "MongoDB", type: "database", status: "healthy", latency: 8.2, throughput: 1200, requests: 5800, children: [] },
      {
        id: "pipeline", label: "AI Pipeline", type: "service", status: "degraded", latency: 252.8, throughput: 42, requests: 180,
        children: [
          { id: "yolo-node", label: "YOLOv8", type: "model", status: "healthy", latency: 12.4, throughput: 42, requests: 180 },
          { id: "ocr-node", label: "EasyOCR", type: "model", status: "healthy", latency: 28.7, throughput: 38, requests: 160 },
          { id: "face-node", label: "InsightFace", type: "model", status: "degraded", latency: 45.2, throughput: 22, requests: 120 },
          { id: "classify-node", label: "ResNet50", type: "model", status: "healthy", latency: 8.9, throughput: 42, requests: 180 },
          { id: "decision-node", label: "Decision Engine", type: "controller", status: "healthy", latency: 2.1, throughput: 42, requests: 180 },
        ],
      },
      { id: "gate-ctrl", label: "Gate Controller", type: "controller", status: "healthy", latency: 150.3, throughput: 4, requests: 4, children: [] },
    ],
    edges: [
      { source: "users", target: "gateway", latency: 2.1, status: "healthy" },
      { source: "gateway", target: "backend", latency: 3.7, status: "healthy" },
      { source: "backend", target: "pipeline", latency: 5.2, status: "healthy" },
      { source: "backend", target: "mongo", latency: 2.4, status: "healthy" },
      { source: "pipeline", target: "gate-ctrl", latency: 8.1, status: "healthy" },
      { source: "mongo", target: "gate-ctrl", latency: 3.5, status: "healthy" },
      { source: "yolo-node", target: "ocr-node", latency: 2.1, status: "healthy" },
      { source: "ocr-node", target: "face-node", latency: 3.4, status: "degraded" },
      { source: "face-node", target: "classify-node", latency: 1.8, status: "healthy" },
      { source: "classify-node", target: "decision-node", latency: 0.9, status: "healthy" },
    ],
  };
}

export function useSystem() {
  const healthQ = useSystemHealth();
  const modelsQ = useSystemModels();
  const performanceQ = useSystemPerformance();
  const storageQ = useSystemStorageInfo();
  const versionQ = useSystemVersion();
  const logStatsQ = useSystemLogStatistics();
  const backupsQ = useSystemBackups();
  const databaseQ = useSystemDatabase();

  const isLoading = healthQ.isLoading || modelsQ.isLoading || performanceQ.isLoading || storageQ.isLoading || versionQ.isLoading || logStatsQ.isLoading;
  const isError = healthQ.isError || modelsQ.isError || performanceQ.isError || storageQ.isError || versionQ.isError || logStatsQ.isError;

  const health = useMemo(() => healthQ.data ? mapOverallHealth(healthQ.data) : { status: "healthy" as const, score: 99, services: [] }, [healthQ.data]);
  const models = useMemo(() => modelsQ.data ? mapAiModels(modelsQ.data) : [], [modelsQ.data]);
  const perf = useMemo(() => performanceQ.data ? mapPerfMetrics(performanceQ.data) : [], [performanceQ.data]);
  const storage = useMemo(() => storageQ.data ? mapStorageInfo(storageQ.data) : { items: [], totalUsedGb: 0, totalGb: 0, orphanCount: 0, growthTrend: [], largestFiles: [], cleanupRec: "" }, [storageQ.data]);
  const versions = useMemo(() => versionQ.data ? mapVersionInfo(versionQ.data) : [], [versionQ.data]);
  const backups = useMemo(() => backupsQ.data ? mapBackupRecords(backupsQ.data) : [], [backupsQ.data]);
  const logStats = useMemo(() => logStatsQ.data ? mapLogEntries(logStatsQ.data) : [], [logStatsQ.data]);
  const alerts = useMemo(() => logStatsQ.data ? mapAlerts([]) : [], [logStatsQ.data]);

  const [logFollow, setLogFollow] = useState(true);
  const [logLevel, setLogLevel] = useState<LogLevel | "all">("all");
  const [logSearch, setLogSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState<AlertSeverity | "all">("all");
  const [selectedModel, setSelectedModel] = useState<AiModelInfo | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraInfo | null>(null);

  const metrics = useMemo(() => generateInfraMetrics(), [healthQ.dataUpdatedAt]);
  const cameras = useMemo(() => generateCameras(), []);
  const pipeline = useMemo(() => generatePipeline(), []);
  const security = useMemo(() => generateSecurityHealth(), []);
  const topology = useMemo(() => generateTopology(), []);
  const events = useMemo(() => generateEvents(), []);

  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current++;
      const levels: LogLevel[] = ["info", "info", "warn", "debug"];
      const level = levels[tickRef.current % levels.length]!;
      setLiveLogs((prev) => [{
        id: `log-live-${tickRef.current}`, level,
        module: ["pipeline", "models", "cameras", "api"][tickRef.current % 4]!,
        message: level === "warn" ? `Warning: ${["Latency spike", "Retry limit", "High memory"][tickRef.current % 3]!}` : `${tickRef.current % 2 === 0 ? "Processing" : "Idle"}`,
        timestamp: new Date().toISOString(),
      }, ...prev].slice(0, 200));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const allLogs = useMemo(() => [...liveLogs, ...logStats], [liveLogs, logStats]);

  const filteredLogs = allLogs
    .filter((l) => logLevel === "all" || l.level === logLevel)
    .filter((l) => !logSearch || l.message.toLowerCase().includes(logSearch.toLowerCase()));

  const filteredAlerts = alertFilter === "all" ? alerts : alerts.filter((a) => a.severity === alertFilter);

  const acknowledgeAlert = useCallback((id: string) => {}, []);
  const dismissAlert = useCallback((id: string) => {}, []);

  const reloadModel = useCallback((id: string) => {}, []);
  const unloadModel = useCallback((id: string) => {}, []);

  return {
    health, metrics, pipeline, models, selectedModel, setSelectedModel,
    cameras, selectedCamera, setSelectedCamera,
    storage, perf,
    logs: filteredLogs, allLogs, logFollow, setLogFollow, logLevel, setLogLevel, logSearch, setLogSearch,
    alerts: filteredAlerts, alertFilter, setAlertFilter, acknowledgeAlert, dismissAlert,
    backups, cleanup: { orphanImages: 0, oldLogsMb: 0, tempFiles: 0, unusedModels: 0, cacheMb: 0, estimatedRecoveryGb: 0 },
    versions, events, security, config: [], timeline: events,
    topology, healthActivities: [],
    reloadModel, unloadModel, refreshHealth: () => {},
    isLoading, isError,
    healthQ, databaseQ,
  };
}

export type SystemApi = ReturnType<typeof useSystem>;
