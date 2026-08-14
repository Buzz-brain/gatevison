import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  X,
  Shield,
  Settings,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { useNotificationStore } from "@/store/notification-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { slideInRight, fadeIn } from "@/lib/animations";

const categoryIcons = {
  security: Shield,
  system: Settings,
  manual_review: UserCheck,
  recognition: RefreshCw,
  updates: Info,
};

const typeStyles: Record<string, string> = {
  success: "border-l-success bg-success/5",
  warning: "border-l-warning bg-warning/5",
  error: "border-l-danger bg-danger/5",
  info: "border-l-primary bg-primary/5",
};

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isOpen,
    groups,
    isLoading,
    toggleOpen,
    setOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = () => toggleOpen();
    document.addEventListener("toggle-notifications", handler);
    return () => document.removeEventListener("toggle-notifications", handler);
  }, [toggleOpen]);

  return (
    <>
      {/* Bell trigger */}
      <button
        onClick={toggleOpen}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              variants={prefersReduced ? undefined : slideInRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Mark all as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                  </div>
                ) : groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BellOff className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.label}>
                      <div className="px-5 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                        {group.label}
                      </div>
                      {group.notifications.map((n) => {
                        const Icon = categoryIcons[n.category];
                        return (
                          <button
                            key={n.id}
                            onClick={() => !n.read && markAsRead(n.id)}
                            className={cn(
                              "w-full border-l-2 px-5 py-3 text-left transition-colors hover:bg-elevated/50",
                              !n.read && "bg-elevated/30",
                              typeStyles[n.type],
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full",
                                n.type === "success" && "bg-success/10",
                                n.type === "warning" && "bg-warning/10",
                                n.type === "error" && "bg-danger/10",
                                n.type === "info" && "bg-primary/10",
                              )}>
                                {Icon && <Icon className="h-3 w-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={cn(
                                    "text-sm",
                                    !n.read ? "font-medium text-foreground" : "text-muted-foreground",
                                  )}>
                                    {n.title}
                                  </p>
                                  {!n.read && (
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                  )}
                                </div>
                                {n.description && (
                                  <p className="mt-0.5 text-xs text-muted-foreground/70 line-clamp-2">
                                    {n.description}
                                  </p>
                                )}
                                <p className="mt-1 text-[10px] text-muted-foreground/40">
                                  {formatTimeAgo(n.timestamp)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export { NotificationCenter };
