import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ConfidenceGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
  showValue?: boolean;
}

function ConfidenceGauge({
  value,
  size = 80,
  strokeWidth = 8,
  label,
  color,
  showValue = true,
}: ConfidenceGaugeProps) {
  const prefersReduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  const gaugeColor = color || (clamped >= 90 ? "#22C55E" : clamped >= 70 ? "#F59E0B" : "#EF4444");

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-elevated"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={prefersReduced ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: prefersReduced ? 0 : 1, ease: "easeOut" }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold" style={{ color: gaugeColor }}>
              {clamped.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}

export { ConfidenceGauge };
