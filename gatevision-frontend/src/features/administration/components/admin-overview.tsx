import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  Users,
  Activity,
  Shield,
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  Monitor,
  Key,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { AdminStats } from "../types";

interface KpiCard {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  trend: "up" | "down";
  trendPct: number;
  insight: string;
  sparkline: number[];
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildCards(stats: AdminStats): KpiCard[] {
  return [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "#3b82f6",
      trend: "up",
      trendPct: 12,
      insight: "Steady growth this quarter",
      sparkline: [18, 22, 20, 26, 28, 32, 35, 40],
    },
    {
      label: "Online Users",
      value: stats.onlineUsers,
      icon: Activity,
      color: "#22c55e",
      trend: "up",
      trendPct: 8,
      insight: "Peak hours approaching",
      sparkline: [5, 8, 12, 10, 15, 18, 14, 16],
    },
    {
      label: "Admins",
      value: stats.admins,
      icon: Shield,
      color: "#ef4444",
      trend: "down",
      trendPct: 2,
      insight: "Within target range",
      sparkline: [6, 6, 5, 5, 6, 5, 5, 5],
    },
    {
      label: "Security Officers",
      value: stats.securityOfficers,
      icon: ShieldCheck,
      color: "#f59e0b",
      trend: "up",
      trendPct: 5,
      insight: "Shift coverage optimal",
      sparkline: [8, 9, 9, 10, 10, 11, 11, 12],
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Clock,
      color: "#8b5cf6",
      trend: "up",
      trendPct: 15,
      insight: "Queue building up",
      sparkline: [2, 3, 3, 4, 5, 6, 7, 8],
    },
    {
      label: "Events Today",
      value: stats.securityEventsToday,
      icon: Calendar,
      color: "#06b6d4",
      trend: "down",
      trendPct: 10,
      insight: "Lower than yesterday",
      sparkline: [30, 28, 35, 25, 22, 20, 18, 16],
    },
    {
      label: "Failed Logins",
      value: stats.failedLogins,
      icon: AlertTriangle,
      color: "#ef4444",
      trend: "down",
      trendPct: 22,
      insight: "Attack surface shrinking",
      sparkline: [12, 10, 8, 9, 7, 5, 4, 3],
    },
    {
      label: "Active Sessions",
      value: stats.activeSessions,
      icon: Monitor,
      color: "#22c55e",
      trend: "up",
      trendPct: 3,
      insight: "Normal utilization",
      sparkline: [40, 42, 45, 43, 48, 50, 52, 55],
    },
    {
      label: "Permission Changes",
      value: stats.permissionChanges,
      icon: Key,
      color: "#ec4899",
      trend: "up",
      trendPct: 7,
      insight: "Recent role updates",
      sparkline: [1, 2, 3, 2, 4, 3, 5, 4],
    },
  ];
}

export function AdminOverview({ stats }: { stats: AdminStats }) {
  const reduced = useReducedMotion();
  const cards = buildCards(stats);

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={stagger}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = card.trend === "up" ? TrendingUp : TrendingDown;
        return (
          <motion.div
            key={card.label}
            variants={reduced ? undefined : cardVariant}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${card.color}15` }}
                      >
                        <Icon className="h-4.5 w-4.5" style={{ color: card.color }} />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {card.label}
                      </span>
                    </div>
                    <div className="text-3xl font-bold tabular-nums text-foreground">
                      {card.value.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendIcon
                        className={cn(
                          "h-3.5 w-3.5",
                          card.trend === "up" ? "text-green-500" : "text-red-500"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          card.trend === "up" ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {card.trendPct}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last week</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{card.insight}</p>
                  </div>
                  <Sparkline data={card.sparkline} color={card.color} />
                </div>
              </CardContent>
              <div
                className="absolute bottom-0 left-0 h-0.5 w-full opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: card.color }}
              />
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
