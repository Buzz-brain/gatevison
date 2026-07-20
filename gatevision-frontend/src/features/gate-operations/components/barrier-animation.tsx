import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { BarrierState } from "../types";

interface BarrierAnimationProps {
  barrier: BarrierState;
  plate?: string;
}

const STATUS_TEXT: Record<BarrierState, string> = {
  closed: "CLOSED",
  raising: "OPENING",
  open: "OPEN",
  lowering: "CLOSING",
};

const STATUS_COLOR: Record<BarrierState, string> = {
  closed: "text-muted-foreground",
  raising: "text-warning",
  open: "text-success",
  lowering: "text-warning",
};

export function BarrierAnimation({ barrier, plate }: BarrierAnimationProps) {
  const prefersReduced = useReducedMotion();
  const angle = barrier === "raising" || barrier === "open" ? -80 : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Barrier</p>
        <span className="font-mono text-xs text-muted-foreground">{plate ?? "---"}</span>
      </div>

      <svg
        viewBox="0 0 200 140"
        className="mt-2 w-full"
        role="img"
        aria-label="Barrier animation"
      >
        {/* road */}
        <rect x="20" y="110" width="160" height="20" fill="#1f2937" />
        <line
          x1="20"
          y1="120"
          x2="180"
          y2="120"
          stroke="#facc15"
          strokeWidth="1"
          strokeDasharray="8 6"
        />

        {/* pillars */}
        <rect x="26" y="40" width="8" height="72" rx="2" fill="#475569" />
        <rect x="166" y="40" width="8" height="72" rx="2" fill="#475569" />

        {/* moving car when open */}
        {barrier === "open" && (
          <motion.g
            initial={prefersReduced ? undefined : { translateX: -50 }}
            animate={prefersReduced ? undefined : { translateX: 50 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          >
            <rect x="78" y="100" width="34" height="14" rx="3" fill="#3b82f6" />
            <rect x="84" y="94" width="22" height="8" rx="2" fill="#60a5fa" />
            <circle cx="86" cy="116" r="3" fill="#0f172a" />
            <circle cx="104" cy="116" r="3" fill="#0f172a" />
          </motion.g>
        )}

        {/* barrier bar pivoting at top of left pillar */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "30px 44px" }}
          initial={prefersReduced ? undefined : { rotate: 0 }}
          animate={{ rotate: angle }}
          transition={{
            type: "tween",
            duration: prefersReduced ? 0 : 0.8,
            ease: "easeInOut",
          }}
        >
          <rect x="30" y="42" width="140" height="5" rx="2" fill="#ef4444" />
          <rect x="40" y="42" width="10" height="5" fill="#facc15" />
          <rect x="60" y="42" width="10" height="5" fill="#facc15" />
          <rect x="80" y="42" width="10" height="5" fill="#facc15" />
          <rect x="100" y="42" width="10" height="5" fill="#facc15" />
          <rect x="120" y="42" width="10" height="5" fill="#facc15" />
          <rect x="140" y="42" width="10" height="5" fill="#facc15" />
        </motion.g>
      </svg>

      <div className="mt-2 flex items-center justify-between">
        <span className={"font-mono text-sm " + STATUS_COLOR[barrier]}>
          {STATUS_TEXT[barrier]}
        </span>
        <span className="text-xs text-muted-foreground">
          {plate ? `Plate: ${plate}` : "No vehicle"}
        </span>
      </div>
    </Card>
  );
}
