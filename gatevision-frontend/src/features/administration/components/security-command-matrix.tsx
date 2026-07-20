import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Monitor,
  ClipboardCheck,
  AlertTriangle,
  Shield,
  Activity,
  User,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CommandMatrixData, SecurityEvent, RoleId } from "../types";
import { ROLE_CONFIG, SEVERITY_CONFIG, formatTime } from "../utils";

const BG_GRID =
  "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px)";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.99) {
    endAngle = startAngle + 359.99;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArc, 0, end.x, end.y,
  ].join(" ");
}

function DonutChart({
  data,
  reduced,
}: {
  data: { role: string; count: number; color: string }[];
  reduced: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const cx = 100;
  const cy = 100;
  const r = 70;
  const strokeWidth = 24;
  let cumulative = 0;

  const arcs = data.map((segment, i) => {
    const angle = (segment.count / total) * 360;
    const startAngle = cumulative;
    cumulative += angle;
    const endAngle = cumulative;
    const midAngle = startAngle + angle / 2;
    const mid = polarToCartesian(cx, cy, r + strokeWidth + 16, midAngle);
    return { ...segment, startAngle, endAngle, mid, index: i };
  });

  return (
    <div className="relative flex items-center gap-4">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {arcs.map((arc) => (
            <g key={arc.index}>
              <path
                d={describeArc(cx, cy, r, arc.startAngle, arc.endAngle)}
                fill="none"
                stroke={arc.color}
                strokeWidth={hovered === arc.index ? strokeWidth + 6 : strokeWidth}
                strokeLinecap="round"
                opacity={hovered !== null && hovered !== arc.index ? 0.35 : 1}
                style={{
                  transition: reduced
                    ? "none"
                    : "stroke-width 0.2s, opacity 0.2s",
                }}
                onMouseEnter={() => setHovered(arc.index)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          ))}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-foreground text-2xl font-bold"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            total users
          </text>
        </svg>

        <AnimatePresence>
          {hovered !== null && arcs[hovered] && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0 }}
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2 rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs shadow-lg"
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: arcs[hovered].color }}
              />
              <span className="font-medium">{arcs[hovered].role}</span>
              <span className="ml-1.5 text-muted-foreground">
                {arcs[hovered].count} ({Math.round((arcs[hovered].count / total) * 100)}%)
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-1.5">
        {arcs.map((arc) => (
          <div
            key={arc.index}
            className="flex items-center gap-2 text-xs"
            onMouseEnter={() => setHovered(arc.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: arc.color }}
            />
            <span className="text-muted-foreground">{arc.role}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {arc.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function riskColor(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-green-500";
}

function riskTextColor(score: number): string {
  if (score >= 70) return "text-red-500";
  if (score >= 40) return "text-amber-500";
  return "text-green-500";
}

interface SecurityCommandMatrixProps {
  data: CommandMatrixData;
}

export function SecurityCommandMatrix({ data }: SecurityCommandMatrixProps) {
  const reduced = useReducedMotion();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [ackEvents, setAckEvents] = useState<Set<string>>(new Set());

  const acknowledge = useCallback((id: string) => {
    setAckEvents((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const displayEvents = data.recentEvents.map((e) =>
    ackEvents.has(e.id) ? { ...e, acknowledged: true } : e
  );

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-primary/10 bg-[#0a0a0f] shadow-lg"
      style={{
        backgroundImage: BG_GRID,
        boxShadow: "0 0 40px rgba(59,130,246,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
      variants={stagger}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/[0.04]" />

      <div className="relative p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Security Command Matrix
          </h3>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            LIVE
          </span>
        </div>

        {/* TOP ROW - Live Counters */}
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            {
              label: "Live Users",
              value: data.liveUsers,
              icon: Users,
              accent: "text-primary",
              pulse: false,
            },
            {
              label: "Active Sessions",
              value: data.activeSessions,
              icon: Monitor,
              accent: "text-cyan-500",
              pulse: false,
            },
            {
              label: "Pending Reviews",
              value: data.pendingReviews,
              icon: ClipboardCheck,
              accent: "text-amber-500",
              pulse: data.pendingReviews > 0,
            },
            {
              label: "Critical Events",
              value: data.criticalEvents,
              icon: AlertTriangle,
              accent: "text-red-500",
              pulse: data.criticalEvents > 0,
            },
            {
              label: "Gates",
              value: `${data.gatesOnline}/${data.gatesOnline + data.gatesOffline}`,
              icon: Shield,
              accent: data.gatesOffline > 0 ? "text-amber-500" : "text-green-500",
              pulse: false,
              sub: `${data.gatesOffline} offline`,
            },
            {
              label: "Models",
              value: `${data.modelsHealthy}/${data.modelsHealthy + data.modelsDegraded}`,
              icon: Activity,
              accent: data.modelsDegraded > 0 ? "text-amber-500" : "text-green-500",
              pulse: data.modelsDegraded > 0,
              sub: `${data.modelsDegraded} degraded`,
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={reduced ? undefined : fadeUp}
                transition={{ duration: reduced ? 0 : 0.25, delay: i * 0.04 }}
              >
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5", stat.accent)} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums text-foreground">
                      {stat.value}
                    </span>
                    {stat.pulse && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                      </span>
                    )}
                  </div>
                  {stat.sub && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {stat.sub}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* MIDDLE ROW */}
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          {/* Role Distribution Donut */}
          <motion.div
            variants={reduced ? undefined : fadeUp}
            transition={{ duration: reduced ? 0 : 0.25, delay: 0.3 }}
          >
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role Distribution
              </h4>
              <DonutChart data={data.roleDistribution} reduced={reduced} />
            </div>
          </motion.div>

          {/* Privileged Accounts Heatmap */}
          <motion.div
            variants={reduced ? undefined : fadeUp}
            transition={{ duration: reduced ? 0 : 0.25, delay: 0.4 }}
          >
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Privileged Accounts
              </h4>
              <ScrollArea className="max-h-64">
                <div className="space-y-1.5">
                  {data.privilegedUsers.map((pu) => {
                    const rc = ROLE_CONFIG[pu.role as RoleId];
                    const isSelected = selectedUser === pu.userId;
                    return (
                      <motion.div
                        key={pu.userId}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary/10 ring-1 ring-primary/30"
                            : "hover:bg-white/[0.03]"
                        )}
                        onClick={() =>
                          setSelectedUser(isSelected ? null : pu.userId)
                        }
                        whileHover={reduced ? undefined : { x: 2 }}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            pu.riskScore >= 70
                              ? "bg-red-500/20 text-red-500"
                              : pu.riskScore >= 40
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-green-500/20 text-green-500"
                          )}
                        >
                          <User className="h-3.5 w-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {pu.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              size="sm"
                              className="text-[9px]"
                              style={{
                                borderColor: rc?.color ?? "#6b7280",
                                color: rc?.color ?? "#6b7280",
                              }}
                            >
                              {rc?.label ?? pu.role}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  riskColor(pu.riskScore)
                                )}
                                style={{ width: `${pu.riskScore}%` }}
                              />
                            </div>
                          </div>
                          <span
                            className={cn(
                              "w-7 text-right text-xs font-mono font-medium tabular-nums",
                              riskTextColor(pu.riskScore)
                            )}
                          >
                            {pu.riskScore}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM - Recent Security Events */}
        <motion.div
          variants={reduced ? undefined : fadeUp}
          transition={{ duration: reduced ? 0 : 0.25, delay: 0.5 }}
        >
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Security Events
              </h4>
              <span className="text-[10px] text-muted-foreground">
                {displayEvents.length} events
              </span>
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                <AnimatePresence>
                  {displayEvents.map((event) => {
                    const sev = SEVERITY_CONFIG[event.severity];
                    const acked =
                      event.acknowledged || ackEvents.has(event.id);
                    return (
                      <motion.div
                        key={event.id}
                        layout={!reduced}
                        initial={reduced ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? undefined : { opacity: 0 }}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors",
                          acked
                            ? "opacity-60"
                            : "hover:bg-white/[0.03]"
                        )}
                      >
                        <span
                          className={cn(
                            "relative h-2 w-2 shrink-0 rounded-full",
                            !acked && event.severity === "critical"
                              ? "animate-pulse"
                              : ""
                          )}
                          style={{ backgroundColor: sev.color }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {event.title}
                          </p>
                        </div>

                        <Badge variant="outline" size="sm" className="shrink-0 text-[9px]">
                          {event.module}
                        </Badge>

                        <span className="shrink-0 text-[10px] font-mono text-muted-foreground tabular-nums">
                          {formatTime(event.timestamp)}
                        </span>

                        {!acked && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0"
                            onClick={() => acknowledge(event.id)}
                            title="Acknowledge"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        )}
                        {acked && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
