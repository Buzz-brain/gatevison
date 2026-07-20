import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command } from "lucide-react";
import { useCommand } from "@/hooks/use-command";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { modalOverlay, modalContent } from "@/lib/animations";

function CommandPaletteOverlay() {
  const {
    isOpen,
    query,
    selectedIndex,
    filteredGroups,
    close,
    setQuery,
    navigateNext,
    navigatePrev,
    executeSelected,
  } = useCommand();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); navigateNext(); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); navigatePrev(); return; }
      if (e.key === "Enter") { e.preventDefault(); executeSelected(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, navigateNext, navigatePrev, executeSelected, close]);

  const totalItems = filteredGroups.reduce((a, g) => a + g.items.length, 0);

  const highlightMatch = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh]">
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            variants={prefersReduced ? undefined : modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl rounded-xl border border-border bg-elevated shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, settings, and actions..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                aria-label="Search commands"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto p-2"
              role="listbox"
              aria-activedescendant={selectedIndex >= 0 ? `cmd-item-${selectedIndex}` : undefined}
            >
              {totalItems === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {query ? `No results for "${query}"` : "Start typing to search..."}
                </div>
              ) : (
                (() => {
                  let globalIdx = 0;
                  return filteredGroups.map((group) => (
                    <div key={group.id}>
                      <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                        {group.label}
                      </div>
                      {group.items.map((item) => {
                        const idx = globalIdx++;
                        const isSelected = idx === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button
                            id={`cmd-item-${idx}`}
                            key={item.id}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => { item.onSelect(); close(); }}
                            onMouseEnter={() => {}} // keyboard-only selection
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                              isSelected
                                ? "bg-primary/10 text-foreground"
                                : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                            )}
                          >
                            {Icon && <Icon className="h-4 w-4 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{highlightMatch(item.label)}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground/60 truncate">
                                  {highlightMatch(item.description)}
                                </div>
                              )}
                            </div>
                            {item.shortcut && item.shortcut.length > 0 && (
                              <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
                                {item.shortcut.join(" ")}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40">
                <span><kbd className="rounded border border-border px-1 py-0.5">↑↓</kbd> Navigate</span>
                <span><kbd className="rounded border border-border px-1 py-0.5">↵</kbd> Select</span>
                <span><kbd className="rounded border border-border px-1 py-0.5">Esc</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { CommandPaletteOverlay };
