import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Clock,
  ArrowUpRight,
  Star,
  Car,
  User,
  FileText,
  LayoutDashboard,
  Settings,
  Command,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { mockSearchService } from "@/services/mock/search.service";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { SearchResult, RecentSearch, PinnedAction } from "@/types/search";
import { modalOverlay, modalContent, fadeIn } from "@/lib/animations";

const typeIcons: Record<string, typeof LayoutDashboard> = {
  page: LayoutDashboard,
  vehicle: Car,
  driver: User,
  report: FileText,
  setting: Settings,
  command: Command,
  notification: Bell,
};

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [pinnedActions, setPinnedActions] = useState<PinnedAction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      mockSearchService.getRecentSearches().then(setRecentSearches);
      mockSearchService.getPinnedActions().then(setPinnedActions);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const doSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }
    setIsSearching(true);
    const res = await mockSearchService.search(q);
    setResults(res);
    setSelectedIndex(-1);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
        const r = results[selectedIndex];
        if (r.url) window.location.href = r.url;
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, results, selectedIndex, onClose]);

  const totalResults = results.length + recentSearches.length + pinnedActions.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-start justify-center pt-[12vh]">
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={prefersReduced ? undefined : modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl rounded-xl border border-border bg-elevated shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Global search"
            aria-modal="true"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => doSearch(e.target.value)}
                placeholder="Search vehicles, drivers, reports, pages..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                aria-label="Search"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                </div>
              ) : query ? (
                results.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No results for "{query}"
                  </div>
                ) : (
                  results.map((r, i) => {
                    const Icon = typeIcons[r.type] || Search;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { if (r.url) window.location.href = r.url; onClose(); }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                          i === selectedIndex ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{r.title}</div>
                          {r.description && <div className="text-xs text-muted-foreground/60 truncate">{r.description}</div>}
                        </div>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground/30" />
                      </button>
                    );
                  })
                )
              ) : (
                <>
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">Recent</span>
                        <button
                          onClick={() => { setRecentSearches([]); mockSearchService.clearRecentSearches(); }}
                          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground"
                        >
                          Clear all
                        </button>
                      </div>
                      {recentSearches.map((rs) => (
                        <button
                          key={rs.id}
                          onClick={() => doSearch(rs.query)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
                        >
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                          <span className="flex-1">{rs.query}</span>
                          <span className="text-[10px] text-muted-foreground/40">
                            {formatTimeAgo(rs.timestamp)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pinned actions */}
                  {pinnedActions.length > 0 && (
                    <div>
                      <div className="px-2 py-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">Pinned</span>
                      </div>
                      {pinnedActions.map((pa) => (
                        <button
                          key={pa.id}
                          onClick={() => { pa.action(); onClose(); }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
                        >
                          <Star className="h-3.5 w-3.5 text-muted-foreground/40" />
                          <span>{pa.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {totalResults === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Start typing to search...
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40">
                <span><kbd className="rounded border border-border px-1 py-0.5">↑↓</kbd> Navigate</span>
                <span><kbd className="rounded border border-border px-1 py-0.5">↵</kbd> Open</span>
                <span><kbd className="rounded border border-border px-1 py-0.5">Esc</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Needed for Notification type in icon lookup
import { Bell } from "lucide-react";

export { SearchOverlay };
