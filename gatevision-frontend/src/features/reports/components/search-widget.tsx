import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, X, FileText, Car, User, CreditCard, Activity } from "lucide-react";
import type { ApiSearchResult } from "../api/types";

type SearchResult = ApiSearchResult;

interface SearchWidgetProps {
  onSearch: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  onSelect?: (result: SearchResult) => void;
}

function typeIcon(type: SearchResult["type"]) {
  switch (type) {
    case "vehicle":
      return <Car className="h-3.5 w-3.5" />;
    case "driver":
      return <User className="h-3.5 w-3.5" />;
    case "plate":
      return <CreditCard className="h-3.5 w-3.5" />;
    case "session":
    case "transaction":
    case "request":
      return <Activity className="h-3.5 w-3.5" />;
    case "report":
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
}

function typeColor(type: SearchResult["type"]): string {
  switch (type) {
    case "vehicle":
      return "var(--color-primary)";
    case "driver":
      return "var(--color-success)";
    case "plate":
      return "var(--color-warning)";
    default:
      return "var(--color-muted-foreground)";
  }
}

function scoreBadgeVariant(score: number): "success" | "warning" | "danger" | "neutral" {
  if (score >= 0.8) return "success";
  if (score >= 0.5) return "warning";
  if (score >= 0.3) return "neutral";
  return "danger";
}

export function SearchWidget({ onSearch, results, isLoading, onSelect }: SearchWidgetProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      setActiveIndex(-1);
      setOpen(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    onSearch("");
    inputRef.current?.focus();
  }, [onSearch]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect?.(result);
      setOpen(false);
      setQuery(result.label);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "Escape":
          setOpen(false);
          setActiveIndex(-1);
          break;
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleSelect(results[activeIndex]!);
          }
          break;
      }
    },
    [open, activeIndex, results, handleSelect],
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-search-item]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showDropdown = open && (query.length > 0 || isLoading);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search reports, vehicles, drivers..."
          className="h-10 w-full rounded-lg border border-border bg-transparent pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={listRef}
          className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-elevated shadow-lg"
          role="listbox"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs text-muted-foreground">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No results found.</p>
            </div>
          ) : (
            results.map((result, i) => (
              <div
                key={result.id}
                data-search-item
                id={`search-item-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors",
                  activeIndex === i ? "bg-muted" : "hover:bg-muted/50",
                )}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${typeColor(result.type)}20` }}
                >
                  <span style={{ color: typeColor(result.type) }}>
                    {typeIcon(result.type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{result.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{result.description}</p>
                </div>
                <Badge variant={scoreBadgeVariant(result.score)} size="sm">
                  {(result.score * 100).toFixed(0)}%
                </Badge>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
