import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Gauge,
  Target,
  HardDrive,
  ShieldCheck,
  Timer,
  ArrowUp,
  ArrowDown,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { ConfigImpact } from "../types";

interface ConfigImpactProps {
  impact: ConfigImpact;
}

interface MetricDisplay {
  key: keyof ConfigImpact;
  label: string;
  icon: typeof Gauge;
  goodDirection: "up" | "down";
}

const METRICS: MetricDisplay[] = [
  { key: "recognitionSpeed", label: "Recognition Speed", icon: Gauge, goodDirection: "up" },
  { key: "accuracy", label: "Accuracy", icon: Target, goodDirection: "up" },
  { key: "storage", label: "Storage Impact", icon: HardDrive, goodDirection: "down" },
  { key: "security", label: "Security Level", icon: ShieldCheck, goodDirection: "up" },
  { key: "latency", label: "Latency", icon: Timer, goodDirection: "down" },
];

function AnimatedValue({ value, prefersReduced }: { value: number; prefersReduced: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [value, prefersReduced]);

  return <span className="font-mono text-2xl font-bold tabular-nums">{display}</span>;
}

function ImpactCard({
  metric,
  data,
  prefersReduced,
}: {
  metric: MetricDisplay;
  data: { value: number; direction: "up" | "down"; label: string };
  prefersReduced: boolean;
}) {
  const Icon = metric.icon;
  const isGood = data.direction === metric.goodDirection;
  const ArrowIcon = data.direction === "up" ? ArrowUp : ArrowDown;

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerItem}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      whileHover={prefersReduced ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5",
            isGood ? "bg-success" : "bg-danger"
          )}
        />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  isGood ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted-foreground/70">{metric.label}</span>
            </div>
            <Badge variant={isGood ? "success" : "danger"} size="sm">
              <ArrowIcon className="h-3 w-3 mr-0.5" />
              {data.direction === "up" ? "Up" : "Down"}
            </Badge>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <AnimatedValue value={data.value} prefersReduced={prefersReduced} />
            <span className="mb-1 text-xs text-muted-foreground/50">%</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={cn("text-xs font-medium", isGood ? "text-success" : "text-danger")}>
              {data.label}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConfigImpact({ impact }: ConfigImpactProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          System Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={prefersReduced ? undefined : staggerContainer}
          initial={prefersReduced ? undefined : "hidden"}
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {METRICS.map((metric) => {
            const data = impact[metric.key];
            return (
              <ImpactCard
                key={metric.key}
                metric={metric}
                data={data}
                prefersReduced={prefersReduced}
              />
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}

export { ConfigImpact };
