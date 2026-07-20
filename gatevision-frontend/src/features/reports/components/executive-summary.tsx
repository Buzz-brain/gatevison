import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { resolveIcon, CHART } from "../utils";
import { CountUp } from "./count-up";
import { slideUp } from "@/lib/animations";
import type { KpiMetric } from "../types";

function KpiCard({ kpi, index }: { kpi: KpiMetric; index: number }) {
  const Icon = resolveIcon(kpi.icon);
  const positive = kpi.positive;
  const hasUnit = !!kpi.unit && kpi.unit !== "%";
  const decimals = kpi.unit === "%" ? 1 : 0;

  const data = kpi.sparkline.map((y, x) => ({ x, y }));

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
    >
      <Card className="relative overflow-hidden p-4 transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {hasUnit ? (
                <CountUp value={kpi.value} decimals={decimals} suffix={kpi.unit} />
              ) : kpi.unit === "%" ? (
                <CountUp value={kpi.value} decimals={1} suffix="%" />
              ) : (
                <CountUp value={kpi.value} decimals={0} />
              )}
            </p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              positive ? "text-success" : "text-danger",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {kpi.changePct === 0 ? "—" : `${kpi.changePct > 0 ? "+" : ""}${kpi.changePct}%`}
          </span>
          <span className="text-xs text-muted-foreground">{kpi.comparisonLabel}</span>
        </div>

        <div className="mt-3 h-10 w-full">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id={`spark-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={positive ? CHART.success : CHART.danger} stopOpacity="0.35" />
                <stop offset="100%" stopColor={positive ? CHART.success : CHART.danger} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={data.map((d, i) => `${(i / (data.length - 1)) * 100},${30 - (d.y / Math.max(...data.map((p) => p.y))) * 28}`).join(" ")}
              fill="none"
              stroke={positive ? CHART.success : CHART.danger}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <polygon
              points={`0,30 ${data.map((d, i) => `${(i / (data.length - 1)) * 100},${30 - (d.y / Math.max(...data.map((p) => p.y))) * 28}`).join(" ")} 100,30`}
              fill={`url(#spark-${kpi.id})`}
            />
          </svg>
        </div>

        <p className="mt-2 text-[11px] leading-tight text-muted-foreground">{kpi.insight}</p>
      </Card>
    </motion.div>
  );
}

export function ExecutiveSummary({ kpis }: { kpis: KpiMetric[] }) {
  return (
    <section aria-label="Executive summary">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
        {kpis.map((k, i) => (
          <KpiCard key={k.id} kpi={k} index={i} />
        ))}
      </div>
    </section>
  );
}
