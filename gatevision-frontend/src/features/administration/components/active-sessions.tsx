import { useState } from "react";
import {
  Monitor,
  Smartphone,
  Laptop,
  LogOut,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { SessionInfo } from "../types";
import { formatTimestamp, timeAgo } from "../utils";

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  laptop: Laptop,
};

const STATUS_MAP: Record<string, { status: "active" | "warning" | "inactive" | "danger" }> = {
  active: { status: "active" },
  idle: { status: "warning" },
  expired: { status: "inactive" },
};

interface ActiveSessionsProps {
  sessions: SessionInfo[];
}

export function ActiveSessions({ sessions }: ActiveSessionsProps) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<string>("active");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = sessions.filter((s) => s.status === tab);

  function handleTerminate(id: string) {
    if (confirmId === id) {
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Active Sessions</CardTitle>
          <Badge variant="default" size="sm">{sessions.length}</Badge>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              /* mock */
            }}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Terminate All
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              /* mock */
            }}
          >
            <ShieldAlert className="mr-1 h-3.5 w-3.5" />
            Force Logout
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
          {(["active", "idle", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === s
                  ? "bg-elevated text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <Badge variant={tab === s ? "default" : "neutral"} size="sm" className="ml-1.5">
                {sessions.filter((x) => x.status === s).length}
              </Badge>
            </button>
          ))}
        </div>

        <ScrollArea className="max-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">User</th>
                <th className="pb-2 pr-4 font-medium">Browser</th>
                <th className="pb-2 pr-4 font-medium">OS</th>
                <th className="pb-2 pr-4 font-medium">Location</th>
                <th className="pb-2 pr-4 font-medium">Started</th>
                <th className="pb-2 pr-4 font-medium">Expires</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => {
                const DevIcon = DEVICE_ICONS[session.device.toLowerCase()] ?? Monitor;
                return (
                  <tr
                    key={session.id}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-elevated/50",
                    )}
                  >
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="font-medium">{session.user}</p>
                        <p className="text-xs text-muted-foreground">{session.email}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {session.browser}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DevIcon className="h-3.5 w-3.5" />
                        {session.os}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {session.location}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatTimestamp(session.started)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {timeAgo(session.expires)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusPill
                        status={STATUS_MAP[session.status]?.status ?? "unknown"}
                        label={session.status}
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      {session.status !== "expired" && (
                        <Button
                          variant={confirmId === session.id ? "destructive" : "ghost"}
                          size="sm"
                          onClick={() => handleTerminate(session.id)}
                        >
                          <LogOut className="mr-1 h-3.5 w-3.5" />
                          {confirmId === session.id ? "Confirm?" : "Terminate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No {tab} sessions.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
