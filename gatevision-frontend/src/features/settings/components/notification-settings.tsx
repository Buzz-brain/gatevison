import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Mail, MessageSquare, Smartphone, Inbox, Webhook, Clock, Send, TestTube, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { NotificationSettings } from "../types";

interface NotificationSettingsProps {
  notifications: NotificationSettings;
  onSetNotifications: (config: NotificationSettings) => void;
}

const CHANNEL_CONFIG = [
  { key: "email" as const, label: "Email", icon: Mail, color: "text-blue-400", bgColor: "bg-blue-500" },
  { key: "sms" as const, label: "SMS", icon: MessageSquare, color: "text-emerald-400", bgColor: "bg-emerald-500" },
  { key: "push" as const, label: "Push Notifications", icon: Smartphone, color: "text-violet-400", bgColor: "bg-violet-500" },
  { key: "inApp" as const, label: "In-App", icon: Inbox, color: "text-amber-400", bgColor: "bg-amber-500" },
  { key: "webhook" as const, label: "Webhook", icon: Webhook, color: "text-red-400", bgColor: "bg-red-500" },
] as const;

const PRIORITY_CONFIG: Record<string, { variant: "danger" | "warning" | "info" | "neutral"; label: string }> = {
  critical: { variant: "danger", label: "Critical" },
  high: { variant: "warning", label: "High" },
  medium: { variant: "info", label: "Medium" },
  low: { variant: "neutral", label: "Low" },
};

function getPriorityInfo(priority: string): { variant: "danger" | "warning" | "info" | "neutral"; label: string } {
  switch (priority) {
    case "critical": return { variant: "danger", label: "Critical" };
    case "high": return { variant: "warning", label: "High" };
    case "medium": return { variant: "info", label: "Medium" };
    default: return { variant: "neutral", label: "Low" };
  }
}

function ChannelCard({ channelKey, config, channel, onToggle, index }: {
  channelKey: string;
  config: typeof CHANNEL_CONFIG[number];
  channel: NotificationSettings["email"];
  onToggle: (enabled: boolean) => void;
  index: number;
}) {
  const prefersReduced = useReducedMotion();
  const templateEntries = Object.entries(channel.templates);
  const isWebhook = channelKey === "webhook";
  const hasProviders = channel.providers.length > 0;

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerItem}
      layout
    >
      <Card className={cn("h-full transition-colors", channel.enabled && "border-primary/20")}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.bgColor, "bg-opacity-10")}>
                <config.icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div>
                <CardTitle className="text-sm">{config.label}</CardTitle>
                <CardDescription className="text-[11px]">
                  {isWebhook && !channel.enabled
                    ? "Configure endpoint URL to enable"
                    : hasProviders
                      ? channel.providers.join(", ")
                      : "No providers configured"}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={channel.enabled}
              onCheckedChange={onToggle}
              disabled={isWebhook && !hasProviders}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isWebhook && !hasProviders && (
            <div className="flex items-center gap-2 rounded-md bg-surface/50 border border-border p-3">
              <Lock className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/70">Coming Soon — Webhook endpoints will be configurable once the integration API is live.</span>
            </div>
          )}

          {templateEntries.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[10px]">Templates</Label>
              <div className="space-y-1">
                {templateEntries.map(([name, file]) => (
                  <div key={name} className="flex items-center justify-between rounded bg-surface/50 px-2.5 py-1.5">
                    <span className="text-xs text-muted-foreground capitalize">{name.replace("_", " ")}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {channel.enabled && (
            <div className="flex gap-2">
              <Badge variant="success" size="sm">Active</Badge>
              {channel.providers.length > 0 && (
                <Badge variant="neutral" size="sm">{channel.providers.length} provider{channel.providers.length !== 1 ? "s" : ""}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function NotificationSettings({ notifications, onSetNotifications }: NotificationSettingsProps) {
  const prefersReduced = useReducedMotion();
  const [previewState, setPreviewState] = useState<"idle" | "sending" | "done">("idle");
  const [testState, setTestState] = useState<"idle" | "sending" | "done">("idle");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const toggleChannel = useCallback(
    (key: "email" | "sms" | "push" | "inApp" | "webhook") => {
      onSetNotifications({
        ...notifications,
        [key]: { ...notifications[key], enabled: !notifications[key]!.enabled },
      });
    },
    [notifications, onSetNotifications],
  );

  const handlePreview = useCallback(() => {
    setPreviewState("sending");
    setTimeout(() => setPreviewState("done"), 1200);
    setTimeout(() => setPreviewState("idle"), 3000);
  }, []);

  const handleTest = useCallback(() => {
    setTestState("sending");
    setTimeout(() => setTestState("done"), 1500);
    setTimeout(() => setTestState("idle"), 3000);
  }, []);

  const activeChannels = CHANNEL_CONFIG.filter((c) => notifications[c.key]?.enabled).length;

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={prefersReduced ? undefined : fadeIn}>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Channels
                </CardTitle>
                <CardDescription>
                  Configure delivery channels for system alerts and notifications
                </CardDescription>
              </div>
              <Badge variant={activeChannels > 0 ? "success" : "neutral"} size="sm">
                {activeChannels} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CHANNEL_CONFIG.map((config, i) => (
                <ChannelCard
                  key={config.key}
                  channelKey={config.key}
                  config={config}
                  channel={notifications[config.key] ?? { enabled: false, providers: [], templates: {} }}
                  onToggle={() => toggleChannel(config.key)}
                  index={i}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Suppress non-critical notifications during specified hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Quiet Hours</Label>
                <Switch
                  checked={notifications.quietHours.enabled}
                  onCheckedChange={(enabled) =>
                    onSetNotifications({
                      ...notifications,
                      quietHours: { ...notifications.quietHours, enabled },
                    })
                  }
                />
              </div>

              {notifications.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={notifications.quietHours.start}
                      onChange={(e) =>
                        onSetNotifications({
                          ...notifications,
                          quietHours: { ...notifications.quietHours, start: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={notifications.quietHours.end}
                      onChange={(e) =>
                        onSetNotifications({
                          ...notifications,
                          quietHours: { ...notifications.quietHours, end: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {notifications.quietHours.enabled && (
                <div className="rounded-md bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
                  Notifications are silenced from {notifications.quietHours.start} to {notifications.quietHours.end}. Critical alerts will still be delivered.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Test & Preview</CardTitle>
              <CardDescription>Verify your notification configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={previewState === "done" ? "success" : "outline"}
                size="sm"
                className="w-full"
                onClick={handlePreview}
                disabled={previewState === "sending"}
              >
                {previewState === "sending" ? (
                  <motion.span
                    animate={prefersReduced ? undefined : { rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2 inline-block"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </motion.span>
                ) : (
                  <Send className="mr-2 h-3.5 w-3.5" />
                )}
                {previewState === "done" ? "Preview Sent" : previewState === "sending" ? "Sending..." : "Send Preview"}
              </Button>
              <Button
                variant={testState === "done" ? "success" : "outline"}
                size="sm"
                className="w-full"
                onClick={handleTest}
                disabled={testState === "sending"}
              >
                <TestTube className="mr-2 h-3.5 w-3.5" />
                {testState === "done" ? "Test Passed" : testState === "sending" ? "Testing..." : "Test All Channels"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={prefersReduced ? undefined : fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notification Rules</CardTitle>
            <CardDescription>Event-to-channel routing and priority assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Event</th>
                    <th className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Channels</th>
                    <th className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.rules.map((rule) => {
                    const priority = getPriorityInfo(rule.priority);
                    const isExpanded = expandedRule === rule.id;

                    return (
                      <motion.tr
                        key={rule.id}
                        className="border-b border-border/50 last:border-0"
                        layout
                      >
                        <td className="py-3">
                          <button
                            onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                            className="flex items-center gap-2 text-left hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium">{rule.event.replace(/_/g, " ")}</span>
                          </button>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {rule.channels.map((ch) => {
                              const cfg = CHANNEL_CONFIG.find((c) => c.key === ch);
                              return (
                                <Badge key={ch} variant="neutral" size="sm" className="text-[10px]">
                                  {cfg?.label ?? ch}
                                </Badge>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={priority.variant} size="sm">
                            {priority.label}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { NotificationSettings };
