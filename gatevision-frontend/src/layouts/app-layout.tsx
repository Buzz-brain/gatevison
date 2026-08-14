import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ToastContainer } from "@/components/feedback/toast";
import { useSidebarStore } from "@/store/sidebar-store";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { usePresentationStore } from "@/store/presentation-store";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { useSessionGuard } from "@/hooks/use-session";
import { CommandPaletteOverlay } from "@/features/command-palette";
import { ProfilePanel } from "@/features/profile";
import { SearchOverlay } from "@/features/search";
import { ShortcutsModal } from "@/features/keyboard-shortcuts";
import { SystemInitSequence } from "@/features/auth/components/system-init-sequence";
import { GuidedTour } from "@/features/tour/components/guided-tour";

function AppLayout() {
  const { isCollapsed } = useSidebarStore();
  const { notifications, removeNotification } = useUIStore();
  const { isAuthenticated, isSystemInitShowing } = useAuthStore();
  const { isActive: isPresentationActive, exit: exitPresentation } = usePresentationStore();
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

      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>

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
        {/* Offline banner removed: localhost backend works without internet */}
        <main id="main-content" tabIndex={-1} className={`flex-1 ${isPresentationActive ? "p-8" : ""} focus:outline-none`}>
          <Outlet />
        </main>
      </div>

      {isPresentationActive && (
        <button
          type="button"
          onClick={exitPresentation}
          aria-label="Exit Presentation Mode"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-elevated"
        >
          <X className="h-3.5 w-3.5" />
          Exit Presentation
        </button>
      )}

      {/* Overlays */}
      <CommandPaletteOverlay />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <ToastContainer
        toasts={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
        }))}
        onDismiss={removeNotification}
      />

      {/* Guided Tour for first-time users */}
      <GuidedTour />
    </div>
  );
}

export { AppLayout };
