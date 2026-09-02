import { useLocation } from "@tanstack/react-router";
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  User,
  Monitor,
} from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
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

interface TopNavProps {
  onProfileToggle?: () => void;
}

const routeTitles: Record<string, string> = {
  "/": "Recognition Center",
  "/recognition": "Recognition Center",
  "/recognition-history": "Recognition History",
  "/gate-operations": "Gate Operations",
  "/reports": "Reports",
  "/system": "System",
  "/settings": "Settings",
};

function TopNav({ onProfileToggle }: TopNavProps) {
  const { setMobileOpen } = useSidebarStore();
  const { mode, toggleMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const isMobile = useIsMobile();
  const location = useLocation();

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
