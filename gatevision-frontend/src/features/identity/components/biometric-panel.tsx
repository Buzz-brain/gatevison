import { motion } from "framer-motion";
import { Fingerprint, UserCheck, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { DriverProfile } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface BiometricPanelProps {
  driver: DriverProfile;
}

function BiometricPanel({ driver }: BiometricPanelProps) {
  const prefersReduced = useReducedMotion();
  const b = driver.biometrics;

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">Biometric Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className={cn("rounded-lg p-3", b.faceEnrolled ? "bg-success/5" : "bg-surface")}>
          <UserCheck className={cn("h-5 w-5", b.faceEnrolled ? "text-success" : "text-muted-foreground")} />
          <p className="mt-1 text-[10px] text-muted-foreground/60">Face Enrolled</p>
          <p className="text-sm font-semibold flex items-center gap-1">{b.faceEnrolled ? <CheckCircle2 className="h-3 w-3 text-success" /> : "—"}</p>
        </div>
        <div className={cn("rounded-lg p-3", b.vehicleFingerprintEnrolled ? "bg-success/5" : "bg-surface")}>
          <Fingerprint className={cn("h-5 w-5", b.vehicleFingerprintEnrolled ? "text-success" : "text-muted-foreground")} />
          <p className="mt-1 text-[10px] text-muted-foreground/60">Vehicle FP</p>
          <p className="text-sm font-semibold flex items-center gap-1">{b.vehicleFingerprintEnrolled ? <CheckCircle2 className="h-3 w-3 text-success" /> : "—"}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="rounded-lg bg-surface p-3">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground/60">Enrollment Quality</span><span className="font-mono font-semibold">{b.quality.toFixed(1)}%</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-elevated overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${b.quality}%` }} /></div>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground/60">Confidence</span><span className="font-mono font-semibold">{b.confidence > 0 ? `${b.confidence.toFixed(1)}%` : "—"}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-elevated overflow-hidden"><div className="h-full rounded-full bg-success" style={{ width: `${b.confidence}%` }} /></div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-surface p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><TrendingUp className="h-3 w-3" /> Confidence Trend</p>
        <div className="flex h-14 items-end gap-1">
          {b.confidenceTrend.map((c: number, i: number) => (
            <motion.div
              key={i}
              initial={prefersReduced ? undefined : { height: 0 }}
              animate={{ height: `${Math.max(8, c)}%` }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex-1 rounded-t bg-primary/70"
              title={`${c}%`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

export { BiometricPanel };
