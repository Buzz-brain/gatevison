import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  X,
  Search,
} from "lucide-react"
import type { Alert, AlertSeverity } from "../types"
import { SEVERITY_CONFIG } from "../utils"

interface AlertCenterProps {
  alerts: Alert[]
  alertFilter: string
  setAlertFilter: (v: string) => void
  onAcknowledge: (id: string) => void
  onDismiss: (id: string) => void
}

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
  { key: "resolved", label: "Resolved" },
]

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  const color = SEVERITY_CONFIG[severity].hex
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4" style={{ color }} />
    case "warning":
      return <AlertCircle className="h-4 w-4" style={{ color }} />
    case "info":
      return <CheckCircle2 className="h-4 w-4" style={{ color }} />
    case "resolved":
      return <CheckCircle className="h-4 w-4" style={{ color }} />
  }
}

export function AlertCenter({
  alerts,
  alertFilter,
  setAlertFilter,
  onAcknowledge,
  onDismiss,
}: AlertCenterProps) {
  const [search, setSearch] = useState("")
  const shouldReduce = useReducedMotion()

  const filtered = alerts.filter((a) => {
    if (alertFilter !== "all" && a.severity !== alertFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.module.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setAlertFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              alertFilter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                {alerts.filter(
                  (a) =>
                    a.severity === f.key ||
                    (f.key === "resolved" && a.severity === "resolved")
                ).length}
              </span>
            )}
          </button>
        ))}

        <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">No alerts</p>
              <p className="text-xs mt-1">Everything looks good</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const cfg = SEVERITY_CONFIG[alert.severity]
              return (
                <motion.div
                  key={alert.id}
                  initial={shouldReduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduce ? undefined : { opacity: 0, x: 12 }}
                  layout
                >
                  <Card
                    className={cn(
                      "p-3 border-l-[3px] transition-colors",
                      !alert.acknowledged && "bg-muted/30"
                    )}
                    style={{ borderLeftColor: cfg.hex }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <SeverityIcon severity={alert.severity} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate">
                            {alert.title}
                          </span>
                          <Badge
                            variant={cfg.variant as any}
                            className="text-[10px] capitalize"
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {alert.module}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge
                              variant="neutral"
                              className="text-[10px] gap-1"
                            >
                              <CheckCircle className="h-2.5 w-2.5" />
                              Acked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {alert.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!alert.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Ack
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss(alert.id)}
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
