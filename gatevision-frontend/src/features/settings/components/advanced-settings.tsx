import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Code,
  Bug,
  Globe,
  FlaskConical,
  Flag,
  AlertTriangle,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { useSettings } from "../hooks/use-settings";
import { ENV_OPTIONS } from "../utils";

const FEATURE_FLAG_LABELS: Record<string, string> = {
  advanced_analytics: "Advanced Analytics Dashboard",
  beta_alerts: "Beta Alert System",
  new_dashboard: "New Dashboard Layout",
};

function AdvancedSettings() {
  const { advanced, setAdvanced } = useSettings();
  const reduced = useReducedMotion();

  const [confirmCache, setConfirmCache] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [configReset, setConfigReset] = useState(false);

  const featureFlags = useMemo(
    () => Object.entries(advanced.featureFlags),
    [advanced.featureFlags],
  );

  const toggleFlag = useCallback(
    (key: string) => {
      const newFlags = { ...advanced.featureFlags };
      newFlags[key] = !newFlags[key];
      setAdvanced({ ...advanced, featureFlags: newFlags });
    },
    [advanced, setAdvanced],
  );

  function handleClearCache() {
    if (!confirmCache) {
      setConfirmCache(true);
      return;
    }
    setCacheCleared(true);
    setConfirmCache(false);
    setTimeout(() => setCacheCleared(false), 3000);
  }

  function handleResetConfig() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfigReset(true);
    setConfirmReset(false);
    setTimeout(() => setConfigReset(false), 3000);
  }

  return (
    <motion.div
      variants={reduced ? undefined : fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Advanced Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Developer tools, debug options, and dangerous operations
          </p>
        </div>

        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Developer Options */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="h-4 w-4 text-primary" />
                  Developer Options
                </CardTitle>
                <CardDescription>
                  Tools and features for development and debugging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Developer Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable developer tools and debug panels
                    </p>
                  </div>
                  <Switch
                    checked={advanced.developerMode}
                    onCheckedChange={(val) => setAdvanced({ ...advanced, developerMode: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Logging</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable verbose debug logging (may impact performance)
                    </p>
                  </div>
                  <Switch
                    checked={advanced.debugLogging}
                    onCheckedChange={(val) => setAdvanced({ ...advanced, debugLogging: val })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Toggles */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card className="border-warning/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Sensitive Options
                </CardTitle>
                <CardDescription>
                  These options affect system behavior and may expose internal data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>API Endpoints</Label>
                      <Badge variant="warning" size="sm">Sensitive</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Show internal API endpoints in the UI
                    </p>
                  </div>
                  <Switch
                    checked={advanced.apiEndpoints}
                    onCheckedChange={(val) => setAdvanced({ ...advanced, apiEndpoints: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>Experimental Features</Label>
                      <Badge variant="danger" size="sm">Risky</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enable features in active development (unstable)
                    </p>
                  </div>
                  <Switch
                    checked={advanced.experimentalFeatures}
                    onCheckedChange={(val) => setAdvanced({ ...advanced, experimentalFeatures: val })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Environment */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Environment
                </CardTitle>
                <CardDescription>
                  Select the runtime environment mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  options={ENV_OPTIONS}
                  value={advanced.environment}
                  onChange={(e) =>
                    setAdvanced({
                      ...advanced,
                      environment: e.target.value as "development" | "staging" | "production",
                    })
                  }
                />
                {advanced.environment === "production" && (
                  <p className="mt-2 text-xs text-success">
                    Running in production mode with optimized settings
                  </p>
                )}
                {advanced.environment === "development" && (
                  <p className="mt-2 text-xs text-warning">
                    Development mode enables additional debugging and hot-reload
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Flags */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flag className="h-4 w-4 text-primary" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Toggle individual features on or off
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureFlags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No feature flags configured</p>
                )}
                {featureFlags.map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{FEATURE_FLAG_LABELS[key] ?? key}</Label>
                      <p className="text-xs text-muted-foreground font-mono">{key}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleFlag(key)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card className="border-danger/40 bg-danger/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-danger">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that can affect system stability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 p-4">
                  <div>
                    <p className="text-sm font-medium">Reset Cache</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clear all cached data including recognition models and sessions
                    </p>
                  </div>
                  <AnimatePresence mode="wait">
                    {cacheCleared ? (
                      <motion.div
                        key="done"
                        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 text-sm text-success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Cache cleared
                      </motion.div>
                    ) : (
                      <motion.div key="btn" className="flex items-center gap-2">
                        {confirmCache && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmCache(false)}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleClearCache}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          {confirmCache ? "Confirm Clear" : "Clear Cache"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 p-4">
                  <div>
                    <p className="text-sm font-medium">Reset Configuration</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Restore all settings to factory defaults (cannot be undone)
                    </p>
                  </div>
                  <AnimatePresence mode="wait">
                    {configReset ? (
                      <motion.div
                        key="done"
                        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 text-sm text-success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Configuration reset
                      </motion.div>
                    ) : (
                      <motion.div key="btn" className="flex items-center gap-2">
                        {confirmReset && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmReset(false)}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleResetConfig}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          {confirmReset ? "Confirm Reset" : "Reset Config"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { AdvancedSettings };
