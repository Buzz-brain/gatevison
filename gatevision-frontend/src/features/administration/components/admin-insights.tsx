import { motion } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { AdminInsight } from "../types";
import { timeAgo } from "../utils";

const INSIGHT_ICON: Record<string, typeof AlertTriangle> = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const INSIGHT_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

const INSIGHT_BG: Record<string, string> = {
  critical: "bg-red-500/5",
  warning: "bg-amber-500/5",
  info: "bg-blue-500/5",
};

const INSIGHT_ICON_STYLE: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  warning: "bg-amber-500/10 text-amber-500",
  info: "bg-blue-500/10 text-blue-500",
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
};

interface AdminInsightsProps {
  insights: AdminInsight[];
}

export function AdminInsights({ insights }: AdminInsightsProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="space-y-3"
      variants={stagger}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      {insights.map((insight) => {
        const Icon = INSIGHT_ICON[insight.type] ?? AlertCircle;
        return (
          <motion.div
            key={insight.id}
            variants={reduced ? undefined : item}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <Card
              className={cn(
                "border-l-4 transition-shadow hover:shadow-md",
                INSIGHT_BORDER[insight.type],
                INSIGHT_BG[insight.type],
                insight.type === "critical" && "ring-1 ring-red-500/20"
              )}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    INSIGHT_ICON_STYLE[insight.type]
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {insight.message}
                  </p>
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                    <span>{insight.recommendation}</span>
                  </div>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(insight.timestamp)}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {insights.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No insights at this time.
        </p>
      )}
    </motion.div>
  );
}
