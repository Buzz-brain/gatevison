import { useMemo, useState, useCallback, useEffect } from "react";
import { formatNumber } from "../utils";
import {
  useApiReports, useApiAnalytics, useApiManualReviews,
} from "./use-reports-api";
import type {
  DecisionBreakdown, FilterState,
  KpiMetric, ReportDataset,
} from "../types";

const DEFAULT_FILTERS: FilterState = {
  decisions: [],
  search: "",
};

export function useReports() {
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const apiParams = useMemo(() => ({
    page: 1,
    search: debouncedSearch || undefined,
    decision: filters.decisions.length === 1 ? filters.decisions[0] : undefined,
  }), [debouncedSearch, filters.decisions]);

  const { data: reportsData, isLoading: reportsLoading, isError: reportsError, refetch: refetchReports } = useApiReports(apiParams);
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError } = useApiAnalytics();
  const { data: manualReviews } = useApiManualReviews();

  const setFilters = useCallback((patch: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  const isLoading = reportsLoading || analyticsLoading;
  const isError = reportsError || analyticsError;
  const refetchAll = useCallback(() => { refetchReports(); }, [refetchReports]);

  const totalTraffic = useMemo(() => analyticsData?.hourlyTraffic.reduce((s, h) => s + h.entries, 0) ?? 0, [analyticsData]);

  const decision = useMemo<DecisionBreakdown[]>(() =>
    (analyticsData?.decisionBreakdown ?? []).map((d) => ({ type: d.type as DecisionBreakdown["type"], count: d.count })),
    [analyticsData],
  );

  const deniedRate = useMemo(() => {
    const totalDec = decision.reduce((s, d) => s + d.count, 0) || 1;
    return (decision.find((d) => d.type === "denied")?.count ?? 0) / totalDec * 100;
  }, [decision]);

  const kpis = useMemo<KpiMetric[]>(() => {
    const mrCount = analyticsData?.decisionBreakdown.find((d) => d.type === "manual_review")?.count ?? 0;

    return [
      { id: "traffic", label: "Total Traffic", value: totalTraffic, unit: "", display: formatNumber(totalTraffic), changePct: 0, positive: true, comparisonLabel: "vs previous day", sparkline: [], insight: `${formatNumber(totalTraffic)} gate transactions`, icon: "log-in" },
      { id: "denied", label: "Denial Rate", value: deniedRate, unit: "%", display: `${deniedRate.toFixed(1)}%`, changePct: 0, positive: false, comparisonLabel: "vs previous day", sparkline: [], insight: `${deniedRate.toFixed(1)}% of decisions denied`, icon: "shield-x" },
      { id: "manual", label: "Manual Reviews", value: mrCount, unit: "", display: formatNumber(mrCount), changePct: 0, positive: true, comparisonLabel: "vs previous day", sparkline: [], insight: `${formatNumber(mrCount)} decisions require review`, icon: "user-check" },
    ];
  }, [totalTraffic, deniedRate, analyticsData]);

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

  return {
    filters,
    setFilters,
    resetFilters,
    kpis,
    reports,
    manualReviews: manualReviews ?? [],
    isLoading,
    isError,
    errorMessage: isError ? "Failed to load reports data" : null,
    refetchAll,
  };
}

export type ReportsApi = ReturnType<typeof useReports>;

export type {
  DecisionBreakdown, FilterState,
  KpiMetric, ReportDataset,
};
