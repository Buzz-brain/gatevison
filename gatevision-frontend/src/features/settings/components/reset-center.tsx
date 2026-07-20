import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Settings,
  Layers,
  Trash2,
  AlertTriangle,
  Eye,
  CheckCircle,
  Loader2,
  X,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface ResetOption {
  id: string;
  title: string;
  description: string;
  severity: "warning" | "danger";
  icon: typeof Settings;
  affects: string[];
  color: string;
}

const RESET_OPTIONS: ResetOption[] = [
  {
    id: "module",
    title: "Reset Module",
    description: "Reset settings in the current module to defaults",
    severity: "warning",
    icon: Settings,
    affects: ["Current module settings", "Unsaved changes in this section"],
    color: "text-warning",
  },
  {
    id: "section",
    title: "Reset Section",
    description: "Reset all settings in the current category section",
    severity: "warning",
    icon: Layers,
    affects: ["All settings in current section", "Module-level customizations", "Section preferences"],
    color: "text-warning",
  },
  {
    id: "system",
    title: "Reset Entire System",
    description: "Reset all configuration to factory defaults",
    severity: "danger",
    icon: Trash2,
    affects: [
      "All custom configurations",
      "AI model settings",
      "Camera configurations",
      "Security policies",
      "Notification rules",
      "Appearance preferences",
    ],
    color: "text-danger",
  },
];

function ResetCenter() {
  const prefersReduced = useReducedMotion();
  const [selectedOption, setSelectedOption] = useState<ResetOption | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handlePreview = useCallback((option: ResetOption) => {
    setSelectedOption(option);
    setShowPreview(true);
  }, []);

  const handleReset = useCallback((option: ResetOption) => {
    setSelectedOption(option);
    setShowConfirm(true);
  }, []);

  const executeReset = useCallback(() => {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setShowConfirm(false);
      setResetComplete(true);
      setTimeout(() => setResetComplete(false), 3000);
    }, 1500);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="h-4 w-4 text-danger" />
          Reset Center
        </CardTitle>
        <CardDescription>
          Restore configuration settings to their default values
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {resetComplete && (
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-4"
            >
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Reset Complete</p>
                <p className="text-xs text-muted-foreground/60">Settings have been restored to defaults</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={prefersReduced ? undefined : staggerContainer}
          initial={prefersReduced ? undefined : "hidden"}
          animate="visible"
          className="space-y-3"
        >
          {RESET_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isDanger = option.severity === "danger";

            return (
              <motion.div
                key={option.id}
                variants={prefersReduced ? undefined : staggerItem}
                initial={prefersReduced ? undefined : "hidden"}
                animate="visible"
                whileHover={prefersReduced ? undefined : { x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    isDanger
                      ? "border-danger/20 bg-danger/5 hover:border-danger/30"
                      : "border-warning/20 bg-warning/5 hover:border-warning/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        isDanger ? "bg-danger/10" : "bg-warning/10",
                        option.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{option.title}</p>
                        <Badge variant={isDanger ? "danger" : "warning"} size="sm">
                          {isDanger ? "Critical" : "Moderate"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{option.description}</p>

                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-medium uppercase text-muted-foreground/50">
                          This will affect:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {option.affects.map((item) => (
                            <Badge key={item} variant="outline" size="sm" className="text-[10px]">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handlePreview(option)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant={isDanger ? "destructive" : "warning"}
                          size="xs"
                          onClick={() => handleReset(option)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset {option.id === "module" ? "Module" : option.id === "section" ? "Section" : "System"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>

      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Preview: ${selectedOption?.title ?? ""}`}
        description="Settings that will be affected by this reset"
      >
        {selectedOption && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/50 bg-surface/50 p-3">
              <p className="text-xs text-muted-foreground/60 mb-2">The following will be restored to defaults:</p>
              <div className="space-y-1.5">
                {selectedOption.affects.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs">
                    <RotateCcw className="h-3 w-3 text-muted-foreground/40" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={showConfirm}
        onClose={() => {
          if (!resetting) setShowConfirm(false);
        }}
        title="Confirm Reset"
        description={`Are you sure you want to ${selectedOption?.title.toLowerCase()}?`}
      >
        {selectedOption && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                selectedOption.severity === "danger"
                  ? "border-danger/20 bg-danger/5"
                  : "border-warning/20 bg-warning/5"
              )}
            >
              <ShieldAlert
                className={cn(
                  "h-5 w-5 shrink-0 mt-0.5",
                  selectedOption.severity === "danger" ? "text-danger" : "text-warning"
                )}
              />
              <div>
                <p className="text-sm font-medium">This action cannot be undone</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  All {selectedOption.affects.length} affected settings will be permanently restored to their default values.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant={selectedOption.severity === "danger" ? "destructive" : "warning"}
                size="sm"
                onClick={executeReset}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Confirm Reset
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Card>
  );
}

export { ResetCenter };
