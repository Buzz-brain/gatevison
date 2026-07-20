import { motion } from "framer-motion";
import {
  Wifi,
  WifiOff,
  Video,
  MapPin,
  Signal,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CAMERA_STATUS_CONFIG, STATUS_CONFIG } from "../utils";
import type { CameraInfo } from "../types";

interface CameraNetworkProps {
  cameras: CameraInfo[];
  onSelect: (c: CameraInfo) => void;
  selectedId?: string;
}

function SignalBar({ signal }: { signal: number }) {
  const color =
    signal >= 75 ? "#22c55e" : signal >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5">
      <Signal className="h-3 w-3 text-muted-foreground" />
      <div className="h-1.5 w-12 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(signal, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {signal}%
      </span>
    </div>
  );
}

function CameraTile({
  camera,
  isSelected,
  onSelect,
  reduced,
  index,
}: {
  camera: CameraInfo;
  isSelected: boolean;
  onSelect: () => void;
  reduced: boolean;
  index: number;
}) {
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
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : index * 0.05 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left rounded-xl border-2 p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border bg-elevated hover:border-muted-foreground/30 hover:bg-surface"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg p-1.5"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <CamIcon className="h-4 w-4" style={{ color: statusColor }} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                {camera.name}
              </p>
              <p className="text-[10px] text-muted-foreground">{camera.id}</p>
            </div>
          </div>
          <Badge
            variant={
              camera.status === "online"
                ? "success"
                : camera.status === "degraded"
                  ? "warning"
                  : camera.status === "reconnecting"
                    ? "info"
                    : "neutral"
            }
            size="sm"
          >
            {camConfig?.label ?? camera.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Video className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">FPS</span>
            <span className="text-xs font-medium tabular-nums text-foreground">
              {camera.fps}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Res</span>
            <span className="text-xs font-medium tabular-nums text-foreground">
              {camera.resolution}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <SignalBar signal={camera.signal} />
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">
            {camera.location}
          </span>
        </div>
      </button>
    </motion.div>
  );
}

export function CameraNetwork({
  cameras,
  onSelect,
  selectedId,
}: CameraNetworkProps) {
  const reduced = useReducedMotion();

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const totalCount = cameras.length;

  return (
    <div role="region" aria-label="Camera network">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">Camera Network</h3>
          <Badge variant="outline" size="sm">
            {onlineCount}/{totalCount} online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cameras.map((camera, i) => (
          <CameraTile
            key={camera.id}
            camera={camera}
            isSelected={camera.id === selectedId}
            onSelect={() => onSelect(camera)}
            reduced={reduced}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
