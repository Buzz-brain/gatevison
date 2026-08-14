import { motion } from "framer-motion";
import { Check, X, ArrowDown, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OCRResult } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface OCRPanelProps {
  ocr: OCRResult | null;
  animateChars?: boolean;
}

function OCRPanel({ ocr, animateChars = false }: OCRPanelProps) {
  const prefersReduced = useReducedMotion();
  if (!ocr) return null;

  const chars = ocr.raw.split("");

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Type className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">OCR Result</h3>
      </div>

      {/* Raw OCR */}
      <div className="space-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Raw Detection</p>
          <div className="flex flex-wrap gap-1">
            {chars.map((char, i) => (
              <motion.span
                key={i}
                initial={prefersReduced || !animateChars ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: char === "?" ? 0.4 : 1, y: 0 }}
                transition={{ delay: animateChars ? i * 0.1 : 0 }}
                className={cn(
                  "flex h-8 w-7 items-center justify-center rounded border border-border bg-surface font-mono text-sm",
                  char === "?" && "border-danger/40 text-danger/60",
                )}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 text-primary">
          <ArrowDown className="h-3 w-3" />
          <span className="text-[10px] uppercase tracking-wider">Validated</span>
        </div>

        {/* Cleaned plate */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Cleaned Plate</p>
          <div className="flex flex-wrap gap-1">
            {ocr.cleaned.split("").map((char, i) => (
              <span
                key={i}
                className="flex h-8 w-7 items-center justify-center rounded border border-success/30 bg-success/5 font-mono text-sm font-semibold text-success"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Validation */}
        <div className="flex items-center gap-2 pt-1">
          {ocr.isValid ? (
            <Badge variant="success" size="sm">
              <Check className="mr-1 h-3 w-3" />
              Valid
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              <X className="mr-1 h-3 w-3" />
              Invalid
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground/60">{ocr.format}</span>
          <span className="ml-auto text-xs font-mono text-primary">{ocr.confidence.toFixed(1)}%</span>
        </div>
      </div>
    </Card>
  );
}

export { OCRPanel };
