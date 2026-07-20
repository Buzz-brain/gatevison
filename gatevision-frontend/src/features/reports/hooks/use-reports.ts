import { useMemo, useState, useCallback, useEffect } from "react";
import { formatNumber } from "../utils";
import {
  useApiReports, useApiAnalytics, useApiManualReviews,
  useApiEvents, useApiDecisionHistory, useApiGateStatistics,
  useApiExportMutation, useApiSearch,
} from "./use-reports-api";
import type {
  ActivityEntry, AiModel, ConfidenceBin, DailyTrend, DecisionBreakdown,
  ExecutiveBriefing, ExportJob, FilterState, ForecastPoint, ForecastSummary,
  GateDecisionBreakdown, GateId, GateUtilization, HeatmapCell, HourlyTraffic,
  Insight, KpiMetric, MonthlyVolume, ParkingZone, PeriodKey, PipelineStage,
  QueuePoint, RecognitionMetric, ReplayFrame, ReportBlock, ReportDataset,
  RiskScore, SavedReport, SavedView, SecurityInsight, SeverityLevel, StayBucket,
  WaitTimePoint, WeeklyComparison,
} from "../types";

const DEFAULT_FILTERS: FilterState = {
  period: "today",
  customStart: null,
  customEnd: null,
  gates: [],
  vehicleTypes: [],
  departments: [],
  policies: [],
  decisions: [],
  recognitionStatus: [],
  driver: "",
  vehicle: "",
  search: "",
};

const PERIOD_FACTOR: Record<PeriodKey, number> = {
  today: 1,
  yesterday: 0.98,
  week: 7,
  month: 30,
  custom: 14,
};

const COMPARISON_LABEL: Record<PeriodKey, string> = {
  today: "vs yesterday",
  yesterday: "vs Monday",
  week: "vs last week",
  month: "vs last month",
  custom: "vs previous range",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function useReports() {
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const apiParams = useMemo(() => ({
    page: 1,
    date_from: filters.customStart ?? undefined,
    date_to: filters.customEnd ?? undefined,
    driver: filters.driver || undefined,
    vehicle: filters.vehicle || undefined,
    search: debouncedSearch || undefined,
    decision: filters.decisions.length === 1 ? filters.decisions[0] : undefined,
  }), [filters.customStart, filters.customEnd, filters.driver, filters.vehicle, debouncedSearch, filters.decisions]);

  const { data: reportsData, isLoading: reportsLoading, isError: reportsError, refetch: refetchReports } = useApiReports(apiParams);
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError } = useApiAnalytics();
  const { data: manualReviews } = useApiManualReviews();
  const { data: eventsData } = useApiEvents();
  const { data: decisionHistoryData } = useApiDecisionHistory();
  const { data: gateStats } = useApiGateStatistics();
  const exportMutation = useApiExportMutation();
  const { data: searchResults } = useApiSearch(debouncedSearch);

  const setFilters = useCallback((patch: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  const applyView = useCallback((id: string) => {
    const view = savedViews.find((v) => v.id === id);
    if (view) setFiltersState(view.filters);
  }, [savedViews]);

  const saveView = useCallback((name: string) => {
    setSavedViews((prev) => [...prev, { id: `sv-${Date.now()}`, name, filters }]);
  }, [filters]);

  const toggleFavorite = useCallback((id: string) => {
    setSavedReports((prev) => prev.map((r) => r.id === id ? { ...r, favorite: !r.favorite } : r));
  }, []);

  const duplicateReport = useCallback((id: string) => {
    setSavedReports((prev) => {
      const src = prev.find((r) => r.id === id);
      if (!src) return prev;
      return [{ ...src, id: `sr-${Date.now()}`, name: `${src.name} (copy)`, favorite: false }, ...prev];
    });
  }, []);

  const shareReport = useCallback((_id: string) => {}, []);

  const isLoading = reportsLoading || analyticsLoading;
  const isError = reportsError || analyticsError;
  const refetchAll = useCallback(() => { refetchReports(); }, [refetchReports]);

  const activeGates: GateId[] = useMemo(
    () => filters.gates.length > 0 ? filters.gates : ["gate-north", "gate-south", "gate-east", "gate-west", "gate-vip"] as GateId[],
    [filters.gates],
  );

  const totalEntries = useMemo(() => analyticsData?.hourlyTraffic.reduce((s, h) => s + h.entries, 0) ?? 0, [analyticsData]);
  const totalExits = useMemo(() => analyticsData?.hourlyTraffic.reduce((s, h) => s + h.exits, 0) ?? 0, [analyticsData]);
  const vehiclesInside = useMemo(() => Math.max(0, totalEntries - totalExits), [totalEntries, totalExits]);
  const avgProcessingMs = useMemo(() => analyticsData?.processingMetrics?.avgProcessingTimeMs ?? 320, [analyticsData]);
  const ac = useMemo(() => analyticsData?.recognitionStats?.avgConfidence ?? 93.5, [analyticsData]);

  const decision = useMemo<DecisionBreakdown[]>(() =>
    (analyticsData?.decisionBreakdown ?? [
      { type: "granted", count: 4200, percentage: 0 },
      { type: "denied", count: 145, percentage: 0 },
      { type: "manual_review", count: 55, percentage: 0 },
      { type: "emergency", count: 8, percentage: 0 },
      { type: "unknown", count: 2, percentage: 0 },
    ]).map((d) => ({ type: d.type as DecisionBreakdown["type"], count: d.count })),
    [analyticsData],
  );

  const deniedRate = useMemo(() => {
    const totalDec = decision.reduce((s, d) => s + d.count, 0) || 1;
    return (decision.find((d) => d.type === "denied")?.count ?? 0) / totalDec * 100;
  }, [decision]);

  const peakEntry = useMemo(() =>
    analyticsData?.hourlyTraffic.reduce((max, h) =>
      h.entries > max.entries ? h : max,
      analyticsData.hourlyTraffic[0] ?? { hour: "N/A", entries: 0, exits: 0 },
    ),
    [analyticsData],
  );

  const kpis = useMemo<KpiMetric[]>(() => {
    const factor = PERIOD_FACTOR[filters.period];
    const grantedCount = analyticsData?.decisionBreakdown.find((d) => d.type === "granted")?.count ?? 0;
    const mrCount = analyticsData?.decisionBreakdown.find((d) => d.type === "manual_review")?.count ?? 0;
    const scaledTotal = Math.round(totalEntries * factor);
    const scaledExits = Math.round(totalExits * factor);

    return [
      { id: "entries", label: "Total Entries", value: scaledTotal, unit: "", display: formatNumber(scaledTotal), changePct: 12.5, positive: true, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [120, 135, 142, 151, 148, 160, scaledTotal], insight: `${formatNumber(scaledTotal)} vehicles entered`, icon: "log-in" },
      { id: "exits", label: "Total Exits", value: scaledExits, unit: "", display: formatNumber(scaledExits), changePct: 8.3, positive: true, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [98, 105, 112, 118, 124, 130, scaledExits], insight: "Steady outflow", icon: "log-out" },
      { id: "vehicles-inside", label: "Vehicles Inside", value: vehiclesInside, unit: "", display: formatNumber(vehiclesInside), changePct: -2.1, positive: false, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [45, 42, 40, 38, 35, 33, vehiclesInside], insight: `${vehiclesInside} currently on site`, icon: "car" },
      { id: "processing", label: "Avg Processing", value: avgProcessingMs, unit: "ms", display: `${Math.round(avgProcessingMs)}ms`, changePct: -5.2, positive: true, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [380, 365, 350, 340, 330, 325, Math.round(avgProcessingMs)], insight: `${Math.round(avgProcessingMs)}ms average`, icon: "timer" },
      { id: "accuracy", label: "Recognition Accuracy", value: ac, unit: "%", display: `${ac.toFixed(1)}%`, changePct: 0.8, positive: true, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [91.2, 92.0, 92.5, 92.8, 93.1, 93.3, ac], insight: `${ac.toFixed(1)}% accurate`, icon: "scan-eye" },
      { id: "denied", label: "Denial Rate", value: deniedRate, unit: "%", display: `${deniedRate.toFixed(1)}%`, changePct: 0.5, positive: false, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [2.8, 3.0, 3.1, 3.2, 3.3, 3.2, deniedRate], insight: `${deniedRate.toFixed(1)}% denied`, icon: "shield-x" },
      { id: "manual", label: "Manual Reviews", value: Math.round(mrCount * factor), unit: "", display: formatNumber(Math.round(mrCount * factor)), changePct: -12.0, positive: true, comparisonLabel: COMPARISON_LABEL[filters.period], sparkline: [8, 7, 6, 5, 4, 4, Math.round(mrCount * factor)], insight: `${formatNumber(Math.round(mrCount * factor))} require review`, icon: "user-check" },
      { id: "peak", label: "Peak Hour", value: peakEntry?.entries ?? 0, unit: peakEntry?.hour ?? "N/A", display: peakEntry?.hour ?? "N/A", changePct: 5.0, positive: false, comparisonLabel: "previous peak", sparkline: [140, 155, 170, 180, 175, 160, peakEntry?.entries ?? 0], insight: `Peak at ${peakEntry?.hour ?? "N/A"}`, icon: "clock" },
    ];
  }, [filters.period, totalEntries, totalExits, vehiclesInside, avgProcessingMs, ac, deniedRate, analyticsData, peakEntry]);

  const hourly = useMemo<HourlyTraffic[]>(() =>
    (analyticsData?.hourlyTraffic ?? []).map((h) => ({ hour: Number(h.hour.replace(":00", "")), entries: h.entries, exits: h.exits })),
    [analyticsData],
  );

  const daily = useMemo<DailyTrend[]>(() =>
    (analyticsData?.dailyTrends ?? []).map((d) => ({ date: d.date, entries: d.entries, exits: d.exits })),
    [analyticsData],
  );

  const weekly = useMemo<WeeklyComparison[]>(() =>
    DAYS.map((day, i) => ({
      weekday: day,
      thisWeek: daily.filter((_, di) => di % 7 === i).reduce((s, d) => s + d.entries, 0) || Math.round(20 + Math.random() * 15),
      lastWeek: Math.round(15 + Math.random() * 12),
    })),
    [daily],
  );

  const monthly = useMemo<MonthlyVolume[]>(() =>
    MONTHS.map((m) => ({ month: m, entries: Math.round(800 + Math.random() * 400), exits: Math.round(700 + Math.random() * 350) })),
    [],
  );

  const gateUtil = useMemo<GateUtilization[]>(() =>
    (analyticsData?.gateComparison ?? [])
      .filter((g) => activeGates.includes(g.gateId as GateId))
      .map((g) => ({ gateId: g.gateId as GateId, gateName: g.gateName, utilizationPct: g.utilizationPct, entries: g.entries, avgWaitSec: g.avgWaitSec })),
    [analyticsData, activeGates],
  );

  const gateDecision = useMemo<GateDecisionBreakdown[]>(() =>
    gateUtil.map((g) => {
      const total = g.entries;
      return {
        gateId: g.gateId,
        gateName: g.gateName,
        granted: Math.round(total * 0.92),
        denied: Math.round(total * 0.04),
        manualReview: Math.round(total * 0.03),
        emergency: Math.round(total * 0.005),
        unknown: Math.round(total * 0.005),
      };
    }),
    [gateUtil],
  );

  const heatmap = useMemo<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = [];
    for (const gate of gateUtil) {
      for (let h = 0; h < 24; h++) {
        const base = 30 + Math.sin((h / 24) * Math.PI * 2) * 20 + Math.random() * 15;
        cells.push({ hour: h, gateId: gate.gateId, density: Math.min(100, Math.round(base)) });
      }
    }
    return cells;
  }, [gateUtil]);

  const queue = useMemo<QueuePoint[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({ hour: i, queue: Math.round(2 + Math.sin((i / 24) * Math.PI * 2) * 3 + Math.random() * 2) })),
    [],
  );

  const wait = useMemo<WaitTimePoint[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({ hour: i, avgWaitSec: Math.round(15 + Math.sin((i / 24) * Math.PI * 2) * 20 + Math.random() * 10) })),
    [],
  );

  const stay = useMemo<StayBucket[]>(() => [
    { bucket: "< 30m", count: Math.round(30 + Math.random() * 20) },
    { bucket: "30m-1h", count: Math.round(45 + Math.random() * 15) },
    { bucket: "1-2h", count: Math.round(60 + Math.random() * 20) },
    { bucket: "2-4h", count: Math.round(35 + Math.random() * 15) },
    { bucket: "4-8h", count: Math.round(20 + Math.random() * 10) },
    { bucket: "> 8h", count: Math.round(10 + Math.random() * 8) },
  ], []);

  const parking = useMemo<ParkingZone[]>(() => [
    { zone: "Main Lot A", total: 120, occupied: Math.round(60 + Math.random() * 40) },
    { zone: "Main Lot B", total: 80, occupied: Math.round(40 + Math.random() * 30) },
    { zone: "VIP Lot", total: 30, occupied: Math.round(5 + Math.random() * 15) },
    { zone: "Visitor Lot", total: 50, occupied: Math.round(20 + Math.random() * 20) },
    { zone: "Overflow", total: 40, occupied: Math.round(10 + Math.random() * 10) },
  ], []);

  const recognition = useMemo<RecognitionMetric[]>(() => {
    const rs = analyticsData?.recognitionStats;
    return [
      { id: "plate", label: "Plate Detection", accuracyPct: rs?.plateAccuracy ?? 96.2, changePct: 1.2, samples: rs?.totalProcessed ?? 12500 },
      { id: "ocr", label: "OCR Accuracy", accuracyPct: rs?.ocrAccuracy ?? 94.8, changePct: 0.5, samples: rs?.totalProcessed ?? 12500 },
      { id: "face", label: "Face Recognition", accuracyPct: rs?.faceAccuracy ?? 93.1, changePct: 2.1, samples: rs?.totalProcessed ?? 12500 },
      { id: "vehicle", label: "Vehicle Fingerprint", accuracyPct: rs?.vehicleAccuracy ?? 95.5, changePct: 0.8, samples: rs?.totalProcessed ?? 12500 },
    ];
  }, [analyticsData]);

  const confidence = useMemo<ConfidenceBin[]>(() => [
    { bin: "90-100%", count: Math.round(2500 + Math.random() * 500) },
    { bin: "80-90%", count: Math.round(800 + Math.random() * 200) },
    { bin: "70-80%", count: Math.round(300 + Math.random() * 100) },
    { bin: "60-70%", count: Math.round(100 + Math.random() * 50) },
    { bin: "50-60%", count: Math.round(50 + Math.random() * 25) },
    { bin: "40-50%", count: Math.round(20 + Math.random() * 10) },
    { bin: "< 40%", count: Math.round(10 + Math.random() * 5) },
  ], []);

  const pipeline = useMemo<PipelineStage[]>(() => [
    { stage: "ANPR", count: 5200, avgTimeMs: 45, successRate: 98.2 },
    { stage: "OCR", count: 5100, avgTimeMs: 120, successRate: 96.5 },
    { stage: "Face", count: 4900, avgTimeMs: 200, successRate: 94.8 },
    { stage: "Vehicle", count: 4800, avgTimeMs: 85, successRate: 97.1 },
    { stage: "Decision", count: 4750, avgTimeMs: 15, successRate: 99.9 },
  ], []);

  const models = useMemo<AiModel[]>(() => [
    { id: "yolo", name: "YOLOv8", type: "Detection", status: "healthy", version: "8.2.1", inferences: 15200, avgLatencyMs: 28, successRate: 98.5, failureRate: 1.5, memoryMb: 245, gpuPct: 32, latencyTrend: [30, 29, 28, 27, 28, 27, 28] },
    { id: "easyocr", name: "EasyOCR", type: "OCR", status: "healthy", version: "2.8.0", inferences: 14800, avgLatencyMs: 95, successRate: 96.2, failureRate: 3.8, memoryMb: 512, gpuPct: 28, latencyTrend: [100, 98, 96, 95, 94, 95, 95] },
    { id: "insightface", name: "InsightFace", type: "Face Recognition", status: "healthy", version: "0.7.3", inferences: 12100, avgLatencyMs: 180, successRate: 94.8, failureRate: 5.2, memoryMb: 768, gpuPct: 55, latencyTrend: [195, 188, 182, 180, 178, 180, 180] },
    { id: "resnet", name: "ResNet50", type: "Vehicle Classifier", status: "healthy", version: "1.3.0", inferences: 9800, avgLatencyMs: 65, successRate: 95.5, failureRate: 4.5, memoryMb: 420, gpuPct: 22, latencyTrend: [70, 68, 66, 65, 64, 65, 65] },
    { id: "decision-engine", name: "Decision Engine", type: "Rule-based", status: "healthy", version: "2.0.1", inferences: 14200, avgLatencyMs: 12, successRate: 99.9, failureRate: 0.1, memoryMb: 128, gpuPct: 5, latencyTrend: [15, 14, 12, 12, 11, 12, 12] },
    { id: "deepsort", name: "DeepSORT", type: "Tracking", status: "healthy", version: "3.1.0", inferences: 16500, avgLatencyMs: 42, successRate: 97.2, failureRate: 2.8, memoryMb: 340, gpuPct: 18, latencyTrend: [45, 44, 43, 42, 41, 42, 42] },
  ], []);

  const security = useMemo<SecurityInsight[]>(() => {
    const si: SecurityInsight[] = [];
    if (deniedRate > 5) si.push({ id: "si-1", title: "High Denial Rate", value: `${deniedRate.toFixed(1)}%`, detail: "Unusual denial rate detected", severity: "high", icon: "shield-x", recommendation: "Review access policies" });
    si.push({ id: "si-2", title: "Peak Congestion", value: kpis.find((k) => k.id === "peak")?.display ?? "N/A", detail: "Highest traffic volume observed", severity: "medium", icon: "car", recommendation: "Consider additional staffing" });
    if (ac < 90) si.push({ id: "si-3", title: "Recognition Degradation", value: `${ac.toFixed(1)}%`, detail: "Recognition accuracy below threshold", severity: "high", icon: "scan-eye", recommendation: "Inspect camera calibration" });
    else si.push({ id: "si-4", title: "System Healthy", value: `${ac.toFixed(1)}%`, detail: "All recognition systems operational", severity: "low", icon: "scan-eye", recommendation: "Continue monitoring" });
    si.push({ id: "si-5", title: "Manual Review Queue", value: `${manualReviews?.length ?? 0} pending`, detail: "Items awaiting manual review", severity: manualReviews && manualReviews.length > 5 ? "high" : "medium", icon: "user-check", recommendation: manualReviews && manualReviews.length > 5 ? "Prioritize queue clearance" : "Monitor queue growth" });
    si.push({ id: "si-6", title: "Processing Latency", value: `${Math.round(avgProcessingMs)}ms`, detail: "Average pipeline processing time", severity: avgProcessingMs > 500 ? "high" : avgProcessingMs > 300 ? "medium" : "low", icon: "timer", recommendation: avgProcessingMs > 500 ? "Investigate pipeline bottlenecks" : "Performance within normal range" });
    return si;
  }, [deniedRate, ac, avgProcessingMs, kpis, manualReviews]);

  const risk = useMemo<RiskScore>(() => ({
    overallPct: Math.round(15 + deniedRate * 2),
    level: deniedRate > 5 ? "high" as SeverityLevel : "medium" as SeverityLevel,
    factors: [
      { label: "Denied Access Rate", contributionPct: Math.round(deniedRate * 5), value: `${deniedRate.toFixed(1)}%`, level: deniedRate > 5 ? "high" as SeverityLevel : "medium" as SeverityLevel },
      { label: "Manual Review Backlog", contributionPct: Math.min(30, (manualReviews?.length ?? 0) * 5), value: `${manualReviews?.length ?? 0} pending`, level: manualReviews && manualReviews.length > 5 ? "high" as SeverityLevel : "medium" as SeverityLevel },
      { label: "Recognition Confidence", contributionPct: Math.max(5, Math.round(20 - (ac - 80) * 0.5)), value: `${ac.toFixed(1)}%`, level: ac > 90 ? "low" as SeverityLevel : "medium" as SeverityLevel },
      { label: "Peak Hour Pressure", contributionPct: 15, value: "Moderate", level: "medium" as SeverityLevel },
      { label: "System Health", contributionPct: 5, value: "Healthy", level: "low" as SeverityLevel },
      { label: "Processing Latency", contributionPct: 10, value: `${Math.round(avgProcessingMs)}ms`, level: avgProcessingMs > 500 ? "high" as SeverityLevel : "low" as SeverityLevel },
    ],
  }), [deniedRate, manualReviews, ac, avgProcessingMs]);

  const reports = useMemo<ReportDataset[]>(() => {
    if (reportsData?.items.length) {
      return reportsData.items.map((r) => ({
        id: r.id,
        tab: r.type,
        title: r.title,
        description: r.description,
        columns: r.columns.map((c) => ({ key: c.key, label: c.label, numeric: c.type === "number" })),
        rows: r.data.slice(0, 100) as Record<string, string | number>[],
      }));
    }
    return [
      { id: "daily-access", tab: "Daily Access Log", title: "Daily Access Log", description: "Complete access log for all gates", columns: [{ key: "time", label: "Time" }, { key: "plate", label: "Plate" }, { key: "gate", label: "Gate" }, { key: "decision", label: "Decision" }], rows: [] },
    ];
  }, [reportsData]);

  const reportBlocks = useMemo<ReportBlock[]>(() => [
    { id: "rb-kpi", kind: "kpi", label: "Key Metrics" },
    { id: "rb-hourly", kind: "line", label: "Hourly Traffic" },
    { id: "rb-decision", kind: "pie", label: "Decision Breakdown" },
    { id: "rb-table", kind: "table", label: "Report Data" },
  ], []);

  return {
    filters,
    setFilters,
    resetFilters,
    savedViews,
    applyView,
    saveView,
    activeGates,
    kpis,
    hourly,
    daily,
    weekly,
    monthly,
    gateUtil,
    heatmap,
    queue,
    wait,
    stay,
    parking,
    recognition,
    confidence,
    pipeline,
    models,
    decision,
    gateDecision,
    security,
    risk,
    reports,
    reportBlocks,
    savedReports,
    toggleFavorite,
    duplicateReport,
    shareReport,
    exports: [] as ExportJob[],
    insights: [] as Insight[],
    forecastPoints: [] as ForecastPoint[],
    forecast: null as ForecastSummary | null,
    activity: [] as ActivityEntry[],
    briefing: null as ExecutiveBriefing | null,
    replayFrames: [] as ReplayFrame[],
    searchResults: searchResults ?? [],
    manualReviews: manualReviews ?? [],
    events: eventsData?.items ?? [],
    decisionHistory: decisionHistoryData?.items ?? [],
    gateStats,
    exportMutation,
    isLoading,
    isError,
    errorMessage: isError ? "Failed to load reports data" : null,
    refetchAll,
    analyticsData,
  };
}

export type ReportsApi = ReturnType<typeof useReports>;

export type {
  ActivityEntry, AiModel, ConfidenceBin, DailyTrend, DecisionBreakdown,
  ExecutiveBriefing, ExportJob, FilterState, ForecastPoint, ForecastSummary,
  GateDecisionBreakdown, GateUtilization, HeatmapCell, HourlyTraffic,
  Insight, KpiMetric, MonthlyVolume, ParkingZone, PeriodKey, PipelineStage,
  QueuePoint, RecognitionMetric, ReplayFrame, ReportBlock, ReportDataset,
  RiskScore, SavedReport, SavedView, SecurityInsight, SeverityLevel, StayBucket,
  WaitTimePoint, WeeklyComparison,
};
