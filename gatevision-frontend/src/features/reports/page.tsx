import { useMemo } from "react";
import { RefreshCw, FileText, BarChart3 } from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReports } from "./hooks/use-reports";
import { ExecutiveSummary } from "./components/executive-summary";
import { FilterBar } from "./components/filter-bar";
import { ReportTable } from "./components/report-table";
import { ManualReviewQueue } from "./components/manual-review-queue";

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

function ReportsPage() {
  const ops = useReports();

  const hasData = useMemo(() => ops.kpis.length > 0 && ops.kpis.some((k) => k.value > 0), [ops.kpis]);

  if (ops.isError && !hasData) {
    return (
      <PageContainer className="space-y-6 pb-10">
        <SectionHeader title="Reports & Analytics" description="Traffic analysis and access logs" />
        <Card className="flex flex-col items-center gap-4 py-16 text-center">
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
      <PageContainer className="space-y-6 pb-10">
        <SectionHeader title="Reports & Analytics" description="Traffic analysis and access logs" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
    <PageContainer className="space-y-6 pb-10">
      <SectionHeader
        title="Reports & Analytics"
        description="Traffic analysis, access logs, and gate decisions"
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

      {/* 1. Filters */}
      <FilterBar
        filters={ops.filters}
        setFilters={ops.setFilters}
        resetFilters={ops.resetFilters}
      />

      {/* 2. KPIs */}
      <section>
        <SectionTitle>
          <BarChart3 className="mr-1.5 inline h-3.5 w-3.5" />
          Executive Summary
        </SectionTitle>
        <ExecutiveSummary kpis={ops.kpis} />
      </section>

      {/* 3. Report Data */}
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

      {/* 4. Manual Review Queue */}
      <section>
        <SectionTitle hint="Action needed">Manual Review Queue</SectionTitle>
        <ManualReviewQueue
          data={ops.manualReviews}
          isLoading={ops.isLoading}
          isError={ops.isError}
        />
      </section>
    </PageContainer>
  );
}

export { ReportsPage };
