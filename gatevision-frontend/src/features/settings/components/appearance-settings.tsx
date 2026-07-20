import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Monitor,
  Sun,
  Moon,
  LayoutGrid,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/animations";
import { useSettings } from "../hooks/use-settings";
import {
  THEME_OPTIONS,
  DENSITY_OPTIONS,
  SIDEBAR_OPTIONS,
  CHART_OPTIONS,
  LAYOUT_OPTIONS,
} from "../utils";

const ACCENT_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#6366f1", label: "Indigo" },
];

function AppearanceSettings() {
  const { appearance, setAppearance } = useSettings();
  const reduced = useReducedMotion();
  const [customColor, setCustomColor] = useState(appearance.accentColor);

  const handleAccentChange = useCallback(
    (color: string) => {
      setAppearance({ ...appearance, accentColor: color });
      setCustomColor(color);
    },
    [appearance, setAppearance],
  );

  const handleCustomColor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomColor(val);
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        setAppearance({ ...appearance, accentColor: val });
      }
    },
    [appearance, setAppearance],
  );

  const ThemeIcon = appearance.theme === "dark" ? Moon : appearance.theme === "light" ? Sun : Monitor;

  return (
    <motion.div
      variants={reduced ? undefined : fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Appearance</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the look and feel of the dashboard
          </p>
        </div>

        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Theme */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" />
                  Theme
                </CardTitle>
                <CardDescription>
                  Choose your preferred color scheme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {THEME_OPTIONS.map((opt) => {
                    const active = appearance.theme === opt.value;
                    const Icon = opt.value === "dark" ? Moon : opt.value === "light" ? Sun : Monitor;
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={reduced ? undefined : { scale: 1.03 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        onClick={() => setAppearance({ ...appearance, theme: opt.value as "dark" | "light" | "system" })}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Accent Color */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accent Color</CardTitle>
                <CardDescription>
                  Select a primary accent color for the interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <motion.button
                      key={c.value}
                      whileHover={reduced ? undefined : { scale: 1.15 }}
                      whileTap={reduced ? undefined : { scale: 0.9 }}
                      onClick={() => handleAccentChange(c.value)}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        appearance.accentColor === c.value
                          ? "border-foreground ring-2 ring-foreground/20 scale-110"
                          : "border-transparent hover:border-foreground/30"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Label className="shrink-0">Custom</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={handleCustomColor}
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <Input
                      value={customColor}
                      onChange={handleCustomColor}
                      className="w-28 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Layout & Density */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  Layout & Density
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Layout Density</Label>
                  <Select
                    options={DENSITY_OPTIONS}
                    value={appearance.layoutDensity}
                    onChange={(e) =>
                      setAppearance({
                        ...appearance,
                        layoutDensity: e.target.value as "compact" | "comfortable" | "spacious",
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sidebar Style</Label>
                  <Select
                    options={SIDEBAR_OPTIONS}
                    value={appearance.sidebarStyle}
                    onChange={(e) =>
                      setAppearance({
                        ...appearance,
                        sidebarStyle: e.target.value as "default" | "compact" | "icons",
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chart Style</Label>
                  <Select
                    options={CHART_OPTIONS}
                    value={appearance.chartStyle}
                    onChange={(e) =>
                      setAppearance({
                        ...appearance,
                        chartStyle: e.target.value as "modern" | "classic" | "minimal",
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dashboard Layout</Label>
                  <Select
                    options={LAYOUT_OPTIONS}
                    value={appearance.dashboardLayout}
                    onChange={(e) =>
                      setAppearance({
                        ...appearance,
                        dashboardLayout: e.target.value as "grid" | "list" | "columns",
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Motion */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Motion
                </CardTitle>
                <CardDescription>
                  Control animations and motion preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable smooth transitions and motion effects
                    </p>
                  </div>
                  <Switch
                    checked={appearance.animations}
                    onCheckedChange={(val) => setAppearance({ ...appearance, animations: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduced Motion</Label>
                    <p className="text-xs text-muted-foreground">
                      Minimize animations for accessibility
                    </p>
                  </div>
                  <Switch
                    checked={appearance.reducedMotion}
                    onCheckedChange={(val) => setAppearance({ ...appearance, reducedMotion: val })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Preview */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4 text-primary" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  Preview of your current appearance settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${appearance.theme}-${appearance.accentColor}-${appearance.layoutDensity}`}
                    initial={reduced ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: reduced ? 0 : 0.3 }}
                    className={cn(
                      "rounded-lg border border-border overflow-hidden",
                      appearance.theme === "dark" ? "bg-[#0a0a0f]" : "bg-white",
                    )}
                  >
                    {/* Mini sidebar */}
                    <div className="flex h-40">
                      <div
                        className={cn(
                          "flex flex-col items-center gap-2 py-3 shrink-0",
                          appearance.sidebarStyle === "default"
                            ? "w-12"
                            : appearance.sidebarStyle === "compact"
                              ? "w-8"
                              : "w-8",
                          appearance.theme === "dark" ? "bg-[#12121a]" : "bg-gray-100",
                        )}
                      >
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-5 w-5 rounded"
                            style={{
                              backgroundColor:
                                i === 1 ? appearance.accentColor : appearance.theme === "dark" ? "#1e1e2e" : "#e5e7eb",
                            }}
                          />
                        ))}
                      </div>

                      {/* Mini content */}
                      <div className="flex-1 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-16 rounded"
                            style={{ backgroundColor: appearance.accentColor }}
                          />
                          <Badge
                            variant="outline"
                            size="sm"
                          >
                            {THEME_OPTIONS.find((t) => t.value === appearance.theme)?.label}
                          </Badge>
                        </div>
                        <div className="grid gap-1.5" style={{
                          gridTemplateColumns: appearance.dashboardLayout === "list" ? "1fr" : appearance.dashboardLayout === "columns" ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
                        }}>
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded border p-1.5",
                                appearance.theme === "dark"
                                  ? "border-gray-800 bg-[#16161e]"
                                  : "border-gray-200 bg-gray-50",
                              )}
                            >
                              <div
                                className="h-1 w-8 rounded mb-1"
                                style={{ backgroundColor: appearance.accentColor, opacity: 0.6 }}
                              />
                              <div className={cn("h-1 w-full rounded", appearance.theme === "dark" ? "bg-gray-800" : "bg-gray-200")} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Theme: <strong>{appearance.theme}</strong></span>
                  <span>Density: <strong>{appearance.layoutDensity}</strong></span>
                  <span>Sidebar: <strong>{appearance.sidebarStyle}</strong></span>
                  <span>Charts: <strong>{appearance.chartStyle}</strong></span>
                  <span>Layout: <strong>{appearance.dashboardLayout}</strong></span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { AppearanceSettings };
