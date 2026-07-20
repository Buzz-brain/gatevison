import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  Terminal,
  Search,
  Download,
  Copy,
  Pause,
  Play,
  Filter,
} from "lucide-react"
import type { LogEntry } from "../types"
import { logLevelColor, formatLogTime } from "../utils"

interface LogViewerProps {
  logs: LogEntry[]
  logFollow: boolean
  setLogFollow: (v: boolean) => void
  logLevel: string
  setLogLevel: (v: string) => void
  logSearch: string
  setLogSearch: (v: string) => void
}

const LEVELS = ["all", "info", "warn", "error", "debug"] as const

export function LogViewer({
  logs,
  logFollow,
  setLogFollow,
  logLevel,
  setLogLevel,
  logSearch,
  setLogSearch,
}: LogViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const shouldReduce = useReducedMotion()

  const filtered = logs.filter((log) => {
    if (logLevel !== "all" && log.level !== logLevel) return false
    if (logSearch) {
      const q = logSearch.toLowerCase()
      return (
        log.message.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        (log.requestId && log.requestId.toLowerCase().includes(q))
      )
    }
    return true
  })

  useEffect(() => {
    if (logFollow && endRef.current) {
      endRef.current.scrollIntoView({ behavior: shouldReduce ? "auto" : "smooth" })
    }
  }, [filtered.length, logFollow, shouldReduce])

  const handleCopy = (log: LogEntry) => {
    const text = `[${formatLogTime(log.timestamp)}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}${log.requestId ? ` (${log.requestId})` : ""}`
    navigator.clipboard.writeText(text)
    setCopiedId(log.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleExport = () => {
    const lines = filtered.map(
      (l) => `${l.timestamp}\t${l.level}\t${l.module}\t${l.message}`
    )
    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "logs-export.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 flex-wrap p-3 border-b border-border/50">
        <div className="flex items-center gap-1">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLogLevel(lvl)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                logLevel === lvl
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>

        <Button
          variant={logFollow ? "default" : "outline"}
          size="sm"
          onClick={() => setLogFollow(!logFollow)}
          className="h-8 gap-1.5"
        >
          {logFollow ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Follow
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-8 gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Terminal className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No logs match your filters</p>
            <p className="text-xs mt-1">Try adjusting the level or search query</p>
          </div>
        ) : (
          <div className="font-mono text-xs">
            {filtered.map((log) => {
              const color = logLevelColor(log.level)
              return (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2 px-3 py-1.5 border-b border-border/30 hover:bg-muted/30 group",
                    log.level === "error" && "bg-red-500/5"
                  )}
                >
                  <div
                    className="mt-1 h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground w-[80px] shrink-0">
                    {formatLogTime(log.timestamp)}
                  </span>
                  <span
                    className="w-[48px] shrink-0 font-semibold uppercase"
                    style={{ color }}
                  >
                    {log.level}
                  </span>
                  <span className="text-primary/80 w-[120px] shrink-0 truncate">
                    {log.module}
                  </span>
                  <span className="flex-1 break-all">{log.message}</span>
                  {log.requestId && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {log.requestId.slice(0, 8)}
                    </Badge>
                  )}
                  <button
                    onClick={() => handleCopy(log)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
