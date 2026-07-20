import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { BoundingBox as BoundingBoxType } from "../types";

interface BoundingBoxProps {
  box: BoundingBoxType;
  animate?: boolean;
}

function BoundingBox({ box, animate = true }: BoundingBoxProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="absolute border-2"
      style={{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        borderColor: box.color,
        boxShadow: `0 0 12px ${box.color}40`,
      }}
      initial={prefersReduced || !animate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Corner accents */}
      <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2" style={{ borderColor: box.color }} />
      <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2" style={{ borderColor: box.color }} />
      <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2" style={{ borderColor: box.color }} />
      <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2" style={{ borderColor: box.color }} />

      {/* Label */}
      <div
        className="absolute -top-7 left-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: box.color }}
      >
        {box.label} · {box.confidence.toFixed(1)}%
      </div>

      {/* Scanning line for active detection feel */}
      {animate && !prefersReduced && (
        <motion.div
          className="absolute left-0 right-0 h-0.5"
          style={{ backgroundColor: box.color, boxShadow: `0 0 8px ${box.color}` }}
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

export { BoundingBox };
