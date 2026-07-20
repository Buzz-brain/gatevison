import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BoundingBox } from "./bounding-box";
import type { DetectionOverlay as OverlayType } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface DetectionOverlayProps {
  overlay: OverlayType | null;
  activeStage?: string;
  imageUrl?: string;
}

function DetectionOverlay({ overlay, activeStage, imageUrl }: DetectionOverlayProps) {
  const prefersReduced = useReducedMotion();

  const stageMap: Record<string, "vehicle" | "plate" | "face"> = {
    vehicle_detection: "vehicle",
    plate_detection: "plate",
    face_recognition: "face",
  };

  const shouldShow = (key: "vehicle" | "plate" | "face"): boolean => {
    if (!overlay || !overlay[key]) return false;
    if (!activeStage) return true;
    const mapKey = stageMap[activeStage];
    if (!mapKey) return true;
    const order = ["vehicle", "plate", "face"];
    return order.indexOf(key) <= order.indexOf(mapKey);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {/* Image placeholder / actual image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Captured frame"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-elevated">
          {/* Road perspective */}
          <svg viewBox="0 0 480 270" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a2433" />
                <stop offset="100%" stopColor="#0d1219" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="480" height="270" fill="url(#road)" />
            <polygon points="200,0 280,0 360,270 120,270" fill="#111827" opacity="0.6" />
            <line x1="240" y1="0" x2="240" y2="270" stroke="#3b4452" strokeWidth="1" strokeDasharray="10 8" opacity="0.4" />
          </svg>
        </div>
      )}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scan line */}
      {!prefersReduced && (
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-primary/30"
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Bounding boxes */}
      <AnimatePresence>
        {overlay?.vehicle && shouldShow("vehicle") && (
          <BoundingBox box={overlay.vehicle} animate={activeStage === "vehicle_detection"} />
        )}
        {overlay?.plate && shouldShow("plate") && (
          <BoundingBox box={overlay.plate} animate={activeStage === "plate_detection"} />
        )}
        {overlay?.face && shouldShow("face") && (
          <BoundingBox box={overlay.face} animate={activeStage === "face_recognition"} />
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded bg-black/50 px-2 py-1">
        <div className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
        <span className="text-[10px] font-mono text-white/90">REC</span>
      </div>

      {/* Frame info */}
      <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-white/70">
        480×270 · 30fps
      </div>
    </div>
  );
}

export { DetectionOverlay };
