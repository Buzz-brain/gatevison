import type { LucideIcon } from "lucide-react";

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string[];
  keywords?: string[];
  onSelect: () => void;
  group?: string;
}

export interface CommandState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  results: CommandGroup[];
}
