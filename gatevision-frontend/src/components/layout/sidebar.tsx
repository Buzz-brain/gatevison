import { Link, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  DoorOpen,
  BarChart3,
  Settings,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ScanFace,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { APP_NAME } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { slideInRight } from "@/lib/animations";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number | string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { label: "Recognition Center", icon: ScanFace, href: "/recognition" },
      { label: "Gate Operations", icon: DoorOpen, href: "/gate-operations" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Reports", icon: BarChart3, href: "/reports" },
      { label: "System", icon: Wrench, href: "/system" },
    ],
  },
  {
    label: "Enterprise",
    items: [
      { label: "Enterprise Identity", icon: Users, href: "/identity", badge: "Future" },
    ],
  },
];

const bottomItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
];

function Sidebar() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();
  const isMobile = useIsMobile();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col bg-surface border-r border-border transition-all duration-200",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          isCollapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-semibold">{APP_NAME}</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!isCollapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isCollapsed && "justify-center px-2",
                        active
                          ? "bg-primary/10 text-primary font-medium border border-primary/10"
                          : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                      )}
                      onClick={() => isMobile && setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle + bottom items */}
      {!isMobile && (
        <div className="border-t border-border p-2">
          <nav className="mb-2 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isCollapsed && "justify-center px-2",
                    active
                      ? "bg-primary/10 text-primary font-medium border border-primary/10"
                      : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                  )}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 z-50 h-full"
            >
              {sidebarContent}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-30 h-full">
      {sidebarContent}
    </aside>
  );
}

export { Sidebar };
