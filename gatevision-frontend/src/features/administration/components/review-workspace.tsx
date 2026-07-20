import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  ScanEye,
  Car,
  User,
  Shield,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ManualReview, ReviewDecision } from "../types";
import { REVIEW_CONFIG, timeAgo } from "../utils";

function ConfidenceBar({
  label,
  value,
  icon: Icon,
  delay,
  reducedMotion,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  delay: number;
  reducedMotion: boolean;
}) {
  const [animated, setAnimated] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate on mount
  if (timerRef.current === null) {
    timerRef.current = setTimeout(() => {
      setAnimated(value);
    }, 100 + delay);
  }

  const barColor =
    value >= 80 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-danger";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span
          className={cn(
            "text-xs font-bold",
            value >= 80 ? "text-success" : value >= 50 ? "text-warning" : "text-danger"
          )}
        >
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${animated}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: delay * 0.001 }}
        />
      </div>
    </div>
  );
}

function PlaceholderBox({
  label,
  gradient,
  children,
}: {
  label: string;
  gradient: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border overflow-hidden flex items-center justify-center",
        gradient
      )}
      style={{ minHeight: "160px" }}
    >
      <div className="text-center">
        <Camera className="h-8 w-8 mx-auto mb-2 text-white/60" />
        <p className="text-sm font-medium text-white/80">{label}</p>
      </div>
      {children}
    </div>
  );
}

export function ReviewWorkspace({
  review,
  onUpdate,
  onClose,
}: {
  review: ManualReview | null;
  onUpdate: (id: string, status: ReviewDecision) => void;
  onClose: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<ReviewDecision | null>(null);
  const reducedMotion = useReducedMotion();
  if (!review) return null;
  const r = review;

  function handleConfirm(action: ReviewDecision) {
    if (confirmAction === action) {
      onUpdate(r.id, action);
      setConfirmAction(null);
      onClose();
    } else {
      setConfirmAction(action);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Review Workspace</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Side-by-side comparison for plate{" "}
                      <span className="font-mono font-bold">{r.plate}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    status={r.status === "pending" ? "pending" : r.status === "approved" ? "success" : r.status === "rejected" ? "denied" : "warning"}
                    label={REVIEW_CONFIG[r.status].label}
                  />
                  <Button variant="ghost" size="icon-sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT - Captured */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-danger" />
                    <h3 className="text-sm font-semibold">Captured Frame</h3>
                  </div>
                  <PlaceholderBox
                    label={`Plate: ${r.plate}`}
                    gradient="bg-gradient-to-br from-danger/20 via-background to-warning/20"
                  >
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <Badge variant="danger" size="lg" className="font-mono text-base tracking-wider">
                        {r.plate}
                      </Badge>
                    </div>
                  </PlaceholderBox>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ScanEye className="h-3.5 w-3.5" />
                      <span className="font-medium">OCR Result</span>
                    </div>
                    <div className="rounded-lg bg-surface border border-border px-3 py-2 font-mono text-sm">
                      {r.plate}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-medium">Face Crop</span>
                    </div>
                    <PlaceholderBox
                      label="Face detected"
                      gradient="bg-gradient-to-br from-primary/20 via-background to-primary/5"
                    />
                  </div>
                </div>

                {/* RIGHT - Registered */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-success" />
                    <h3 className="text-sm font-semibold">Registered Vehicle</h3>
                  </div>
                  <PlaceholderBox
                    label={`${r.vehicle} - Registered`}
                    gradient="bg-gradient-to-br from-success/20 via-background to-primary/10"
                  />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Car className="h-3.5 w-3.5" />
                      <span className="font-medium">Driver Profile</span>
                    </div>
                    <div className="rounded-lg bg-surface border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Name</span>
                        <span className="text-sm font-medium">{r.driverName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Vehicle</span>
                        <span className="text-sm font-medium">{r.vehicle}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Plate</span>
                        <span className="text-sm font-mono font-medium">{r.plate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Detected</span>
                        <span className="text-xs">{timeAgo(r.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Breakdown */}
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <ScanEye className="h-4 w-4 text-primary" />
                  Confidence Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ConfidenceBar
                    label="OCR Confidence"
                    value={r.ocrConfidence}
                    icon={ScanEye}
                    delay={0}
                    reducedMotion={reducedMotion}
                  />
                  <ConfidenceBar
                    label="Face Match"
                    value={r.faceConfidence}
                    icon={User}
                    delay={100}
                    reducedMotion={reducedMotion}
                  />
                  <ConfidenceBar
                    label="Vehicle Match"
                    value={r.vehicleConfidence}
                    icon={Car}
                    delay={200}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>

              {/* Decision Panel */}
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold mb-3">Decision</h3>
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    size="lg"
                    className={cn(
                      "flex-1",
                      confirmAction === "approved" && "ring-2 ring-success ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => handleConfirm("approved")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {confirmAction === "approved" ? "Confirm Approve" : "Approve"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className={cn(
                      "flex-1",
                      confirmAction === "rejected" && "ring-2 ring-danger ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => handleConfirm("rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {confirmAction === "rejected" ? "Confirm Reject" : "Reject"}
                  </Button>
                  <Button
                    variant="warning"
                    size="lg"
                    className={cn(
                      "flex-1",
                      confirmAction === "escalated" && "ring-2 ring-warning ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => handleConfirm("escalated")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {confirmAction === "escalated" ? "Confirm Escalate" : "Escalate"}
                  </Button>
                </div>
                {confirmAction && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Click the same button again to confirm.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: "success" | "pending" | "warning" | "denied";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "success" && "bg-success/10 text-success",
        status === "pending" && "bg-warning/10 text-warning",
        status === "warning" && "bg-warning/10 text-warning",
        status === "denied" && "bg-danger/10 text-danger"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "success" && "bg-success",
          status === "pending" && "bg-warning",
          status === "warning" && "bg-warning",
          status === "denied" && "bg-danger"
        )}
      />
      {label}
    </span>
  );
}
