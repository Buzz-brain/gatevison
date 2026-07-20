import { useState } from "react";
import {
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  Pencil,
  Plus,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type {
  NotificationTemplate,
  NotificationRule,
  NotificationChannel,
} from "../types";
import { CHANNEL_CONFIG } from "../utils";

const CHANNEL_ICON: Record<NotificationChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  in_app: Smartphone,
};

const CHANNEL_BADGE_VARIANT: Record<NotificationChannel, "default" | "info" | "warning" | "success"> = {
  email: "default",
  sms: "info",
  push: "warning",
  in_app: "success",
};

interface NotificationManagerProps {
  notifications: {
    templates: NotificationTemplate[];
    rules: NotificationRule[];
  };
}

export function NotificationManager({ notifications }: NotificationManagerProps) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<"templates" | "rules">("templates");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Notification Manager</CardTitle>
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          <button
            onClick={() => setTab("templates")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "templates"
                ? "bg-elevated text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Templates
          </button>
          <button
            onClick={() => setTab("rules")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "rules"
                ? "bg-elevated text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Rules
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {tab === "templates" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {notifications.templates.map((tpl) => {
              const ChIcon = CHANNEL_ICON[tpl.channel];
              return (
                <div
                  key={tpl.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-elevated/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ChIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{tpl.name}</p>
                      <Switch
                        checked={tpl.enabled}
                        onCheckedChange={() => {
                          /* mock toggle */
                        }}
                      />
                    </div>
                    <Badge
                      variant={CHANNEL_BADGE_VARIANT[tpl.channel]}
                      size="sm"
                      className="mt-1"
                    >
                      {CHANNEL_CONFIG[tpl.channel].label}
                    </Badge>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {tpl.subject}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {tab === "rules" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Rule
              </Button>
            </div>

            {notifications.rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-lg border border-border p-4 transition-colors hover:bg-elevated/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{rule.event}</p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {rule.channels.map((ch) => {
                        const ChIcon = CHANNEL_ICON[ch];
                        return (
                          <Badge
                            key={ch}
                            variant={CHANNEL_BADGE_VARIANT[ch]}
                            size="sm"
                          >
                            <ChIcon className="mr-1 h-3 w-3" />
                            {CHANNEL_CONFIG[ch].label}
                          </Badge>
                        );
                      })}
                    </div>

                    {rule.quietHours && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Quiet: {rule.quietHours.start} - {rule.quietHours.end}
                      </div>
                    )}

                    {rule.escalation.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-medium">Escalation:</span>
                        {rule.escalation.map((esc, i) => {
                          const EIcon = CHANNEL_ICON[esc.channel];
                          return (
                            <span key={i} className="inline-flex items-center gap-1">
                              {i > 0 && (
                                <ArrowRight className="h-3 w-3 text-border" />
                              )}
                              <span className="inline-flex items-center gap-0.5 rounded bg-surface px-1.5 py-0.5">
                                <EIcon className="h-3 w-3" />
                                {esc.delay}m
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="icon-sm" className="shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
