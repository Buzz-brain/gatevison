import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Monitor,
  Smartphone,
  Globe,
  FileText,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditEntry, Severity } from "../types";
import { SEVERITY_CONFIG, formatTimestamp, initials, getInitialsColor } from "../utils";

const MODULE_OPTIONS = [
  { value: "", label: "All Modules" },
  { value: "access_control", label: "Access Control" },
  { value: "recognition", label: "Recognition" },
  { value: "identity", label: "Identity" },
  { value: "audit", label: "Audit" },
  { value: "settings", label: "Settings" },
  { value: "users", label: "Users" },
  { value: "reports", label: "Reports" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "resolved", label: "Resolved" },
];

function resultBorderColor(result: string): string {
  switch (result) {
    case "success":
      return "border-l-success";
    case "failure":
      return "border-l-danger";
    case "warning":
      return "border-l-warning";
    default:
      return "border-l-muted-foreground";
  }
}

function resultDotColor(result: string): string {
  switch (result) {
    case "success":
      return "bg-success";
    case "failure":
      return "bg-danger";
    case "warning":
      return "bg-warning";
    default:
      return "bg-muted-foreground";
  }
}

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) {
    return <Smartphone className="h-3 w-3" />;
  }
  if (d.includes("tablet")) {
    return <Smartphone className="h-3 w-3" />;
  }
  return <Monitor className="h-3 w-3" />;
}

function AuditEvent({
  entry,
  reducedMotion,
  index,
}: {
  entry: AuditEntry;
  reducedMotion: boolean;
  index: number;
}) {
  const sevConfig = SEVERITY_CONFIG[entry.severity];
  const color = getInitialsColor(entry.user);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        "relative pl-6 border-l-2 pb-5 last:pb-0",
        resultBorderColor(entry.result)
      )}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ring-2 ring-background",
          resultDotColor(entry.result)
        )}
      />

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials(entry.user)}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Action line */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{entry.user}</span>
            <span className="text-sm text-muted-foreground">{entry.action}</span>
            <span className="text-sm font-medium">{entry.target}</span>
          </div>

          {/* Detail */}
          <p className="text-xs text-muted-foreground line-clamp-2">{entry.detail}</p>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTimestamp(entry.timestamp)}
            </span>

            <Badge variant="outline" size="sm" className="gap-1">
              <Globe className="h-2.5 w-2.5" />
              {entry.ip}
            </Badge>

            <Badge variant="neutral" size="sm" className="gap-1">
              <DeviceIcon device={entry.device} />
              {entry.device}
            </Badge>

            <Badge variant="info" size="sm" className="font-mono">
              {entry.requestId.slice(0, 8)}
            </Badge>

            <Badge variant="outline" size="sm">
              {entry.module}
            </Badge>

            <Badge variant={sevConfig.variant as "danger" | "warning" | "info" | "success"} size="sm">
              {sevConfig.label}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AuditLog({
  logs,
  search,
  onSearchChange,
  module: mod,
  onModuleChange,
  severity,
  onSeverityChange,
}: {
  logs: AuditEntry[];
  search: string;
  onSearchChange: (v: string) => void;
  module: string;
  onModuleChange: (v: string) => void;
  severity: string;
  onSeverityChange: (v: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    let result = logs;
    if (mod) {
      result = result.filter((l) => l.module === mod);
    }
    if (severity) {
      result = result.filter((l) => l.severity === severity);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.user.toLowerCase().includes(term) ||
          l.action.toLowerCase().includes(term) ||
          l.target.toLowerCase().includes(term) ||
          l.detail.toLowerCase().includes(term) ||
          l.ip.includes(term) ||
          l.requestId.toLowerCase().includes(term)
      );
    }
    return result;
  }, [logs, search, mod, severity]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-primary" />
              Audit Log
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{filtered.length} events</Badge>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search logs..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={MODULE_OPTIONS}
              value={mod}
              onChange={(e) => onModuleChange(e.target.value)}
              className="w-[160px]"
            />
            <Select
              options={SEVERITY_OPTIONS}
              value={severity}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Event timeline */}
      <Card>
        <CardContent className="p-5">
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-0.5 pr-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((entry, i) => (
                  <AuditEvent
                    key={entry.id}
                    entry={entry}
                    reducedMotion={reducedMotion}
                    index={i}
                  />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No audit entries found.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
