import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ToastContainer } from "@/components/feedback/toast";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { useSidebarStore } from "@/store/sidebar-store";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { usePresentationStore } from "@/store/presentation-store";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { useSessionGuard } from "@/hooks/use-session";
import { CommandPaletteOverlay } from "@/features/command-palette";
import { NotificationCenter } from "@/features/notifications";
import { ProfilePanel } from "@/features/profile";
import { SearchOverlay } from "@/features/search";
import { ShortcutsModal } from "@/features/keyboard-shortcuts";
import { SystemInitSequence } from "@/features/auth/components/system-init-sequence";
import { AiStoryMode } from "@/features/demo/components/ai-story-mode";
import { GuidedTour } from "@/features/tour/components/guided-tour";

function AppLayout() {
  const { isCollapsed } = useSidebarStore();
  const { notifications, removeNotification } = useUIStore();
  const { isAuthenticated, isSystemInitShowing } = useAuthStore();
  const { isActive: isPresentationActive } = usePresentationStore();
  const isMobile = useIsMobile();

  const [commandOpen, setCommandOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useSessionGuard();

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K -> command palette
      if (meta && e.key === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
        return;
      }

      // Cmd/Ctrl + Shift + F -> search
      if (meta && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setSearchOpen((o) => !o);
        return;
      }

      // Cmd/Ctrl + / -> shortcuts
      if (meta && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }

      // N -> notifications (if no input focused)
      if (e.key === "n" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName || "")) {
        e.preventDefault();
        // Toggle notification center
        document.dispatchEvent(new CustomEvent("toggle-notifications"));
        return;
      }

      // Esc -> close all panels
      if (e.key === "Escape") {
        setProfileOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Redirect to login if not authenticated
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const sidebarWidth = isPresentationActive || isMobile ? 0 : isCollapsed ? 64 : 256;

  return (
    <div
      className={`flex min-h-screen ${isPresentationActive ? "presentation-mode" : ""}`}
    >
      {/* System init sequence overlay */}
      {isSystemInitShowing && <SystemInitSequence />}

      {/* Offline banner */}
      <OfflineBanner />

      {!isPresentationActive && <Sidebar />}
      <div
        className="flex flex-1 flex-col transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        {!isPresentationActive && (
          <TopNav
            onCommandPaletteToggle={() => setCommandOpen(true)}
            onSearchToggle={() => setSearchOpen(true)}
            onProfileToggle={() => setProfileOpen(true)}
          />
        )}
        <main className={`flex-1 ${isPresentationActive ? "p-8" : ""}`}>
          <Outlet />
        </main>
      </div>

      {/* Overlays */}
      <CommandPaletteOverlay />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Notification center (renders inline via TopNav) */}
      <NotificationCenter />

      <ToastContainer
        toasts={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
        }))}
        onDismiss={removeNotification}
      />

      {/* Demo Mode - AI Story Mode */}
      <AiStoryMode />

      {/* Guided Tour for first-time users */}
      <GuidedTour />
    </div>
  );
}

export { AppLayout };
