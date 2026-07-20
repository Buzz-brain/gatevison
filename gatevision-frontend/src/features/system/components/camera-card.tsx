import { useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Thermometer,
  Clock,
  Signal,
  Wifi,
  WifiOff,
  MapPin,
  Activity,
  RefreshCw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CAMERA_STATUS_CONFIG } from "../utils";
import type { CameraInfo } from "../types";

interface CameraCardProps {
  camera: CameraInfo;
  selected?: boolean;
  onSelect?: () => void;
}

function FpsGauge({ fps, reduced }: { fps: number; reduced: boolean }) {
  const maxFps = 60;
  const pct = Math.min((fps / maxFps) * 100, 100);
  const color = fps >= 30 ? "#22c55e" : fps >= 15 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" aria-hidden="true">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="5"
        />
        <motion.circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            reduced
              ? { strokeDashoffset: offset }
              : { strokeDashoffset: circumference }
          }
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-base font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {fps}
        </span>
        <span className="text-[8px] text-muted-foreground mt-0.5">FPS</span>
      </div>
    </div>
  );
}

function TemperatureIndicator({ temp }: { temp: number }) {
  const color =
    temp >= 70 ? "#ef4444" : temp >= 50 ? "#f59e0b" : "#22c55e";
  const label =
    temp >= 70 ? "Critical" : temp >= 50 ? "Warm" : "Normal";

  return (
    <div className="flex items-center gap-2">
      <Thermometer className="h-3.5 w-3.5" style={{ color }} />
      <span className="text-xs text-muted-foreground">Temp</span>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>
        {temp.toFixed(0)}C
      </span>
      <span className="text-[10px] text-muted-foreground">({label})</span>
    </div>
  );
}

function BandwidthBar({
  bandwidth,
  reduced,
}: {
  bandwidth: number;
  reduced: boolean;
}) {
  const maxBw = 100;
  const pct = Math.min((bandwidth / maxBw) * 100, 100);
  const color =
    bandwidth >= 80 ? "#22c55e" : bandwidth >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Bandwidth</span>
        <span className="text-xs tabular-nums text-foreground font-medium">
          {bandwidth.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={reduced ? { width: `${pct}%` } : { width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SignalStrengthBar({
  signal,
  reduced,
}: {
  signal: number;
  reduced: boolean;
}) {
  const color =
    signal >= 75 ? "#22c55e" : signal >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Signal</span>
        </div>
        <span className="text-xs tabular-nums text-foreground font-medium">
          {signal}%
        </span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => {
          const threshold = (i + 1) * 10;
          const filled = signal >= threshold;
          return (
            <motion.div
              key={i}
              className="h-2.5 flex-1 rounded-sm"
              style={{
                backgroundColor: filled ? color : "rgba(255,255,255,0.06)",
              }}
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: reduced ? 0 : i * 0.03 }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CameraCard({ camera, selected, onSelect }: CameraCardProps) {
  const reduced = useReducedMotion();
  const [previewing, setPreviewing] = useState(false);
  const isOffline = camera.status === "offline";

  const camConfig = CAMERA_STATUS_CONFIG[camera.status];
  const CamIcon = camConfig?.icon ?? Video;
  const statusColor =
    camera.status === "online"
      ? "#22c55e"
      : camera.status === "degraded"
        ? "#f59e0b"
        : camera.status === "reconnecting"
          ? "#3b82f6"
          : "#6b7280";

  return (
    <motion.div
      initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "p-5 relative overflow-hidden transition-all",
          selected && "ring-2 ring-primary",
          isOffline && "opacity-75"
        )}
        role="region"
        aria-label={`Camera: ${camera.name}`}
      >
        {/* Offline overlay */}
        {isOffline && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Camera Offline
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check connection
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="relative flex items-center justify-center rounded-lg p-1.5"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <CamIcon className="h-4 w-4" style={{ color: statusColor }} />
              <div
                className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background"
                style={{ backgroundColor: statusColor }}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{camera.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {camConfig?.label ?? camera.status}
              </p>
            </div>
          </div>
          <Badge
            variant={
              camera.status === "online"
                ? "success"
                : camera.status === "degraded"
                  ? "warning"
                  : "neutral"
            }
            size="sm"
          >
            {camConfig?.label ?? camera.status}
          </Badge>
        </div>

        {/* FPS Gauge + Basic Info */}
        <div className="flex items-center gap-4 mb-4">
          <FpsGauge fps={camera.fps} reduced={reduced} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1.5">
              <Video className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Resolution</span>
              <span className="text-xs font-medium text-foreground">
                {camera.resolution}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {camera.connection === "wifi" ? (
                <Wifi className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Activity className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">Connection</span>
              <span className="text-xs font-medium text-foreground capitalize">
                {camera.connection}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Frame</span>
              <span className="text-xs font-medium text-foreground">
                {camera.lastFrame}
              </span>
            </div>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-3 mb-4">
          <BandwidthBar bandwidth={camera.bandwidth} reduced={reduced} />
          <SignalStrengthBar signal={camera.signal} reduced={reduced} />
        </div>

        {/* Temperature and Latency */}
        <div className="flex items-center justify-between mb-4">
          <TemperatureIndicator temp={camera.temperature} />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Latency</span>
            <span className="text-xs font-medium tabular-nums text-foreground">
              {camera.latency}ms
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-4 px-2 py-1.5 rounded-lg bg-surface">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{camera.location}</span>
        </div>

        {/* Preview button */}
        <Button
          variant={previewing ? "default" : "outline"}
          size="sm"
          className="w-full"
          onClick={() => setPreviewing(!previewing)}
          disabled={isOffline}
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          {previewing ? "Close Preview" : "Preview Stream"}
        </Button>

        {/* Simulated preview stream */}
        {previewing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 overflow-hidden"
          >
            <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video flex items-center justify-center border border-border">
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 320 180">
                  <defs>
                    <pattern
                      id="grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              <div className="text-center z-10">
                <Video className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Live feed simulation
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {camera.resolution} @ {camera.fps}fps
                </p>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                <span className="text-[9px] text-muted-foreground font-medium">
                  REC
                </span>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-[9px] text-muted-foreground tabular-nums">
                  {camera.name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
