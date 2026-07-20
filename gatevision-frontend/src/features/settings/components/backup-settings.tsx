import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Download,
  Upload,
  Clock,
  Shield,
  HardDrive,
  Play,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/animations";
import { useSettings } from "../hooks/use-settings";
import { BACKUP_FREQ_OPTIONS, timeAgo } from "../utils";

function BackupSettings() {
  const { backup, setBackup } = useSettings();
  const reduced = useReducedMotion();
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupDone, setBackupDone] = useState(false);
  const [restoreDone, setRestoreDone] = useState(false);

  const estimatedBackupSize = useMemo(() => {
    const base = 1.2 * 1024 * 1024 * 1024 * 1024;
    const compressionFactor = backup.compression ? 0.6 : 1;
    return Math.round(base * compressionFactor);
  }, [backup.compression]);

  const previewItems = useMemo(
    () => [
      { label: "Recognition Models", size: "2.1 GB", count: 5 },
      { label: "Captured Images", size: "890 GB", count: 1240000 },
      { label: "Access Logs", size: "156 GB", count: 4800000 },
      { label: "Configuration", size: "12 MB", count: 1 },
      { label: "Database Snapshots", size: "340 GB", count: 30 },
    ],
    [],
  );

  function handleBackupNow() {
    setBacking(true);
    setBackupDone(false);
    setTimeout(() => {
      setBacking(false);
      setBackupDone(true);
      setBackup({ ...backup, lastBackup: new Date().toISOString(), size: estimatedBackupSize });
      setTimeout(() => setBackupDone(false), 3000);
    }, 2500);
  }

  function handleRestore() {
    setRestoring(true);
    setRestoreDone(false);
    setTimeout(() => {
      setRestoring(false);
      setRestoreDone(true);
      setBackup({ ...backup, lastRestore: new Date().toISOString() });
      setTimeout(() => setRestoreDone(false), 3000);
    }, 3000);
  }

  return (
    <motion.div
      variants={reduced ? undefined : fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Backup & Recovery</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automatic backups, retention, and disaster recovery
          </p>
        </div>

        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Backup Configuration */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  Backup Configuration
                </CardTitle>
                <CardDescription>
                  Schedule and configure automatic backup jobs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backup</Label>
                    <p className="text-xs text-muted-foreground">
                      Run backups on a scheduled basis
                    </p>
                  </div>
                  <Switch
                    checked={backup.automatic}
                    onCheckedChange={(val) => setBackup({ ...backup, automatic: val })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    options={BACKUP_FREQ_OPTIONS}
                    value={backup.frequency}
                    onChange={(e) => setBackup({ ...backup, frequency: e.target.value })}
                    disabled={!backup.automatic}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    value={backup.destination}
                    onChange={(e) => setBackup({ ...backup, destination: e.target.value })}
                    placeholder="s3://bucket-name or /local/path"
                    disabled={!backup.automatic}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Retention Period</Label>
                    <Badge variant="outline" size="sm">{backup.retention} days</Badge>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={365}
                    step={1}
                    value={backup.retention}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setBackup({ ...backup, retention: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                    disabled={!backup.automatic}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 day</span>
                    <span>365 days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compression</Label>
                    <p className="text-xs text-muted-foreground">
                      Compress backup archives to save space
                    </p>
                  </div>
                  <Switch
                    checked={backup.compression}
                    onCheckedChange={(val) => setBackup({ ...backup, compression: val })}
                    disabled={!backup.automatic}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encryption</Label>
                    <p className="text-xs text-muted-foreground">
                      Encrypt backup files at rest with AES-256
                    </p>
                  </div>
                  <Switch
                    checked={backup.encryption}
                    onCheckedChange={(val) => setBackup({ ...backup, encryption: val })}
                    disabled={!backup.automatic}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status & Actions */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last Backup
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {backup.lastBackup ? timeAgo(backup.lastBackup) : "Never"}
                    </p>
                    {backup.lastBackup && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {backup.lastBackup}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last Restore
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {backup.lastRestore ? timeAgo(backup.lastRestore) : "Never"}
                    </p>
                    {backup.lastRestore && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {backup.lastRestore}
                      </p>
                    )}
                  </div>
                </div>

                {backup.size != null && (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HardDrive className="h-3 w-3" />
                      Backup Size
                    </div>
                    <span className="text-sm font-medium">{formatBytes(backup.size)}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="default"
                    onClick={handleBackupNow}
                    disabled={backing}
                    className="flex-1"
                  >
                    {backing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Backing up...
                      </>
                    ) : backupDone ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Done
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Backup Now
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRestore}
                    disabled={restoring}
                    className="flex-1"
                  >
                    {restoring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : restoreDone ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Restored
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Restore
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Backup Preview */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card className="border-info/30 bg-info/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-info" />
                  Backup Preview
                </CardTitle>
                <CardDescription>
                  Estimated contents of the next backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {previewItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.count.toLocaleString()} items</span>
                      <Badge variant="neutral" size="sm">{item.size}</Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated Total</span>
                    <span className="text-sm font-bold">{formatBytes(estimatedBackupSize)}</span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round((estimatedBackupSize / (backup.size ?? 1.2 * 1024 * 1024 * 1024 * 1024)) * 100))}
                    className="h-1.5 mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { BackupSettings };
