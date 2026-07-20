import { useMemo } from "react";
import { motion } from "framer-motion";
import { HardDrive, Trash2, Upload, FolderOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/animations";
import { useSettings } from "../hooks/use-settings";

function StorageSettings() {
  const { storage, setStorage } = useSettings();
  const reduced = useReducedMotion();

  const usagePercent = useMemo(
    () => Math.min(100, Math.round((storage.used / storage.total) * 100)),
    [storage.used, storage.total],
  );

  const usageColor = useMemo(() => {
    if (usagePercent >= 90) return "bg-danger";
    if (usagePercent >= 70) return "bg-warning";
    return "bg-primary";
  }, [usagePercent]);

  const estimatedRecovery = useMemo(() => {
    const baseBytes = storage.total * 0.02;
    const compressionBoost = storage.compression ? 1.5 : 1;
    const retentionFactor = Math.max(0.5, 1 - storage.imageRetention / 365);
    return Math.round(baseBytes * compressionBoost * retentionFactor);
  }, [storage.total, storage.compression, storage.imageRetention]);

  const thresholdWarning = usagePercent >= storage.storageThreshold;

  return (
    <motion.div
      variants={reduced ? undefined : fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Storage Configuration</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage storage limits, retention policies, and cleanup schedules
          </p>
        </div>

        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Storage Gauge */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-4 w-4 text-primary" />
                  Storage Usage
                </CardTitle>
                <CardDescription>
                  Current disk utilization across all data stores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold tabular-nums">{usagePercent}%</span>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatBytes(storage.used)} of {formatBytes(storage.total)}
                    </p>
                  </div>
                  {thresholdWarning && (
                    <Badge variant="warning" size="sm">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Above threshold
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Progress value={usagePercent} className="h-3" />
                  <div
                    className="absolute top-0 left-0 h-3 rounded-full pointer-events-none transition-all duration-500"
                    style={{ width: `${usagePercent}%` }}
                  >
                    <div className={cn("h-full rounded-full opacity-40", usageColor)} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="text-warning">Threshold: {storage.storageThreshold}%</span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload & Retention */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4 text-primary" />
                  Upload & Retention
                </CardTitle>
                <CardDescription>
                  Configure upload limits and image retention periods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Max Upload Size</Label>
                    <Badge variant="outline" size="sm">{storage.maxUploadSize} MB</Badge>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={500}
                    step={1}
                    value={storage.maxUploadSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setStorage({ ...storage, maxUploadSize: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 MB</span>
                    <span>500 MB</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Image Retention</Label>
                    <Badge variant="outline" size="sm">{storage.imageRetention} days</Badge>
                  </div>
                  <input
                    type="range"
                    min={7}
                    max={365}
                    step={1}
                    value={storage.imageRetention}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setStorage({ ...storage, imageRetention: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>7 days</span>
                    <span>365 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Compression & Cleanup */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compression & Cleanup</CardTitle>
                <CardDescription>
                  Optimize storage with automatic compression and cleanup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Image Compression</Label>
                    <p className="text-xs text-muted-foreground">
                      Compress stored images to reduce disk usage
                    </p>
                  </div>
                  <Switch
                    checked={storage.compression}
                    onCheckedChange={(val) => setStorage({ ...storage, compression: val })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Cleanup Frequency</Label>
                    <Badge variant="outline" size="sm">Every {storage.cleanupFrequency}h</Badge>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={168}
                    step={1}
                    value={storage.cleanupFrequency}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setStorage({ ...storage, cleanupFrequency: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 hour</span>
                    <span>168 hours (7 days)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Backup Folder & Threshold */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Paths & Thresholds
                </CardTitle>
                <CardDescription>
                  Configure backup paths and warning thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Backup Folder</Label>
                  <Input
                    value={storage.backupFolder}
                    onChange={(e) => setStorage({ ...storage, backupFolder: e.target.value })}
                    placeholder="/data/backups"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Storage Warning Threshold</Label>
                    <Badge
                      variant={thresholdWarning ? "warning" : "outline"}
                      size="sm"
                    >
                      {storage.storageThreshold}%
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={storage.storageThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setStorage({ ...storage, storageThreshold: val });
                    }}
                    className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50%</span>
                    <span>95%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cleanup Estimator */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Estimated Space Recovery</p>
                    <p className="text-2xl font-bold mt-1">{formatBytes(estimatedRecovery)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on current retention ({storage.imageRetention}d),{" "}
                      {storage.compression ? "compression enabled" : "compression disabled"},{" "}
                      and cleanup every {storage.cleanupFrequency}h
                    </p>
                  </div>
                  <Badge variant="success" size="sm">Next cleanup</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { StorageSettings };
