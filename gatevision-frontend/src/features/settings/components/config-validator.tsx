import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { ConfigValidation } from "../types";

interface ConfigValidatorProps {
  validations: ConfigValidation[];
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: "text-danger",
    bgColor: "bg-danger/5",
    borderColor: "border-danger/20",
    badgeVariant: "danger" as const,
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/5",
    borderColor: "border-warning/20",
    badgeVariant: "warning" as const,
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-info",
    bgColor: "bg-info/5",
    borderColor: "border-info/20",
    badgeVariant: "info" as const,
    label: "Info",
  },
};

function ValidationItem({
  validation,
  prefersReduced,
}: {
  validation: ConfigValidation;
  prefersReduced: boolean;
}) {
  const [fixed, setFixed] = useState(false);
  const config = SEVERITY_CONFIG[validation.severity];
  const Icon = config.icon;

  const handleFix = () => {
    setFixed(true);
    setTimeout(() => setFixed(false), 3000);
  };

  const formatValue = (v: string | number | boolean) => {
    if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
    return String(v);
  };

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerItem}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
    >
      <div
        className={cn(
          "rounded-xl border p-4 transition-colors",
          config.bgColor,
          config.borderColor,
          fixed && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated", config.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={config.badgeVariant} size="sm">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground/60">{validation.category}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{validation.setting}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">{validation.message}</p>

            <div className="mt-2 rounded-md bg-surface/50 px-3 py-2">
              <p className="text-xs text-muted-foreground/60">
                <span className="font-medium">Current value:</span>{" "}
                <code className="font-mono">{formatValue(validation.currentValue)}</code>
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                <span className="font-medium">Recommendation:</span>{" "}
                {validation.recommendation}
              </p>
            </div>

            <div className="mt-3">
              <Button
                variant={fixed ? "success" : "outline"}
                size="xs"
                onClick={handleFix}
                disabled={fixed}
              >
                {fixed ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Applied
                  </>
                ) : (
                  <>
                    <Wrench className="h-3 w-3 mr-1" />
                    Fix
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConfigValidator({ validations }: ConfigValidatorProps) {
  const prefersReduced = useReducedMotion();
  const errors = validations.filter((v) => v.severity === "error");
  const warnings = validations.filter((v) => v.severity === "warning");
  const infos = validations.filter((v) => v.severity === "info");

  const sortedValidations = [...errors, ...warnings, ...infos];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-warning" />
          Configuration Validation
          {validations.length > 0 ? (
            <Badge variant="warning" size="sm" className="ml-auto">
              {validations.length} issue{validations.length !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="success" size="sm" className="ml-auto">
              All clear
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validations.length === 0 ? (
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <ShieldCheck className="h-7 w-7 text-success" />
            </div>
            <p className="mt-4 text-sm font-medium">No Issues Found</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              All configuration settings are within recommended ranges
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-danger" /> {errors.length} error{errors.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning" /> {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-info" /> {infos.length} info
              </span>
            </div>
            <ScrollArea className="max-h-[500px]">
              <motion.div
                variants={prefersReduced ? undefined : staggerContainer}
                initial={prefersReduced ? undefined : "hidden"}
                animate="visible"
                className="space-y-3"
              >
                {sortedValidations.map((v) => (
                  <ValidationItem key={v.id} validation={v} prefersReduced={prefersReduced} />
                ))}
              </motion.div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ConfigValidator };
