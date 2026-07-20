import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Shield,
  Calendar,
  Clock,
  Key,
  Globe,
  Moon,
  Sun,
  Bell,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { slideInRight, fadeIn } from "@/lib/animations";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const permissionLabels: Record<string, string> = {
  "system.read": "System Read",
  "system.write": "System Write",
  "access.read": "Access Read",
  "access.write": "Access Write",
  "identity.read": "Identity Read",
  "identity.write": "Identity Write",
  "reports.read": "Reports Read",
  "reports.export": "Reports Export",
  "users.read": "Users Read",
  "users.write": "Users Write",
  "audit.read": "Audit Read",
  all: "Full Access",
};

function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { user } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : "GV";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            variants={prefersReduced ? undefined : slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl"
            role="dialog"
            aria-label="User profile"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium">Profile</h2>
              <button
                onClick={onClose}
                className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close profile"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* User avatar & info */}
              <div className="px-5 py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {initials}
                </div>
                <h3 className="text-base font-medium">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.role && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary capitalize">
                    <Shield className="h-3 w-3" />
                    {user.role}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="border-t border-border px-5 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground/60" />
                    <span className="text-muted-foreground">Member since</span>
                    <span className="ml-auto font-medium">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground/60" />
                    <span className="text-muted-foreground">Last login</span>
                    <span className="ml-auto font-medium">
                      {user?.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="border-t border-border px-5 py-4">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Permissions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {user?.permissions?.map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {permissionLabels[p] || p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="border-t border-border px-5 py-4">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Preferences
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={toggleMode}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
                  >
                    {mode === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span>Theme</span>
                    <span className="ml-auto text-xs capitalize">{mode}</span>
                  </button>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                    <span className="ml-auto text-xs">English</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-border px-5 py-4">
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { ProfilePanel };
