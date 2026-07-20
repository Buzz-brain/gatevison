import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Clock, Shield, Zap, ArrowDown, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { GateConfig } from "../types";

interface GateSettingsProps {
  gateConfig: GateConfig;
  onSetGateConfig: (config: GateConfig) => void;
}

function SliderControl({ label, value, min, max, step, unit, onChange, icon: Icon, color }: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; onChange: (v: number) => void;
  icon?: typeof Clock; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn("h-3.5 w-3.5", color ?? "text-muted-foreground")} />}
          <Label>{label}</Label>
        </div>
        <span className="text-xs font-mono font-medium text-muted-foreground">
          {value.toLocaleString()}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface"
        style={{
          background: `linear-gradient(to right, ${color ?? "var(--primary)"} ${pct}%, hsl(var(--surface)) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>{min.toLocaleString()}{unit ? ` ${unit}` : ""}</span>
        <span>{max.toLocaleString()}{unit ? ` ${unit}` : ""}</span>
      </div>
    </div>
  );
}

function GateTimingDiagram({ openDelay, closeDelay, safetyTimeout, barrierSpeed }: {
  openDelay: number; closeDelay: number; safetyTimeout: number; barrierSpeed: number;
}) {
  const prefersReduced = useReducedMotion();
  const [animPhase, setAnimPhase] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (prefersReduced) return;
    intervalRef.current = setInterval(() => {
      setAnimPhase((p) => (p + 1) % 4);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [prefersReduced]);

  const totalDuration = openDelay + safetyTimeout + closeDelay;
  const openPct = (openDelay / totalDuration) * 100;
  const safePct = (safetyTimeout / totalDuration) * 100;
  const closePct = (closeDelay / totalDuration) * 100;

  const phases = [
    { label: "Detecting", color: "bg-blue-500" },
    { label: "Opening", color: "bg-emerald-500" },
    { label: "Safety Hold", color: "bg-amber-500" },
    { label: "Closing", color: "bg-red-500" },
  ];

  const currentPhase = prefersReduced ? 0 : animPhase;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Gate Timing Diagram</CardTitle>
        <CardDescription>Visual representation of gate operation sequence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-16 w-full overflow-hidden rounded-lg bg-surface/50 border border-border">
          <motion.div
            className="absolute inset-y-0 left-0 bg-blue-500/30 border-r border-blue-500/50"
            initial={false}
            animate={{ width: `${openPct}%` }}
            transition={{ duration: 0.3 }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-blue-400">
              {openDelay}ms
            </span>
          </motion.div>
          <motion.div
            className="absolute inset-y-0 bg-emerald-500/30 border-r border-emerald-500/50"
            initial={false}
            animate={{ left: `${openPct}%`, width: `${safePct}%` }}
            transition={{ duration: 0.3 }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-emerald-400">
              {safetyTimeout}ms
            </span>
          </motion.div>
          <motion.div
            className="absolute inset-y-0 bg-red-500/30"
            initial={false}
            animate={{ left: `${openPct + safePct}%`, width: `${closePct}%` }}
            transition={{ duration: 0.3 }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-red-400">
              {closeDelay}ms
            </span>
          </motion.div>

          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-white/80"
            initial={false}
            animate={{
              left: currentPhase === 0 ? "0%"
                : currentPhase === 1 ? `${openPct}%`
                : currentPhase === 2 ? `${openPct + safePct}%`
                : "100%",
            }}
            transition={{ duration: prefersReduced ? 0 : 0.5, ease: "easeInOut" }}
          />
        </div>

        <div className="flex items-center gap-3">
          {phases.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", phase.color, currentPhase === i && "ring-2 ring-white/30")} />
              <span className={cn("text-[10px]", currentPhase === i ? "text-foreground font-medium" : "text-muted-foreground")}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-md bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
          <span>Total Cycle</span>
          <span className="font-mono font-medium">{totalDuration.toLocaleString()}ms ({(totalDuration / 1000).toFixed(1)}s)</span>
        </div>

        <div className="flex items-center justify-between rounded-md bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
          <span>Barrier Speed</span>
          <span className="font-mono font-medium">Level {barrierSpeed} / 10</span>
        </div>
      </CardContent>
    </Card>
  );
}

function GateSettings({ gateConfig, onSetGateConfig }: GateSettingsProps) {
  const prefersReduced = useReducedMotion();

  const update = (partial: Partial<GateConfig>) => {
    onSetGateConfig({ ...gateConfig, ...partial });
  };

  const updateDetection = (partial: Partial<GateConfig["vehicleDetectionZone"]>) => {
    onSetGateConfig({
      ...gateConfig,
      vehicleDetectionZone: { ...gateConfig.vehicleDetectionZone, ...partial },
    });
  };

  const assignmentEntries = Object.entries(gateConfig.gateAssignment);

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Gate Timing
              </CardTitle>
              <CardDescription>
                Configure delays and safety parameters for gate operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SliderControl
                label="Open Delay"
                value={gateConfig.openDelay}
                min={0}
                max={5000}
                step={100}
                unit="ms"
                onChange={(openDelay) => update({ openDelay })}
                icon={ArrowDown}
                color="#10b981"
              />

              <SliderControl
                label="Close Delay"
                value={gateConfig.closeDelay}
                min={500}
                max={10000}
                step={100}
                unit="ms"
                onChange={(closeDelay) => update({ closeDelay })}
                icon={Clock}
                color="#ef4444"
              />

              <SliderControl
                label="Safety Timeout"
                value={gateConfig.safetyTimeout}
                min={3000}
                max={30000}
                step={1000}
                unit="ms"
                onChange={(safetyTimeout) => update({ safetyTimeout })}
                icon={Shield}
                color="#f59e0b"
              />

              <Separator />

              <SliderControl
                label="Barrier Speed"
                value={gateConfig.barrierSpeed}
                min={1}
                max={10}
                step={1}
                onChange={(barrierSpeed) => update({ barrierSpeed })}
                icon={Zap}
                color="#8b5cf6"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <GateTimingDiagram
            openDelay={gateConfig.openDelay}
            closeDelay={gateConfig.closeDelay}
            safetyTimeout={gateConfig.safetyTimeout}
            barrierSpeed={gateConfig.barrierSpeed}
          />
        </motion.div>
      </div>

      <motion.div variants={prefersReduced ? undefined : fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Safety Overrides
            </CardTitle>
            <CardDescription>
              Emergency and manual control settings. Use with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Emergency Open</Label>
                  {gateConfig.emergencyOpen && (
                    <Badge variant="warning" size="sm">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Allow emergency override to open all gates simultaneously
                </p>
              </div>
              <Switch
                checked={gateConfig.emergencyOpen}
                onCheckedChange={(emergencyOpen) => update({ emergencyOpen })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Manual Override</Label>
                  {gateConfig.manualOverride && (
                    <Badge variant="warning" size="sm">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Allow manual gate control from the operations dashboard
                </p>
              </div>
              <Switch
                checked={gateConfig.manualOverride}
                onCheckedChange={(manualOverride) => update({ manualOverride })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Vehicle Detection Zone</CardTitle>
              <CardDescription>Configure proximity detection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Detection Zone Enabled</Label>
                <Switch
                  checked={gateConfig.vehicleDetectionZone.enabled}
                  onCheckedChange={(enabled) => updateDetection({ enabled })}
                />
              </div>
              {gateConfig.vehicleDetectionZone.enabled && (
                <SliderControl
                  label="Detection Distance"
                  value={gateConfig.vehicleDetectionZone.distance}
                  min={1}
                  max={20}
                  step={0.5}
                  unit="m"
                  onChange={(distance) => updateDetection({ distance })}
                  color="#3b82f6"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Gate Assignments
              </CardTitle>
              <CardDescription>Camera-to-gate mapping (read-only)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignmentEntries.map(([gate, cams]) => (
                  <div key={gate} className="flex items-start justify-between rounded-md bg-surface/50 px-3 py-2.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {gate.replace("-", " ")}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cams.map((cam) => (
                        <Badge key={cam} variant="neutral" size="sm">{cam}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {assignmentEntries.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 text-center py-4">No gate assignments configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { GateSettings };
