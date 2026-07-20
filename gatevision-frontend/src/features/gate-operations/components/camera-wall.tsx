import { motion } from "framer-motion";
import { Video, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { type CameraFeed } from "../types";

interface CameraWallProps {
  cameras: CameraFeed[];
}

export function CameraWall({ cameras }: CameraWallProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cameras.map((cam) => {
        const offline = cam.status === "offline";
        return (
          <Card key={cam.id} className="overflow-hidden p-0">
            <div className="relative aspect-video w-full">
              {offline ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-900">
                  <span className="font-mono text-xs tracking-widest text-slate-500">
                    NO SIGNAL
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    initial={prefersReduced ? undefined : { x: "-100%" }}
                    animate={prefersReduced ? undefined : { x: "100%" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute left-2 top-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="font-mono text-[10px] text-white/80">REC</span>
                    </div>
                    {cam.recording && (
                      <Badge variant="danger" size="sm">
                        REC
                      </Badge>
                    )}
                    {cam.aiActive && (
                      <Badge variant="info" size="sm">
                        AI
                      </Badge>
                    )}
                  </div>

                  <div className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
                    {cam.fps} FPS
                  </div>

                  <div className="absolute left-2 bottom-2 font-mono text-[11px] text-white/90">
                    {cam.label}
                  </div>

                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Wifi className="h-3 w-3 text-emerald-400" />
                    <span className="font-mono text-[10px] text-emerald-400">LIVE</span>
                  </div>

                  {cam.currentPlate ? (
                    <div className="absolute inset-x-2 bottom-8 text-center">
                      <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
                        {cam.currentPlate}
                      </span>
                    </div>
                  ) : cam.vehicleWaiting ? (
                    <div className="absolute inset-x-0 bottom-8 text-center">
                      <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-amber-300">
                        Vehicle waiting
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Video className="h-3.5 w-3.5" />
                <span className="truncate">{cam.label}</span>
              </div>
              <Badge variant={offline ? "neutral" : "success"} size="sm">
                {offline ? "OFFLINE" : "LIVE"}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
