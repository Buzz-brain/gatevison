import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STATUS_CONFIG } from "../utils";
import type { OverallHealth } from "../types";

interface SystemHealthProps {
  health: OverallHealth;
}

function StatusRing({
  score,
  status,
  reduced,
}: {
  score: number;
  status: OverallHealth["status"];
  reduced: boolean;
}) {
  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = STATUS_CONFIG[status].hex;

  return (
    <div className="relative flex items-center justify-center" aria-hidden="true">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="90"
          cy="90"
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
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tabular-nums"
          style={{ color }}
          initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">/ 100</span>
      </div>
    </div>
  );
}

function HeartbeatPulse({
  status,
  reduced,
}: {
  status: OverallHealth["status"];
  reduced: boolean;
}) {
  if (reduced) return null;
  const color = STATUS_CONFIG[status].hex;
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <motion.div
        className="rounded-full"
        style={{
          width: 190,
          height: 190,
          border: `2px solid ${color}`,
          opacity: 0.15,
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.15, 0.05, 0.15],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

export function SystemHealth({ health }: SystemHealthProps) {
  const reduced = useReducedMotion();

  const services = useMemo(() => health.services, [health.services]);

  const statusColorMap: Record<string, string> = {
    healthy: "text-success",
    degraded: "text-warning",
    unhealthy: "text-danger",
    down: "text-muted-foreground",
  };

  return (
    <Card
      className="p-6"
      role="region"
      aria-label={`System health: ${STATUS_CONFIG[health.status].label}, score ${health.score}`}
    >
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <StatusRing
              score={health.score}
              status={health.status}
              reduced={reduced}
            />
            <HeartbeatPulse status={health.status} reduced={reduced} />
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-lg font-semibold uppercase tracking-wider",
                statusColorMap[health.status]
              )}
            >
              {STATUS_CONFIG[health.status].label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Overall Status</p>
          </div>
        </div>

        <div className="flex-1 w-full">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Service Status
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {services.map((service, i) => {
              const config = STATUS_CONFIG[service.status];
              const Icon = config.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={
                    reduced
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.05 }}
                  tabIndex={0}
                  role="status"
                  aria-label={`${service.name}: ${config.label}`}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: config.hex }}
                    />
                    <span className="text-sm font-medium truncate">
                      {service.name}
                    </span>
                  </div>
                  <StatusPill
                    status={service.status === "down" ? "inactive" : service.status}
                    label={config.label}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
