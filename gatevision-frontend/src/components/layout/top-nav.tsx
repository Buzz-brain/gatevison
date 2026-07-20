import { useLocation, Link } from "@tanstack/react-router";
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  Command,
  Play,
  Monitor,
  Presentation,
} from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import { useDemoStore } from "@/store/demo-store";
import { usePresentationStore } from "@/store/presentation-store";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/features/notifications";

interface TopNavProps {
  onCommandPaletteToggle?: () => void;
  onSearchToggle?: () => void;
  onProfileToggle?: () => void;
}

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/live-monitoring": "Live Monitoring",
  "/access-control": "Access Control",
  "/identity": "Identity",
  "/gate-operations": "Gate Operations",
  "/reports": "Reports",
  "/system": "System",
  "/settings": "Settings",
  "/demo": "Demo Center",
};

function TopNav({ onCommandPaletteToggle, onSearchToggle, onProfileToggle }: TopNavProps) {
  const { setMobileOpen } = useSidebarStore();
  const { mode, toggleMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const isMobile = useIsMobile();
  const location = useLocation();

  const { startDemo, isActive: isDemoActive } = useDemoStore();
  const { toggle: togglePresentation, isActive: isPresentationActive } = usePresentationStore();

  const pageTitle = routeTitles[location.pathname] || "GateVision";
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : "GV";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      {/* Mobile menu */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Page title */}
      <h1 className="text-base font-medium">{pageTitle}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden sm:block">
        <button
          onClick={onSearchToggle}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-4 flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[10px]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Mobile search trigger */}
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={onSearchToggle} aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
      )}

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      >
        {mode === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* Demo Center */}
      <Tooltip content="Demo Center">
        <Button variant="ghost" size="icon" asChild aria-label="Open Demo Center">
          <Link to="/demo">
            <Presentation className="h-4 w-4" />
          </Link>
        </Button>
      </Tooltip>

      {/* Presentation Mode */}
      <Tooltip content="Presentation Mode">
        <Button
          variant={isPresentationActive ? "default" : "ghost"}
          size="icon"
          onClick={togglePresentation}
          aria-label="Toggle Presentation Mode"
          className={isPresentationActive ? "bg-primary text-primary-foreground" : ""}
        >
          <Monitor className="h-4 w-4" />
        </Button>
      </Tooltip>

      {/* Notifications (inline) */}
      <NotificationCenter />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onProfileToggle}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSearchToggle}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCommandPaletteToggle}>
            <Command className="mr-2 h-4 w-4" />
            Command Palette
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { TopNav };
