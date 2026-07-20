import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  Trash2,
  RefreshCw,
  HardDrive,
  Database,
  FileText,
  Archive,
  CheckCircle2,
} from "lucide-react"
import type { CleanupInfo } from "../types"

interface CleanupCenterProps {
  cleanup: CleanupInfo
}

interface CleanupItem {
  key: string
  label: string
  value: string
  bytes: number
  icon: React.ReactNode
}

export function CleanupCenter({ cleanup }: CleanupCenterProps) {
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleaned, setCleaned] = useState(false)
  const shouldReduce = useReducedMotion()

  const items: CleanupItem[] = [
    {
      key: "orphanImages",
      label: "Orphan Images",
      value: cleanup.orphanImages.toString(),
      bytes: cleanup.orphanImages * 2 * 1024 * 1024,
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      key: "oldLogsMb",
      label: "Old Logs",
      value: `${cleanup.oldLogsMb} MB`,
      bytes: cleanup.oldLogsMb * 1024 * 1024,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "tempFiles",
      label: "Temp Files",
      value: cleanup.tempFiles.toString(),
      bytes: cleanup.tempFiles * 0.5 * 1024 * 1024,
      icon: <Archive className="h-4 w-4" />,
    },
    {
      key: "unusedModels",
      label: "Unused Models",
      value: cleanup.unusedModels.toString(),
      bytes: cleanup.unusedModels * 50 * 1024 * 1024,
      icon: <Database className="h-4 w-4" />,
    },
    {
      key: "cacheMb",
      label: "Cache",
      value: `${cleanup.cacheMb} MB`,
      bytes: cleanup.cacheMb * 1024 * 1024,
      icon: <RefreshCw className="h-4 w-4" />,
    },
  ]

  const totalBytes = items.reduce((sum, i) => sum + i.bytes, 0)

  const handleClean = () => {
    setIsCleaning(true)
    setCleaned(false)
    setTimeout(() => {
      setIsCleaning(false)
      setCleaned(true)
    }, 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Total Estimated Recovery
        </p>
        <p className="text-3xl font-bold text-primary">
          {cleanup.estimatedRecoveryGb.toFixed(2)} GB
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {items.length} categories of recoverable space
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => {
          const pct = totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0
          return (
            <motion.div
              key={item.key}
              initial={shouldReduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduce ? 0 : idx * 0.06 }}
            >
              <Card className="p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-muted-foreground">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <p className="text-xl font-bold">{item.value}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Share of total</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {}}
          className="gap-1.5"
        >
          <FileText className="h-4 w-4" />
          Cleanup Preview
        </Button>
        <Button
          onClick={handleClean}
          disabled={isCleaning}
          className="gap-1.5"
        >
          {isCleaning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {isCleaning ? "Cleaning..." : "Cleanup Now"}
        </Button>
      </div>

      <AnimatePresence>
        {isCleaning && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduce ? undefined : { opacity: 0 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Cleaning up resources...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Removing orphan files, old logs, and cache
                  </p>
                </div>
              </div>
              <Progress value={65} className="h-2 mt-3" />
            </Card>
          </motion.div>
        )}
        {cleaned && !isCleaning && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduce ? undefined : { opacity: 0 }}
          >
            <Card className="p-4 border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Cleanup complete</p>
                  <p className="text-xs text-muted-foreground">
                    Recovered approximately {cleanup.estimatedRecoveryGb.toFixed(2)} GB
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
