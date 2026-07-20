import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  AlertTriangle,
  Ban,
  Clock,
  FileSearch,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { SecurityHealth as SecurityHealthType } from "../types";

interface SecurityHealthProps {
  security: SecurityHealthType;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 50) return "Moderate";
  return "Weak";
}

function ScoreGauge({
  score,
  reduced,
}: {
  score: number;
  reduced: boolean;
}) {
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center" aria-hidden="true">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            reduced
              ? { strokeDashoffset: offset }
              : { strokeDashoffset: circumference }
          }
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          transform="rotate(-90 100 100)"
          style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold tabular-nums"
          style={{ color }}
          initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm font-medium mt-1" style={{ color }}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

interface MetricDef {
  key: string;
  label: string;
  icon: typeof Shield;
  color: string;
  bgAlpha: string;
}

const METRICS: MetricDef[] = [
  {
    key: "failedLogins",
    label: "Failed Logins",
    icon: Ban,
    color: "#ef4444",
    bgAlpha: "15",
  },
  {
    key: "rateLimitHits",
    label: "Rate Limit Hits",
    icon: AlertTriangle,
    color: "#f59e0b",
    bgAlpha: "15",
  },
  {
    key: "blockedRequests",
    label: "Blocked Requests",
    icon: Shield,
    color: "#ef4444",
    bgAlpha: "15",
  },
  {
    key: "expiredSessions",
    label: "Expired Sessions",
    icon: Clock,
    color: "#3b82f6",
    bgAlpha: "15",
  },
  {
    key: "manualReviews",
    label: "Manual Reviews",
    icon: FileSearch,
    color: "#a855f7",
    bgAlpha: "15",
  },
  {
    key: "auditEvents",
    label: "Audit Events",
    icon: BookOpen,
    color: "#6b7280",
    bgAlpha: "15",
  },
];

function MetricCard({
  metric,
  value,
  index,
  reduced,
}: {
  metric: MetricDef;
  value: number;
  index: number;
  reduced: boolean;
}) {
  const Icon = metric.icon;

  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : 0.3 + index * 0.06 }}
    >
      <Card className="p-4 h-full">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex items-center justify-center rounded-lg p-2"
            style={{ backgroundColor: `${metric.color}${metric.bgAlpha}` }}
          >
            <Icon className="h-4 w-4" style={{ color: metric.color }} />
          </div>
          <span className="text-sm font-medium">{metric.label}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold tabular-nums">{value}</span>
          <Eye className="h-4 w-4 text-muted-foreground opacity-50" />
        </div>
      </Card>
    </motion.div>
  );
}

export function SecurityHealth({ security }: SecurityHealthProps) {
  const reduced = useReducedMotion();

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Security Health</h3>
      </div>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <ScoreGauge score={security.score} reduced={reduced} />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>Overall Security Score</span>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METRICS.map((metric, i) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                value={
                  (security as unknown as Record<string, number>)[metric.key] ?? 0
                }
                index={i}
                reduced={reduced}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
