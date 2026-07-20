import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, ArrowRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fadeIn, slideUp } from "@/lib/animations";
import { SETTING_CATEGORIES, type SettingDefinition, type SettingCategory } from "../types";
import { searchSettings } from "../mocks/data";

const MAX_RECENT = 5;

interface SettingsSearchProps {
  onSelect: (setting: SettingDefinition) => void;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <mark className="bg-primary/20 text-primary rounded px-0.5">{match}</mark>
      {after}
    </>
  );
}

function SettingsSearch({ onSelect }: SettingsSearchProps) {
  const prefersReduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchSettings(query.trim());
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<SettingCategory, SettingDefinition[]>();
    for (const r of results) {
      const existing = map.get(r.category);
      if (existing) {
        existing.push(r);
      } else {
        map.set(r.category, [r]);
      }
    }
    return map;
  }, [results]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(setting: SettingDefinition) {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => [query.trim(), ...prev].slice(0, MAX_RECENT));
    }
    setQuery("");
    setFocused(false);
    onSelect(setting);
  }

  function handleRecentSelect(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  function clearRecent() {
    setRecentSearches([]);
  }

  const showDropdown = focused && (query.trim().length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search settings..."
          className="pl-9 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            variants={prefersReduced ? undefined : fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-elevated shadow-dropdown"
          >
            {query.trim().length > 0 && results.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-1">
                {Array.from(grouped.entries()).map(([catId, items]) => {
                  const cat = SETTING_CATEGORIES.find((c) => c.id === catId);
                  return (
                    <div key={catId} className="mb-1">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        {cat?.label ?? catId}
                      </p>
                      {items.map((s) => (
                        <motion.button
                          key={s.id}
                          variants={prefersReduced ? undefined : slideUp}
                          initial="hidden"
                          animate="visible"
                          onClick={() => handleSelect(s)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
                        >
                          <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {highlightMatch(s.label, query)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground/60">
                              {highlightMatch(s.description, query)}
                            </p>
                          </div>
                          <Badge variant="neutral" size="sm">{s.type}</Badge>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        </motion.button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {query.trim().length > 0 && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium">No settings found</p>
                <p className="text-xs text-muted-foreground/60">
                  Try a different search term
                </p>
              </div>
            )}

            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div className="p-1">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Recent Searches
                  </p>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] text-muted-foreground/60 hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentSelect(term)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { SettingsSearch };
