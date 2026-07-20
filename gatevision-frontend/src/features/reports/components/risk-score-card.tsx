import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChartCard } from "./chart-card";
import { CountUp } from "./count-up";
import { RISK_LEVEL_CONFIG, CHART, formatPct } from "../utils";
import type { RiskScore, RiskFactor } from "../types";

interface RiskScoreCardProps {
  data: RiskScore;
  isLoading?: boolean;
  isError?: boolean;
}

function RiskScoreCardSkeleton() {
  return (
    <ChartCard title="Risk Score" subtitle="Overall security risk assessment">
      <div className="flex flex-col items-center gap-4">
        <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
        <div className="w-full space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function RiskScoreCardError() {
  return (
    <ChartCard title="Risk Score" subtitle="Overall security risk assessment">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load risk score.</p>
      </div>
    </ChartCard>
  );
}

function RiskScoreCardEmpty() {
  return (
    <ChartCard title="Risk Score" subtitle="Overall security risk assessment">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No risk score data.</p>
      </div>
    </ChartCard>
  );
}

function RiskGauge({ pct, color }: { pct: number; color: string }) {
  const radius = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const fillLength = (pct / 100) * circumference * 0.75;
  const rotation = 135;
  const cx = 64;
  const cy = 64;

  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
        opacity={0.3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${fillLength} ${circumference - fillLength}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
        className="transition-all duration-1000"
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-foreground text-2xl font-bold"
      >
        {pct}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        / 100
      </text>
    </svg>
  );
}

function FactorBar({ factor }: { factor: RiskFactor }) {
  const color =
    factor.level === "critical"
      ? "#dc2626"
      : factor.level === "high"
        ? CHART.danger
        : factor.level === "medium"
          ? CHART.warning
          : CHART.success;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{factor.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{factor.value}</span>
          <Badge
            variant={
              factor.level === "critical" || factor.level === "high"
                ? "danger"
                : factor.level === "medium"
                  ? "warning"
                  : "success"
            }
            size="sm"
          >
            {RISK_LEVEL_CONFIG[factor.level]?.label ?? factor.level}
          </Badge>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(factor.contributionPct, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function RiskScoreCardInner({ data }: { data: RiskScore }) {
  const levelCfg = RISK_LEVEL_CONFIG[data.level];
  const gaugeColor = levelCfg?.hex ?? CHART.muted;

  return (
    <ChartCard title="Risk Score" subtitle="Overall security risk assessment">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <RiskGauge pct={data.overallPct} color={gaugeColor} />
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Badge
              variant={
                data.level === "critical" || data.level === "high"
                  ? "danger"
                  : data.level === "medium"
                    ? "warning"
                    : "success"
              }
            >
              {levelCfg?.label ?? data.level}
            </Badge>
          </div>
        </div>
        <div className="w-full space-y-3">
          {data.factors.map((factor, i) => (
            <FactorBar key={`${factor.label}-${i}`} factor={factor} />
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

export function RiskScoreCard({ data, isLoading, isError }: RiskScoreCardProps) {
  if (isLoading) return <RiskScoreCardSkeleton />;
  if (isError) return <RiskScoreCardError />;
  if (!data) return <RiskScoreCardEmpty />;
  return <RiskScoreCardInner data={data} />;
}
