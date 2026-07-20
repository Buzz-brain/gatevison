import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, X } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { modalOverlay, modalContent } from "@/lib/animations";

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Command palette" },
      { keys: ["Ctrl", "Shift", "F"], description: "Global search" },
      { keys: ["Alt", "←"], description: "Go back" },
      { keys: ["Alt", "→"], description: "Go forward" },
    ],
  },
  {
    label: "Actions",
    shortcuts: [
      { keys: ["N"], description: "Toggle notifications" },
      { keys: ["Ctrl", "Shift", "T"], description: "Toggle theme" },
      { keys: ["Ctrl", "/"], description: "Show shortcuts" },
    ],
  },
  {
    label: "Session",
    shortcuts: [
      { keys: ["Ctrl", "Shift", "L"], description: "Log out" },
      { keys: ["Esc"], description: "Close dialogs / panels" },
    ],
  },
  {
    label: "Command Palette",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate items" },
      { keys: ["Enter"], description: "Select item" },
      { keys: ["Esc"], description: "Close palette" },
    ],
  },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md rounded-xl border border-border bg-elevated shadow-2xl p-6"
            role="dialog"
            aria-label="Keyboard shortcuts"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Command className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                    {group.label}
                  </h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((s) => (
                      <div
                        key={s.description}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5"
                      >
                        <span className="text-sm text-muted-foreground">{s.description}</span>
                        <kbd className="flex items-center gap-0.5">
                          {s.keys.map((key, i) => (
                            <span
                              key={key}
                              className="inline-flex items-center rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {key}
                            </span>
                          ))}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { ShortcutsModal };
