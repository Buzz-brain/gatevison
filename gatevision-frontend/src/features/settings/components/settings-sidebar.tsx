import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, BrainCircuit, Scan, ArrowUpDown, Camera,
  Shield, Bell, HardDrive, RotateCcw, Activity,
  Palette, Cpu, Info, ChevronDown, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { SETTING_CATEGORIES, type SettingCategory } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
  Settings, BrainCircuit, Scan, ArrowUpDown, Camera,
  Shield, Bell, HardDrive, RotateCcw, Activity,
  Palette, Cpu, Info,
};

const GROUPS: { label: string; ids: SettingCategory[] }[] = [
  { label: "Core", ids: ["general", "recognition", "security"] },
  { label: "Intelligence", ids: ["ai-models", "decision-engine", "cameras", "gate-control"] },
  { label: "Operations", ids: ["storage", "backup", "monitoring", "notifications"] },
  { label: "System", ids: ["appearance", "advanced", "about"] },
];

interface SettingsSidebarProps {
  activeTab: SettingCategory;
  onTabChange: (tab: SettingCategory) => void;
}

function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const prefersReduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handleSelect(id: SettingCategory) {
    onTabChange(id);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <nav className="flex flex-col gap-4 p-3">
      {GROUPS.map((group) => {
        const isCollapsed = collapsed[group.label] ?? false;
        return (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground"
            >
              {group.label}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  isCollapsed && "-rotate-90",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={prefersReduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <motion.div
                    variants={prefersReduced ? undefined : staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-0.5"
                  >
                    {group.ids.map((id) => {
                      const cat = SETTING_CATEGORIES.find((c) => c.id === id);
                      if (!cat) return null;
                      const Icon = ICON_MAP[cat.icon] ?? Settings;
                      const isActive = activeTab === id;

                      return (
                        <motion.button
                          key={id}
                          variants={prefersReduced ? undefined : staggerItem}
                          onClick={() => handleSelect(id)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{cat.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-indicator"
                              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                              transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-elevated border border-border shadow-card lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              variants={prefersReduced ? undefined : fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              variants={prefersReduced ? undefined : fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-elevated lg:hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border">
                <span className="text-sm font-semibold">Settings</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden lg:block w-56 shrink-0 border-r border-border bg-elevated/50 overflow-y-auto">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-semibold">Settings</p>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}

export { SettingsSidebar };
