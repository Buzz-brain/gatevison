import { useMemo } from "react";
import { RefreshCw, Download, FileText, BarChart3, Activity, AlertTriangle, Shield } from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReports } from "./hooks/use-reports";
import { ExecutiveSummary } from "./components/executive-summary";
import { FilterBar } from "./components/filter-bar";
import { TrafficHourlyChart } from "./components/traffic-hourly-chart";
import { DailyTrendChart } from "./components/daily-trend-chart";
import { DecisionBreakdownChart } from "./components/decision-breakdown-chart";
import { RecognitionMetrics } from "./components/recognition-metrics";
import { PipelineStages } from "./components/pipeline-stages";
import { GateUtilizationChart } from "./components/gate-utilization-chart";
import { HeatmapGrid } from "./components/heatmap-grid";
import { QueueWaitChart } from "./components/queue-wait-chart";
import { ModelsStatus } from "./components/models-status";
import { SecurityInsightsPanel } from "./components/security-insights-panel";
import { RiskScoreCard } from "./components/risk-score-card";
import { ReportTable } from "./components/report-table";
import { SearchWidget } from "./components/search-widget";
import { ExportWidget } from "./components/export-widget";
import { EventsFeed } from "./components/events-feed";
import { DecisionHistoryTable } from "./components/decision-history-table";
import { ManualReviewQueue } from "./components/manual-review-queue";
import { InsightsFeed } from "./components/insights-feed";
import { ForecastChart } from "./components/forecast-chart";
import { SecurityIntelligenceCenter } from "./components/security-intelligence-center";

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">{children}</h3>
      {hint && (
        <Badge variant="info" size="sm" className="text-[9px]">
          {hint}
        </Badge>
      )}
    </div>
  );
}

function SectionGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-4 lg:grid-cols-${cols}`}>
      {children}
    </div>
  );
}

function ReportsPage() {
  const ops = useReports();

  const hasData = useMemo(() => ops.kpis.length > 0 && ops.kpis.some((k) => k.value > 0), [ops.kpis]);

  if (ops.isError && !hasData) {
    return (
      <PageContainer>
        <SectionHeader title="Reports & Analytics" description="Security intelligence dashboard" />
        <Card className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-danger" />
          <p className="text-sm text-muted-foreground">{ops.errorMessage ?? "Failed to load reports"}</p>
          <Button variant="outline" size="sm" onClick={ops.refetchAll}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (ops.isLoading && !hasData) {
    return (
      <PageContainer>
        <SectionHeader title="Reports & Analytics" description="Security intelligence dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse p-4">
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="h-5 w-16 bg-muted rounded mb-2" />
              <div className="h-2 w-24 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Reports & Analytics"
        description="Security intelligence dashboard — traffic analysis, access logs, and security audits"
        action={
          <div className="flex items-center gap-2">
            {ops.isError && (
              <Button variant="ghost" size="xs" onClick={ops.refetchAll}>
                <RefreshCw className="mr-1 h-3 w-3" /> Retry
              </Button>
            )}
            <Badge variant="success" size="sm" className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> LIVE
            </Badge>
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        filters={ops.filters}
        setFilters={ops.setFilters}
        resetFilters={ops.resetFilters}
        savedViews={ops.savedViews}
        applyView={ops.applyView}
        saveView={ops.saveView}
      />

      {/* Search + Export Row */}
      <SectionGrid cols={4}>
        <Card className="p-4 lg:col-span-2">
          <SectionTitle>Search Reports</SectionTitle>
          <SearchWidget
            onSearch={(q) => ops.setFilters({ search: q })}
            results={ops.searchResults}
            isLoading={ops.isLoading}
          />
        </Card>
        <Card className="p-4 lg:col-span-2">
          <SectionTitle>Export Data</SectionTitle>
          <ExportWidget
            onExport={(format) => ops.exportMutation.mutate({ format })}
            isExporting={ops.exportMutation.isPending}
            exportResult={ops.exportMutation.data}
            exportError={ops.exportMutation.error?.message ?? null}
          />
        </Card>
      </SectionGrid>

      {/* 1. Executive Summary */}
      <section>
        <SectionTitle>
          <BarChart3 className="mr-1.5 inline h-3.5 w-3.5" />
          Executive Summary
        </SectionTitle>
        <ExecutiveSummary kpis={ops.kpis} />
      </section>

      {/* 2. Analytics Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle>Hourly Traffic</SectionTitle>
          <TrafficHourlyChart data={ops.hourly} />
        </div>
        <div className="space-y-4">
          <SectionTitle>Daily Trend (30 days)</SectionTitle>
          <DailyTrendChart data={ops.daily} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <SectionTitle>Decision Breakdown</SectionTitle>
          <DecisionBreakdownChart data={ops.decision} />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <SectionTitle>Queue & Wait Time (24h)</SectionTitle>
          <QueueWaitChart queue={ops.queue} wait={ops.wait} />
        </div>
      </section>

      {/* 3. Gate Utilization + Heatmap */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle>Gate Utilization</SectionTitle>
          <GateUtilizationChart data={ops.gateUtil} />
        </div>
        <div className="space-y-4">
          <SectionTitle>Traffic Density Heatmap</SectionTitle>
          <HeatmapGrid data={ops.heatmap} />
        </div>
      </section>

      {/* 4. Recognition + Pipeline */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle>Recognition Accuracy</SectionTitle>
          <RecognitionMetrics data={ops.recognition} />
        </div>
        <div className="space-y-4">
          <SectionTitle>Pipeline Stages</SectionTitle>
          <PipelineStages data={ops.pipeline} />
        </div>
      </section>

      {/* 5. AI Models */}
      <section>
        <SectionTitle>AI Models Status</SectionTitle>
        <ModelsStatus data={ops.models} />
      </section>

      {/* 6. Security Insights + Risk */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <SectionTitle>Security Insights</SectionTitle>
          <SecurityInsightsPanel data={ops.security} />
        </div>
        <div className="space-y-4">
          <SectionTitle>Risk Score</SectionTitle>
          <RiskScoreCard data={ops.risk} />
        </div>
      </section>

      {/* 7. Report Table */}
      <section>
        <SectionTitle>
          <FileText className="mr-1.5 inline h-3.5 w-3.5" />
          Report Data
        </SectionTitle>
        <ReportTable
          datasets={ops.reports}
          activeTab={ops.reports[0]?.tab}
          onTabChange={() => {}}
        />
      </section>

      {/* 8. Manual Reviews + Decision History */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle>Manual Review Queue</SectionTitle>
          <ManualReviewQueue
            data={ops.manualReviews}
            isLoading={ops.isLoading}
            isError={ops.isError}
          />
        </div>
        <div className="space-y-4">
          <SectionTitle>Decision History</SectionTitle>
          <DecisionHistoryTable
            data={ops.decisionHistory}
            isLoading={ops.isLoading}
            isError={ops.isError}
          />
        </div>
      </section>

      {/* 9. Events + Insights */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle>Live Events</SectionTitle>
          <EventsFeed
            events={ops.events}
            isLoading={ops.isLoading}
            isError={ops.isError}
          />
        </div>
        <div className="space-y-4">
          <SectionTitle>AI Insights</SectionTitle>
          <InsightsFeed
            data={ops.insights}
            isLoading={ops.isLoading}
            isError={ops.isError}
          />
        </div>
      </section>

      {/* 10. Forecast */}
      <section>
        <SectionTitle>
          <Activity className="mr-1.5 inline h-3.5 w-3.5" />
          Traffic Forecast
        </SectionTitle>
        <ForecastChart
          data={ops.forecastPoints}
          summary={ops.forecast}
        />
      </section>

      {/* 11. Security Intelligence Center (Hackathon) */}
      <section className="border-t border-border pt-8 mt-8">
        <SectionTitle>
          <Shield className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
          Security Intelligence Center
          <Badge variant="info" size="sm" className="ml-2 text-[9px]">
            HACKATHON
          </Badge>
        </SectionTitle>
        <SecurityIntelligenceCenter
          hourly={ops.hourly}
          daily={ops.daily}
          decision={ops.decision}
          security={ops.security}
          risk={ops.risk}
          recognition={ops.recognition}
          manualReviews={ops.manualReviews.map((r) => ({
            plate: r.plate,
            reason: r.reason,
            confidence: r.confidence,
            status: r.status,
          }))}
          isLoading={ops.isLoading}
          isError={ops.isError}
          onRetry={ops.refetchAll}
        />
      </section>
    </PageContainer>
  );
}

export { ReportsPage };
