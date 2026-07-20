import { create } from "zustand";
import type { CommandGroup } from "@/types/commands";
import {
  LayoutDashboard,
  Monitor,
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
import { useThemeStore } from "./theme-store";
import { useAuthStore } from "./auth-store";

interface CommandStoreState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  groups: CommandGroup[];
  filteredGroups: CommandGroup[];
}

interface CommandStoreActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  executeSelected: () => void;
}

type NavigationFunction = (path: string) => void;

let navigateFn: NavigationFunction = () => {};

export function setCommandNavigate(fn: NavigationFunction) {
  navigateFn = fn;
}

function getCommandGroups(): CommandGroup[] {
  return [
    {
      id: "navigation",
      label: "Navigation",
      items: [
        { id: "nav-dash", label: "Dashboard", description: "System overview", icon: LayoutDashboard as LucideIcon, shortcut: ["G", "D"], keywords: ["home", "main"], onSelect: () => navigateFn("/") },
        { id: "nav-live", label: "Live Monitoring", description: "Camera feeds", icon: Monitor as LucideIcon, shortcut: ["G", "L"], keywords: ["camera", "feed"], onSelect: () => navigateFn("/live-monitoring") },
        { id: "nav-access", label: "Access Control", description: "Gate rules", icon: ShieldCheck as LucideIcon, shortcut: ["G", "A"], keywords: ["gate", "permission"], onSelect: () => navigateFn("/access-control") },
        { id: "nav-identity", label: "Identity", description: "Vehicles & drivers", icon: Users as LucideIcon, shortcut: ["G", "I"], keywords: ["driver", "vehicle", "person"], onSelect: () => navigateFn("/identity") },
        { id: "nav-gates", label: "Gate Operations", description: "Barrier control", icon: DoorOpen as LucideIcon, shortcut: ["G", "O"], keywords: ["barrier", "queue"], onSelect: () => navigateFn("/gate-operations") },
        { id: "nav-reports", label: "Reports", description: "Analytics", icon: BarChart3 as LucideIcon, shortcut: ["G", "R"], keywords: ["analytics", "audit"], onSelect: () => navigateFn("/reports") },
        { id: "nav-system", label: "System", description: "Health & config", icon: Wrench as LucideIcon, shortcut: ["G", "S"], keywords: ["health", "status"], onSelect: () => navigateFn("/system") },
        { id: "nav-settings", label: "Settings", description: "Preferences", icon: Settings as LucideIcon, shortcut: ["G", "E"], keywords: ["prefs", "config"], onSelect: () => navigateFn("/settings") },
      ],
    },
    {
      id: "actions",
      label: "Actions",
      items: [
        { id: "act-theme", label: "Toggle Theme", description: "Switch dark/light", icon: Moon as LucideIcon, shortcut: ["Ctrl", "Shift", "T"], keywords: ["dark", "light", "mode"], onSelect: () => useThemeStore.getState().toggleMode() },
        { id: "act-notif", label: "Notifications", description: "View notifications", icon: Bell as LucideIcon, shortcut: ["N"], keywords: ["alerts", "bell"], onSelect: () => {} },
        { id: "act-search", label: "Global Search", description: "Search everything", icon: Search as LucideIcon, shortcut: ["Ctrl", "Shift", "F"], keywords: ["find", "lookup"], onSelect: () => {} },
        { id: "act-help", label: "Shortcuts", description: "Keyboard shortcuts", icon: HelpCircle as LucideIcon, shortcut: ["Ctrl", "/"], keywords: ["help", "keys"], onSelect: () => {} },
      ],
    },
    {
      id: "session",
      label: "Session",
      items: [
        { id: "sess-logout", label: "Log Out", description: "End current session", icon: LogOut as LucideIcon, shortcut: [], keywords: ["signout", "exit"], onSelect: () => useAuthStore.getState().logout() },
      ],
    },
  ];
}

function filterGroups(groups: CommandGroup[], query: string): CommandGroup[] {
  if (!query) return groups;
  const q = query.toLowerCase();
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.keywords?.some((k) => k.toLowerCase().includes(q)),
      ),
    }))
    .filter((g) => g.items.length > 0);
}

export const useCommandStore = create<CommandStoreState & CommandStoreActions>()(
  (set, get) => ({
    isOpen: false,
    query: "",
    selectedIndex: 0,
    groups: [],
    filteredGroups: [],

    open: () => {
      set({
        isOpen: true,
        query: "",
        selectedIndex: 0,
        groups: getCommandGroups(),
        filteredGroups: getCommandGroups(),
      });
    },

    close: () => set({ isOpen: false, query: "", selectedIndex: 0 }),

    toggle: () => {
      const { isOpen } = get();
      if (isOpen) get().close();
      else get().open();
    },

    setQuery: (query) => {
      const { groups } = get();
      set({
        query,
        selectedIndex: 0,
        filteredGroups: filterGroups(groups, query),
      });
    },

    setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

    navigateNext: () => {
      const { filteredGroups, selectedIndex } = get();
      const total = filteredGroups.reduce((a, g) => a + g.items.length, 0);
      set({ selectedIndex: Math.min(selectedIndex + 1, total - 1) });
    },

    navigatePrev: () => {
      const { selectedIndex } = get();
      set({ selectedIndex: Math.max(selectedIndex - 1, 0) });
    },

    executeSelected: () => {
      const { filteredGroups, selectedIndex } = get();
      let idx = 0;
      for (const group of filteredGroups) {
        for (const item of group.items) {
          if (idx === selectedIndex) {
            item.onSelect();
            get().close();
            return;
          }
          idx++;
        }
      }
    },
  }),
);
