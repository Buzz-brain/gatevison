import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  X,
  Shield,
  Phone,
  Briefcase,
  Calendar,
  Monitor,
  Activity,
  Lock,
  CheckCircle,
} from "lucide-react";
import type { AdminUser, UserStatus } from "../types";
import { ROLE_CONFIG, STATUS_CONFIG, DEPARTMENT_CONFIG, formatTimestamp, initials, getInitialsColor } from "../utils";

type Tab = "profile" | "security" | "activity";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "activity", label: "Activity" },
];

const EMPTY_ACTIVITIES: { action: string; time: string; detail: string }[] = [];

function StatusPillForProfile({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, "active" | "inactive" | "danger" | "warning" | "pending"> = {
    active: "active",
    inactive: "inactive",
    locked: "danger",
    suspended: "warning",
    pending: "pending",
  };
  return <StatusPill status={map[status]} label={STATUS_CONFIG[status].label} />;
}

interface UserProfileProps {
  user: AdminUser | null;
  onClose: () => void;
}

export function UserProfile({ user, onClose }: UserProfileProps) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (user) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [user, onClose]);

  useEffect(() => {
    setTab("profile");
  }, [user?.id]);

  return (
    <AnimatePresence>
      {user && (
        <>
          {/* Overlay */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, duration: reduced ? 0 : undefined }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-elevated shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {/* Identity */}
              <div className="flex flex-col items-center px-6 pt-8 pb-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback
                    style={{ backgroundColor: getInitialsColor(user.id) }}
                    className="text-xl text-white"
                  >
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-xl font-bold text-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge
                    style={{ backgroundColor: `${ROLE_CONFIG[user.role].color}20`, color: ROLE_CONFIG[user.role].color }}
                  >
                    {ROLE_CONFIG[user.role].label}
                  </Badge>
                  <StatusPillForProfile status={user.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {DEPARTMENT_CONFIG[user.department].label}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-6">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "relative px-4 py-2.5 text-sm font-medium transition-colors",
                      tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                    {tab === t.key && (
                      <motion.div
                        layoutId="profile-tab"
                        className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="px-6 py-5">
                <AnimatePresence mode="wait">
                  {tab === "profile" && (
                    <motion.div
                      key="profile"
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <InfoRow icon={Briefcase} label="Job Title" value={user.jobTitle || "Not set"} />
                      <InfoRow icon={Phone} label="Phone" value={user.phone || "Not set"} />
                      <InfoRow
                        icon={Shield}
                        label="MFA Status"
                        value={user.mfa ? "Enabled" : "Disabled"}
                        valueClass={user.mfa ? "text-green-500" : "text-red-500"}
                      />
                      <InfoRow icon={Calendar} label="Created" value={formatTimestamp(user.created)} />
                      <InfoRow icon={Monitor} label="Active Sessions" value={String(user.sessionCount)} />
                    </motion.div>
                  )}

                  {tab === "security" && (
                    <motion.div
                      key="security"
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Security Score</span>
                          <span className="font-semibold text-foreground">{user.securityScore}%</span>
                        </div>
                        <Progress value={user.securityScore} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Profile Complete</span>
                          <span className="font-semibold text-foreground">{user.profileComplete}%</span>
                        </div>
                        <Progress value={user.profileComplete} />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-foreground">Badges</p>
                        <div className="flex flex-wrap gap-2">
                          {user.badges.map((b, i) => (
                            <Badge
                              key={i}
                              variant={b.variant as "success" | "warning" | "danger" | "info" | "default"}
                            >
                              {b.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {tab === "activity" && (
                    <motion.div
                      key="activity"
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-0"
                    >
                      {EMPTY_ACTIVITIES.map((a, i) => (
                        <div key={i} className="flex gap-3 pb-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <CheckCircle className="h-4 w-4 text-primary" />
                            </div>
                            {i < EMPTY_ACTIVITIES.length - 1 && (
                              <div className="mt-1 w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <p className="text-sm font-medium text-foreground">{a.action}</p>
                            <p className="text-xs text-muted-foreground">{a.detail}</p>
                          </div>
                          <span className="shrink-0 pt-1 text-xs text-muted-foreground">
                            {a.time}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("ml-auto text-sm font-medium", valueClass || "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
