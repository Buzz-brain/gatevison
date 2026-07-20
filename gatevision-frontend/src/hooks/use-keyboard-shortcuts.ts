import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase();
        const matchCtrl = s.ctrl ? e.ctrlKey : !e.ctrlKey;
        const matchMeta = s.meta ? e.metaKey : !e.metaKey;
        const matchShift = s.shift ? e.shiftKey : !e.shiftKey;
        const matchAlt = s.alt ? e.altKey : !e.altKey;
        const matchMod = s.ctrl || s.meta ? (e.ctrlKey || e.metaKey) : true;

        if (matchKey && matchMod && matchCtrl && matchMeta && matchShift && matchAlt) {
          if (s.preventDefault !== false) {
            e.preventDefault();
          }
          s.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

export const SHORTCUTS = {
  COMMAND_PALETTE: { key: "k", meta: true, handler: () => {} },
  SEARCH: { key: "f", ctrl: true, shift: true, handler: () => {} },
  NOTIFICATIONS: { key: "n", handler: () => {} },
  SHORTCUTS_HELP: { key: "/", ctrl: true, handler: () => {} },
  ESCAPE: { key: "Escape", handler: () => {} },
  THEME: { key: "t", ctrl: true, shift: true, handler: () => {} },
  LOGOUT: { key: "l", ctrl: true, shift: true, handler: () => {} },
} as const;
