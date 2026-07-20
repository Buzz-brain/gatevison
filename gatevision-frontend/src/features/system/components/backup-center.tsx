import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  Clock,
  RefreshCw,
  Archive,
  HardDrive,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import type { BackupInfo } from "../types"
import { STATUS_CONFIG, formatBytes } from "../utils"

interface BackupCenterProps {
  backups: BackupInfo[]
}

const STATUS_VARIANT: Record<string, "default" | "warning" | "danger" | "neutral"> = {
  success: "default",
  running: "warning",
  failed: "danger",
  scheduled: "neutral",
}

function StatusIcon({ status }: { status: BackupInfo["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-3.5 w-3.5" />
    case "running":
      return <RefreshCw className="h-3.5 w-3.5 animate-spin" />
    case "failed":
      return <AlertTriangle className="h-3.5 w-3.5" />
    case "scheduled":
      return <Clock className="h-3.5 w-3.5" />
  }
}

export function BackupCenter({ backups }: BackupCenterProps) {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [isRestoring, setIsRestoring] = useState(false)

  const sorted = [...backups].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )
  const lastCompleted = sorted.find((b) => b.status === "success")
  const nextScheduled = sorted.find((b) => b.status === "scheduled")
  const running = sorted.find((b) => b.status === "running")

  const handleManualBackup = () => {
    setIsBackingUp(true)
    setBackupProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setTimeout(() => setIsBackingUp(false), 800)
      }
      setBackupProgress(p)
    }, 400)
  }

  const handleRestore = () => {
    setIsRestoring(true)
    setTimeout(() => setIsRestoring(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <HardDrive className="h-3.5 w-3.5" />
            Last Backup
          </div>
          {lastCompleted ? (
            <>
              <p className="text-lg font-bold">{formatBytes(lastCompleted.sizeGb * 1024 * 1024 * 1024)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lastCompleted.type} &middot;{" "}
                {lastCompleted.completedAt || lastCompleted.startedAt}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No backups yet</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Clock className="h-3.5 w-3.5" />
            Next Scheduled
          </div>
          {nextScheduled ? (
            <>
              <p className="text-lg font-bold">{nextScheduled.startedAt}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {nextScheduled.type} backup
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">None scheduled</p>
          )}
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleManualBackup}
          disabled={isBackingUp || !!running}
          className="gap-1.5"
        >
          <Database className="h-4 w-4" />
          {isBackingUp ? "Backing Up..." : "Manual Backup"}
        </Button>
        <Button
          variant="outline"
          onClick={handleRestore}
          disabled={isRestoring || !lastCompleted}
          className="gap-1.5"
        >
          <Archive className="h-4 w-4" />
          {isRestoring ? "Restoring..." : "Restore"}
        </Button>
      </div>

      {isBackingUp && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium">Backup in progress...</span>
            <span className="text-muted-foreground">
              {Math.round(backupProgress)}%
            </span>
          </div>
          <Progress value={backupProgress} className="h-2" />
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40">
          <span className="text-sm font-semibold">Backup History</span>
        </div>
        <div className="divide-y divide-border/30">
          {sorted.map((backup) => {
            const backupLabel: Record<string, string> = { success: "Success", running: "Running", failed: "Failed", scheduled: "Scheduled" };
            return (
              <div
                key={backup.id}
                className="flex items-center gap-3 px-4 py-2.5 text-xs"
              >
                <StatusIcon status={backup.status} />
                <span className="font-medium min-w-[80px] capitalize">
                  {backup.type}
                </span>
                <span className="text-muted-foreground min-w-[70px]">
                  {formatBytes(backup.sizeGb * 1024 * 1024 * 1024)}
                </span>
                <Badge
                  variant={STATUS_VARIANT[backup.status] || "neutral"}
                  className="text-[10px] capitalize min-w-[70px] justify-center"
                >
                  {backupLabel[backup.status]}
                </Badge>
                <span className="text-muted-foreground/70 flex-1 text-right">
                  {backup.startedAt}
                </span>
                <span className="text-muted-foreground/70 min-w-[80px] text-right">
                  {backup.completedAt || "--"}
                </span>
                {backup.status === "running" && (
                  <div className="w-20 shrink-0">
                    <Progress value={backup.progress} className="h-1.5" />
                  </div>
                )}
              </div>
            )
          })}
          {sorted.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No backup history
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
