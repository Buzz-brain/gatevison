import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1 }: CountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced, duration]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export { CountUp };
