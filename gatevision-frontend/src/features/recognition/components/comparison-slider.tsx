import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ComparisonSliderProps {
  referenceLabel?: string;
  liveLabel?: string;
  referenceColor?: string;
  liveColor?: string;
  orientation?: "horizontal" | "vertical";
}

function ComparisonSlider({
  referenceLabel = "Reference",
  liveLabel = "Live Capture",
  referenceColor = "from-green-500/20 to-green-600/5",
  liveColor = "from-blue-500/20 to-blue-600/5",
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  };

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-lg border border-border select-none cursor-ew-resize"
      onMouseMove={handleMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseDown={() => setIsDragging(true)}
      onTouchMove={handleMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Reference (bottom layer) */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", liveColor)}>
        <div className="flex h-full items-center justify-center">
          <span className="text-xs text-muted-foreground/50">{liveLabel}</span>
        </div>
      </div>

      {/* Live (top layer, clipped) */}
      <div
        className={cn("absolute inset-0 bg-gradient-to-br", referenceColor)}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="flex h-full items-center justify-center">
          <span className="text-xs text-foreground/70">{referenceLabel}</span>
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/80"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md flex items-center justify-center">
          <div className="h-3 w-3 rounded-full border-2 border-primary" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">
        {referenceLabel}
      </span>
      <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">
        {liveLabel}
      </span>
    </div>
  );
}

export { ComparisonSlider };
