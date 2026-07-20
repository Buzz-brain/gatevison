import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  RotateCcw,
  GitCompare,
  ChevronDown,
  ChevronUp,
  User,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { formatTimestamp, formatDate, timeAgo } from "../utils";
import type { ConfigHistoryEntry, SettingCategory } from "../types";

interface ConfigurationHistoryProps {
  entries: ConfigHistoryEntry[];
}

const CATEGORY_COLORS: Record<SettingCategory, "default" | "success" | "warning" | "danger" | "info" | "neutral"> = {
  general: "neutral",
  "ai-models": "info",
  recognition: "default",
  "decision-engine": "warning",
  cameras: "info",
  "gate-control": "warning",
  security: "danger",
  notifications: "default",
  storage: "success",
  backup: "success",
  monitoring: "neutral",
  appearance: "info",
  advanced: "danger",
  about: "neutral",
};

const CATEGORY_LABELS: Record<SettingCategory, string> = {
  general: "General",
  "ai-models": "AI Models",
  recognition: "Recognition",
  "decision-engine": "Decision Engine",
  cameras: "Cameras",
  "gate-control": "Gate Control",
  security: "Security",
  notifications: "Notifications",
  storage: "Storage",
  backup: "Backup",
  monitoring: "Monitoring",
  appearance: "Appearance",
  advanced: "Advanced",
  about: "About",
};

function HistoryEntry({ entry, prefersReduced }: { entry: ConfigHistoryEntry; prefersReduced: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [restored, setRestored] = useState(false);

  const handleRestore = () => {
    setRestored(true);
    setTimeout(() => setRestored(false), 2000);
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
      className="relative"
    >
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="relative flex gap-4 pb-6">
        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-elevated">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={CATEGORY_COLORS[entry.category]} size="sm">
                  {CATEGORY_LABELS[entry.category]}
                </Badge>
                <span className="text-xs text-muted-foreground/60">{timeAgo(entry.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{entry.setting}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">{entry.description}</p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} details
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={prefersReduced ? undefined : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={prefersReduced ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2 rounded-lg border border-border/50 bg-surface/50 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/60">Old:</span>
                    <code className="rounded bg-danger/10 px-1.5 py-0.5 font-mono text-danger">
                      {formatValue(entry.oldValue)}
                    </code>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-muted-foreground/60">New:</span>
                    <code className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-success">
                      {formatValue(entry.newValue)}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <User className="h-3 w-3" />
                    <span>{entry.changedBy}</span>
                    <span className="text-muted-foreground/30">|</span>
                    <span>{formatDate(entry.timestamp)} at {formatTimestamp(entry.timestamp)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" size="xs" onClick={() => {}}>
              <GitCompare className="h-3 w-3 mr-1" />
              Compare
            </Button>
            <Button
              variant={restored ? "success" : "ghost"}
              size="xs"
              onClick={handleRestore}
              disabled={restored}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {restored ? "Restored" : "Restore"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConfigurationHistory({ entries }: ConfigurationHistoryProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Configuration History
          <Badge variant="outline" size="sm" className="ml-auto">
            {entries.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground/60">No configuration changes recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <motion.div
              variants={prefersReduced ? undefined : staggerContainer}
              initial={prefersReduced ? undefined : "hidden"}
              animate="visible"
            >
              {entries.map((entry) => (
                <HistoryEntry
                  key={entry.id}
                  entry={entry}
                  prefersReduced={prefersReduced}
                />
              ))}
            </motion.div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export { ConfigurationHistory };
