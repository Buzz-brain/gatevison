import { type ReactNode, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { slideUp } from "@/lib/animations";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    positive: boolean;
  };
  subtitle?: string;
  className?: string;
  index?: number;
  gradient?: boolean;
}

function AnimatedValue({ value, duration = 800 }: { value: string | number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const numValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) || 0 : value;
  const suffix = typeof value === "string" ? value.replace(/[0-9.]/g, "") : "";

  useEffect(() => {
    if (numValue === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const end = numValue;
    const steps = 30;
    const stepTime = Math.max(16, duration / steps);
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [numValue, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
  index = 0,
  gradient = false,
}: MetricCardProps) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "rounded-xl bg-elevated border border-border shadow-card p-5 transition-all duration-200 ease-out card-hover group",
        gradient && "bg-gradient-to-br from-elevated via-elevated to-primary/[0.03]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
            <AnimatedValue value={value} />
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
                trend.positive ? "text-success" : "text-danger",
              )}
            >
              <span className={trend.positive ? "text-success" : "text-danger"}>
                {trend.positive ? "↑" : "↓"}
              </span>
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-200 group-hover:bg-primary/15 group-hover:scale-105">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { MetricCard, AnimatedValue };
