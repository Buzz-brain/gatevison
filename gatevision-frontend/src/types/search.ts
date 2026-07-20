export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  url?: string;
  icon?: string;
  metadata?: Record<string, string>;
}

export type SearchResultType =
  | "page"
  | "vehicle"
  | "driver"
  | "report"
  | "setting"
  | "command"
  | "notification";

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
}

export interface PinnedAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  recentSearches: RecentSearch[];
  pinnedActions: PinnedAction[];
  isSearching: boolean;
}
