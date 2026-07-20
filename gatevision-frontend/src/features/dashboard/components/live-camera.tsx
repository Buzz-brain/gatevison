import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wifi, WifiOff, Video, Maximize2, Minimize2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCameraStatus } from "../hooks/use-dashboard-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Skeleton } from "@/components/ui/skeleton";

const DETECTIONS = [
  { x: 20, y: 25, w: 18, h: 14, label: "Plate", confidence: 99.1 },
  { x: 65, y: 30, w: 10, h: 40, label: "Person", confidence: 97.8 },
  { x: 40, y: 20, w: 12, h: 10, label: "Face", confidence: 97.8 },
  { x: 55, y: 45, w: 20, h: 16, label: "Vehicle", confidence: 95.6 },
];

function LiveCamera() {
  const { data: cam, isLoading, isError, refetch } = useCameraStatus();
  const isOnline = cam ? cam.status === "online" : true;
  const fps = cam?.fps ?? 30;
  const camName = cam?.name ?? "Main Entry Camera";
  const camGate = cam?.gate ?? "Main Gate";
  const [fullscreen, setFullscreen] = useState(false);
  const prefersReduced = useReducedMotion();

  const boxes = useMemo(() => DETECTIONS, []);

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <Skeleton className="aspect-video w-full" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="relative overflow-hidden">
        <div className="aspect-video bg-black flex flex-col items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground">Camera feed unavailable</p>
          <Button variant="ghost" size="xs" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden",
      fullscreen && "fixed inset-4 z-50",
    )}>
      <div className="relative aspect-video bg-black">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-12 w-12 text-muted-foreground/20" />
        </div>

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 56">
          {boxes.map((b, i) => (
            <motion.g
              key={i}
              initial={prefersReduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15 + 0.3 }}
            >
              <rect
                x={b.x} y={b.y} width={b.w} height={b.h}
                className="fill-none stroke-success/70"
                strokeWidth="0.3"
                rx="0.5"
              />
              <text
                x={b.x + 1} y={b.y + b.h - 1}
                className="fill-white/80"
                fontSize="2"
                fontWeight="bold"
              >
                {b.label} {b.confidence.toFixed(0)}%
              </text>
            </motion.g>
          ))}
        </svg>

        {isOnline ? (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] text-white/70 font-mono tracking-wider">LIVE</span>
          </div>
        ) : (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-danger/20 px-1.5 py-0.5 rounded">
            <span className="text-[9px] text-danger font-mono">OFFLINE</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/60 font-medium">{camName}</span>
            <span className="text-[8px] text-white/40">{camGate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-white/40">{fps} FPS</span>
            {isOnline ? (
              <Wifi className="h-2.5 w-2.5 text-success/70" />
            ) : (
              <WifiOff className="h-2.5 w-2.5 text-danger/70" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "success" : "danger"} size="sm">
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <span className="text-[10px] text-muted-foreground/60">{camName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export { LiveCamera };
