import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Timer,
  AlertTriangle,
  BarChart3,
  FileText,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { useSettings } from "../hooks/use-settings";
import { LOG_LEVEL_OPTIONS } from "../utils";

function MonitoringSettings() {
  const { monitoring, setMonitoring } = useSettings();
  const reduced = useReducedMotion();

  const alertPercent = useMemo(
    () => Math.round(monitoring.alertThreshold * 100),
    [monitoring.alertThreshold],
  );

  const alertColor = useMemo(() => {
    if (alertPercent >= 90) return "text-danger";
    if (alertPercent >= 70) return "text-warning";
    return "text-success";
  }, [alertPercent]);

  const alertBarColor = useMemo(() => {
    if (alertPercent >= 90) return "bg-danger";
    if (alertPercent >= 70) return "bg-warning";
    return "bg-success";
  }, [alertPercent]);

  return (
    <motion.div
      variants={reduced ? undefined : fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Monitoring Configuration</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure health checks, metrics collection, and alerting thresholds
          </p>
        </div>

        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Intervals */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="h-4 w-4 text-primary" />
                  Check Intervals
                </CardTitle>
                <CardDescription>
                  Configure how often system health checks and metrics are collected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Health Check Interval</Label>
                    <Badge variant="outline" size="sm">{monitoring.healthCheckInterval}s</Badge>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={300}
                    step={5}
                    value={monitoring.healthCheckInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setMonitoring({ ...monitoring, healthCheckInterval: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5s (frequent)</span>
                    <span>300s (5 min)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Metrics Collection Interval</Label>
                    <Badge variant="outline" size="sm">{monitoring.metricsInterval}s</Badge>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={monitoring.metricsInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setMonitoring({ ...monitoring, metricsInterval: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5s</span>
                    <span>120s (2 min)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alert Threshold */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Alerting
                </CardTitle>
                <CardDescription>
                  Set thresholds and configure alert behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Alert Threshold</Label>
                    <span className={cn("text-lg font-bold tabular-nums", alertColor)}>
                      {alertPercent}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={alertPercent} className="h-3" />
                    <div
                      className={cn("absolute top-0 left-0 h-3 rounded-full opacity-30 transition-all duration-300", alertBarColor)}
                      style={{ width: `${alertPercent}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={99}
                    step={1}
                    value={alertPercent}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setMonitoring({ ...monitoring, alertThreshold: val / 100 });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50% (sensitive)</span>
                    <span>99% (strict)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pipeline Monitoring</Label>
                    <p className="text-xs text-muted-foreground">
                      Monitor AI inference pipeline health in real-time
                    </p>
                  </div>
                  <Switch
                    checked={monitoring.pipelineMonitoring}
                    onCheckedChange={(val) => setMonitoring({ ...monitoring, pipelineMonitoring: val })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logging & Sampling */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Logging & Sampling
                </CardTitle>
                <CardDescription>
                  Configure log verbosity and performance profiling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select
                    options={LOG_LEVEL_OPTIONS}
                    value={monitoring.logLevel}
                    onChange={(e) =>
                      setMonitoring({
                        ...monitoring,
                        logLevel: e.target.value as "debug" | "info" | "warning" | "error",
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {monitoring.logLevel === "debug" && "Verbose output for development and troubleshooting"}
                    {monitoring.logLevel === "info" && "Standard operational logging"}
                    {monitoring.logLevel === "warning" && "Only warnings and errors"}
                    {monitoring.logLevel === "error" && "Critical errors only (minimal disk usage)"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Performance Sampling</Label>
                    <Badge variant="outline" size="sm">{monitoring.performanceSampling}%</Badge>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={monitoring.performanceSampling}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setMonitoring({ ...monitoring, performanceSampling: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1% (minimal overhead)</span>
                    <span>100% (full profiling)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Event Retention */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-primary" />
                  Event Retention
                </CardTitle>
                <CardDescription>
                  How long to keep monitoring events before automatic cleanup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Event Retention Period</Label>
                  <Badge variant="outline" size="sm">{monitoring.eventRetention} days</Badge>
                </div>
                <input
                  type="range"
                  min={1}
                  max={365}
                  step={1}
                  value={monitoring.eventRetention}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setMonitoring({ ...monitoring, eventRetention: val });
                  }}
                  className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 day</span>
                  <span>365 days</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Stats */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card className="border-info/30 bg-info/5">
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{monitoring.healthCheckInterval}s</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Health checks</p>
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold tabular-nums", alertColor)}>
                      {alertPercent}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Alert threshold</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{monitoring.eventRetention}d</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Event retention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { MonitoringSettings };
