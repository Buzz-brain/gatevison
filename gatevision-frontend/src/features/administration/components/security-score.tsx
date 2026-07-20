import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { SecurityScoreBreakdown } from "../types";

const BREAKDOWN_LABELS: Record<keyof SecurityScoreBreakdown, string> = {
  mfaAdoption: "MFA Adoption",
  failedLoginsScore: "Failed Logins",
  passwordStrength: "Password Strength",
  activeSessionsScore: "Active Sessions",
  permissionHygiene: "Permission Hygiene",
  auditCompliance: "Audit Compliance",
};

function scoreColor(v: number): string {
  if (v >= 80) return "bg-green-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(v: number): string {
  if (v >= 80) return "text-green-500";
  if (v >= 60) return "text-amber-500";
  return "text-red-500";
}

function scoreLabel(v: number): string {
  if (v >= 80) return "Excellent";
  if (v >= 60) return "Good";
  if (v >= 40) return "Fair";
  return "Poor";
}

const GAUGE_SIZE = 200;
const GAUGE_STROKE = 14;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = Math.PI * GAUGE_RADIUS;
const GAUGE_CENTER = GAUGE_SIZE / 2;

interface SecurityScoreProps {
  score: SecurityScoreBreakdown;
}

export function SecurityScore({ score }: SecurityScoreProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  const overall = Math.round(
    (score.mfaAdoption +
      score.failedLoginsScore +
      score.passwordStrength +
      score.activeSessionsScore +
      score.permissionHygiene +
      score.auditCompliance) /
      6
  );

  useEffect(() => {
    if (reduced) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, [reduced]);

  const dashOffset = mounted
    ? GAUGE_CIRCUMFERENCE * (1 - overall / 100)
    : GAUGE_CIRCUMFERENCE;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Security Score</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gauge */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE / 2 + 20 }}>
            <svg
              width={GAUGE_SIZE}
              height={GAUGE_SIZE / 2 + 10}
              viewBox={`0 ${GAUGE_STROKE / 2} ${GAUGE_SIZE} ${GAUGE_SIZE / 2 + GAUGE_STROKE / 2}`}
              className="overflow-visible"
            >
              {/* Background arc */}
              <path
                d={`M ${GAUGE_STROKE / 2} ${GAUGE_CENTER} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_SIZE - GAUGE_STROKE / 2} ${GAUGE_CENTER}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={GAUGE_STROKE}
                className="text-surface"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d={`M ${GAUGE_STROKE / 2} ${GAUGE_CENTER} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_SIZE - GAUGE_STROKE / 2} ${GAUGE_CENTER}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={GAUGE_STROKE}
                className={cn(
                  overall >= 80 ? "text-green-500" : overall >= 60 ? "text-amber-500" : "text-red-500"
                )}
                strokeDasharray={GAUGE_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: reduced ? "none" : "stroke-dashoffset 1s ease-out" }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
              <motion.span
                initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.3 }}
                className={cn("text-4xl font-bold", scoreTextColor(overall))}
              >
                {overall}
              </motion.span>
              <span className="text-sm text-muted-foreground">
                {scoreLabel(overall)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-3">
          {(Object.keys(BREAKDOWN_LABELS) as (keyof SecurityScoreBreakdown)[]).map(
            (key, i) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {BREAKDOWN_LABELS[key]}
                  </span>
                  <span className={cn("font-medium", scoreTextColor(score[key]))}>
                    {score[key]}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <motion.div
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${score[key]}%` }}
                    transition={{
                      duration: reduced ? 0 : 0.8,
                      delay: reduced ? 0 : i * 0.1,
                      ease: "easeOut",
                    }}
                    className={cn("h-full rounded-full", scoreColor(score[key]))}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
