import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Wifi, WifiOff, AlertTriangle, RefreshCw, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RESOLUTION_OPTIONS } from "../utils";
import type { CameraConfig } from "../types";

interface CameraSettingsProps {
  cameras: CameraConfig[];
  onUpdateCamera: (id: string, update: Partial<CameraConfig>) => void;
}

const ROTATION_OPTIONS = [
  { value: "0", label: "0 degrees" },
  { value: "90", label: "90 degrees" },
  { value: "180", label: "180 degrees" },
  { value: "270", label: "270 degrees" },
];

function getStatusInfo(status: CameraConfig["status"]): { label: string; variant: "success" | "warning" | "danger"; Icon: typeof Wifi } {
  switch (status) {
    case "online": return { label: "Online", variant: "success", Icon: Wifi };
    case "degraded": return { label: "Degraded", variant: "warning", Icon: AlertTriangle };
    case "offline": return { label: "Offline", variant: "danger", Icon: WifiOff };
  }
}

function SliderInput({ label, value, min, max, step, unit, onChange, color }: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; onChange: (v: number) => void; color?: string;
}) {
  const prefersReduced = useReducedMotion();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs font-mono text-muted-foreground">
          {value}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface"
        style={{
          background: `linear-gradient(to right, ${color ?? "var(--primary)"} ${pct}%, hsl(var(--surface)) ${pct}%)`,
        }}
      />
    </div>
  );
}

function CameraCard({ camera, onUpdate }: { camera: CameraConfig; onUpdate: (update: Partial<CameraConfig>) => void }) {
  const prefersReduced = useReducedMotion();
  const [testState, setTestState] = useState<"idle" | "testing" | "done">("idle");

  const { label: statusLabel, variant: statusVariant, Icon: StatusIcon } = getStatusInfo(camera.status);

  const handleTest = useCallback(() => {
    setTestState("testing");
    setTimeout(() => setTestState("done"), 1500);
    setTimeout(() => setTestState("idle"), 3000);
  }, []);

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerItem}
      layout
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{camera.name}</span>
              </CardTitle>
              <CardDescription className="truncate">{camera.location}</CardDescription>
            </div>
            <Badge variant={statusVariant} size="sm">
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Resolution</Label>
            <Select
              options={RESOLUTION_OPTIONS}
              value={camera.resolution}
              onChange={(e) => onUpdate({ resolution: e.target.value })}
            />
          </div>

          <SliderInput
            label="Frame Rate"
            value={camera.fps}
            min={5}
            max={60}
            step={1}
            unit="fps"
            onChange={(fps) => onUpdate({ fps })}
            color="#3b82f6"
          />

          <SliderInput
            label="Brightness"
            value={camera.brightness}
            min={0}
            max={100}
            step={1}
            onChange={(brightness) => onUpdate({ brightness })}
            color="#f59e0b"
          />

          <SliderInput
            label="Exposure"
            value={camera.exposure}
            min={-5}
            max={5}
            step={1}
            onChange={(exposure) => onUpdate({ exposure })}
            color="#8b5cf6"
          />

          <Separator />

          <div className="flex items-center justify-between">
            <Label>Auto Focus</Label>
            <Switch
              checked={camera.autoFocus}
              onCheckedChange={(autoFocus) => onUpdate({ autoFocus })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Mirror</Label>
            <Switch
              checked={camera.mirror}
              onCheckedChange={(mirror) => onUpdate({ mirror })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rotation</Label>
            <Select
              options={ROTATION_OPTIONS}
              value={String(camera.rotation)}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            />
          </div>

          <Separator />

          <SliderInput
            label="Retry Count"
            value={camera.retryCount}
            min={0}
            max={10}
            step={1}
            onChange={(retryCount) => onUpdate({ retryCount })}
            color="#10b981"
          />

          <SliderInput
            label="Connection Timeout"
            value={camera.connectionTimeout}
            min={1000}
            max={30000}
            step={500}
            unit="ms"
            onChange={(connectionTimeout) => onUpdate({ connectionTimeout })}
            color="#ef4444"
          />

          <Separator />

          <Button
            variant={testState === "done" ? "success" : "outline"}
            size="sm"
            className="w-full"
            onClick={handleTest}
            disabled={testState === "testing" || camera.status === "offline"}
          >
            {testState === "testing" && (
              <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
            )}
            {testState === "done" ? "Connection OK" : testState === "testing" ? "Testing..." : "Test Camera"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CameraSettings({ cameras, onUpdateCamera }: CameraSettingsProps) {
  const prefersReduced = useReducedMotion();
  const [filterTab, setFilterTab] = useState("all");

  const filteredCameras = filterTab === "all"
    ? cameras
    : cameras.filter((c) => c.status === filterTab);

  const counts = {
    all: cameras.length,
    online: cameras.filter((c) => c.status === "online").length,
    degraded: cameras.filter((c) => c.status === "degraded").length,
    offline: cameras.filter((c) => c.status === "offline").length,
  };

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      className="space-y-5"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Camera Configuration
          </CardTitle>
          <CardDescription>
            Configure individual camera settings, resolution, and connection parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filterTab} onValueChange={setFilterTab}>
            <TabsList>
              <TabsTrigger value="all" active={filterTab === "all"}>
                All <Badge variant="neutral" size="sm" className="ml-1.5">{counts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="online" active={filterTab === "online"}>
                Online <Badge variant="success" size="sm" className="ml-1.5">{counts.online}</Badge>
              </TabsTrigger>
              <TabsTrigger value="degraded" active={filterTab === "degraded"}>
                Degraded <Badge variant="warning" size="sm" className="ml-1.5">{counts.degraded}</Badge>
              </TabsTrigger>
              <TabsTrigger value="offline" active={filterTab === "offline"}>
                Offline <Badge variant="danger" size="sm" className="ml-1.5">{counts.offline}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <AnimatePresence mode="popLayout">
        <motion.div
          variants={prefersReduced ? undefined : staggerContainer}
          initial={prefersReduced ? undefined : "hidden"}
          animate="visible"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredCameras.map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              onUpdate={(update) => onUpdateCamera(cam.id, update)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredCameras.length === 0 && (
        <Card className="p-8 text-center">
          <Camera className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No cameras match this filter</p>
        </Card>
      )}
    </motion.div>
  );
}

export { CameraSettings };
