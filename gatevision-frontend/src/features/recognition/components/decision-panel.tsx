import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Lightbulb, ShieldCheck, LogIn, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { DecisionResult, GateOutcome } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface DecisionPanelProps {
  decision: DecisionResult | null;
  mode?: "entry" | "exit";
  gate?: GateOutcome | null;
}

function DecisionPanel({ decision, mode = "entry", gate = null }: DecisionPanelProps) {
  if (!decision) return null;
  const prefersReduced = useReducedMotion();

  const gateRejected = decision.decision === "granted" && gate !== null && gate.success === false;
  const gateDetail = gate?.error ?? gate?.message ?? "";
  const alreadyInside = gateRejected && /already inside|already in\b/i.test(gateDetail);
  const alreadyOutside = gateRejected && /already outside|already out\b/i.test(gateDetail);

  const grantedTitle =
    gate?.success === true
      ? gate.action === "EXIT" ? "SESSION VERIFIED" : "ENTRY SESSION CREATED"
      : mode === "exit" ? "SESSION VERIFIED" : "ENTRY SESSION CREATED";
  const reviewTitle = mode === "exit" ? "MATCH NEEDS REVIEW" : "MANUAL REVIEW";

  const title = gateRejected
    ? mode === "exit" ? "SESSION NOT CLOSED" : "ENTRY BLOCKED"
    : decision.decision === "granted"
      ? grantedTitle
      : decision.decision === "denied"
        ? "ACCESS DENIED"
        : reviewTitle;

  const subtitle = gateRejected
    ? "Gate workflow rejected the session action"
    : decision.decision === "granted"
      ? gate?.success === true && gate.action === "EXIT"
        ? "Active session matched and closed"
        : gate?.success === true
          ? "Vehicle session opened"
          : mode === "exit"
            ? "Active session matched and closed"
            : "Vehicle session opened"
      : decision.decision === "denied"
        ? "Entry blocked"
        : mode === "exit"
          ? "No reliable session match"
          : "Requires identity confirmation";

  const decisionConfig = {
    granted: {
      icon: mode === "exit" ? LogOut : LogIn,
      color: "text-success",
      bg: "bg-success/5",
      border: "border-success/30",
      glow: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    },
    denied: {
      icon: XCircle,
      color: "text-danger",
      bg: "bg-danger/5",
      border: "border-danger/30",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    },
    manual_review: {
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/5",
      border: "border-warning/30",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
  };

  const config = decisionConfig[gateRejected ? "denied" : decision.decision];
  const Icon = config.icon;
  const effectiveReason = gateRejected ? (gate?.error ?? gate?.message ?? decision.reason) : decision.reason;
  const effectiveAction = gateRejected
    ? alreadyInside
      ? "Switch to Exit to close the open session"
      : alreadyOutside
        ? "Switch to Entry to open a session"
        : mode === "exit"
          ? "Do not close session - already inactive"
          : "Do not allow through - duplicate entry"
    : decision.recommendedAction;

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "rounded-xl border p-5",
        config.bg,
        config.border,
        config.glow,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={prefersReduced ? undefined : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
            className={cn("flex h-12 w-12 items-center justify-center rounded-full", config.bg)}
          >
            <Icon className={cn("h-6 w-6", config.color)} />
          </motion.div>
          <div>
            <p className={cn("text-lg font-bold tracking-wider", config.color)}>{title}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {mode === "exit" ? "Session Match Engine" : "Session Engine"} — {subtitle}
            </p>
          </div>
        </div>
        <ConfidenceGauge value={decision.confidence} size={70} strokeWidth={7} label="Confidence" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-surface p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1">Reason</p>
          <p className="text-sm">{effectiveReason}</p>
        </div>
        {gate && !gateRejected && (
          <div className="rounded-lg border border-border/60 bg-surface/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Gate Workflow
            </p>
            <p className="text-sm font-medium">
              {gate.action || "GATE"} · {gate.success ? "confirmed" : "failed"}
              {gate.sessionId ? ` · session ${gate.sessionId.slice(0, 8)}` : ""}
              {gate.transactionId ? ` · txn ${gate.transactionId.slice(0, 8)}` : ""}
            </p>
            {gate.message && (
              <p className="mt-1 text-xs text-muted-foreground/80">{gate.error ?? gate.message}</p>
            )}
          </div>
        )}
        <div className="rounded-lg bg-surface p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Explanation
          </p>
          <p className="text-xs text-muted-foreground/80">{decision.explanation}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
          <ShieldCheck className={cn("h-4 w-4 shrink-0", config.color)} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Recommended Action</p>
            <p className="text-sm font-medium">{effectiveAction}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { DecisionPanel };
