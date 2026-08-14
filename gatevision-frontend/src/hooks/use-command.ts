import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCommandStore } from "@/store/command-store";
import {
  ShieldCheck,
  Users,
  DoorOpen,
  BarChart3,
  Wrench,
  Settings,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Bell,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";

export function useCommand() {
  const store = useCommandStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        store.toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const getGroups = () => [
    {
      id: "navigation",
      label: "Navigation",
      items: [
        { id: "nav-identity", label: "Identity", description: "Vehicles & drivers", icon: Users as LucideIcon, shortcut: ["G", "I"], keywords: ["driver", "vehicle", "person"], onSelect: () => { navigate({ to: "/identity" }); store.close(); } },
        { id: "nav-gates", label: "Gate Operations", description: "Barrier control", icon: DoorOpen as LucideIcon, shortcut: ["G", "O"], keywords: ["barrier", "queue"], onSelect: () => { navigate({ to: "/gate-operations" }); store.close(); } },
        { id: "nav-reports", label: "Reports", description: "Analytics", icon: BarChart3 as LucideIcon, shortcut: ["G", "R"], keywords: ["analytics", "audit"], onSelect: () => { navigate({ to: "/reports" }); store.close(); } },
        { id: "nav-system", label: "System", description: "Health & config", icon: Wrench as LucideIcon, shortcut: ["G", "S"], keywords: ["health", "status"], onSelect: () => { navigate({ to: "/system" }); store.close(); } },
        { id: "nav-settings", label: "Settings", description: "Preferences", icon: Settings as LucideIcon, shortcut: ["G", "E"], keywords: ["prefs", "config"], onSelect: () => { navigate({ to: "/settings" }); store.close(); } },
      ],
    },
    {
      id: "actions",
      label: "Actions",
      items: [
        { id: "act-theme", label: "Toggle Theme", description: "Switch dark/light", icon: Moon as LucideIcon, shortcut: ["Ctrl", "Shift", "T"], keywords: ["dark", "light", "mode"], onSelect: () => { useThemeStore.getState().toggleMode(); store.close(); } },
        { id: "act-notif", label: "Notifications", description: "View notifications", icon: Bell as LucideIcon, shortcut: ["N"], keywords: ["alerts", "bell"], onSelect: () => { store.close(); } },
        { id: "act-search", label: "Global Search", description: "Search everything", icon: Search as LucideIcon, shortcut: ["Ctrl", "Shift", "F"], keywords: ["find", "lookup"], onSelect: () => { store.close(); } },
        { id: "act-help", label: "Shortcuts", description: "Keyboard shortcuts", icon: HelpCircle as LucideIcon, shortcut: ["Ctrl", "/"], keywords: ["help", "keys"], onSelect: () => { store.close(); } },
      ],
    },
    {
      id: "session",
      label: "Session",
      items: [
        { id: "sess-logout", label: "Log Out", description: "End current session", icon: LogOut as LucideIcon, keywords: ["signout", "exit"], onSelect: () => { useAuthStore.getState().logout(); store.close(); } },
      ],
    },
  ];

  return {
    isOpen: store.isOpen,
    query: store.query,
    selectedIndex: store.selectedIndex,
    filteredGroups: store.filteredGroups,
    open: store.open,
    close: store.close,
    toggle: store.toggle,
    setQuery: store.setQuery,
    navigateNext: store.navigateNext,
    navigatePrev: store.navigatePrev,
    executeSelected: store.executeSelected,
    getGroups,
  };
}
