import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  UserMinus,
  ShieldCheck,
  ShieldX,
  LogIn,
  LogOut,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { ActivityEntry } from "../types";
import { formatTime } from "../utils";

const TYPE_DOT: Record<string, string> = {
  created: "bg-green-500",
  approved: "bg-green-500",
  updated: "bg-amber-500",
  warning: "bg-amber-500",
  deleted: "bg-red-500",
  rejected: "bg-red-500",
  error: "bg-red-500",
  login: "bg-blue-500",
  logout: "bg-blue-500",
};

const TYPE_ICON: Record<string, typeof UserPlus> = {
  created: UserPlus,
  approved: ShieldCheck,
  updated: RefreshCw,
  warning: AlertTriangle,
  deleted: UserMinus,
  rejected: ShieldX,
  error: AlertCircle,
  login: LogIn,
  logout: LogOut,
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

interface ActivityTimelineProps {
  activity: ActivityEntry[];
}

export function ActivityTimeline({ activity }: ActivityTimelineProps) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) viewport.scrollTop = 0;
    }
  }, [activity]);

  return (
    <ScrollArea ref={scrollRef} className="h-full">
      <motion.div
        className="relative px-4 py-2"
        variants={stagger}
        initial={reduced ? false : "hidden"}
        animate="visible"
      >
        <div className="absolute left-[52px] top-0 bottom-0 w-px bg-border" />

        {activity.map((entry) => {
          const dot = TYPE_DOT[entry.type] ?? "bg-muted-foreground";
          return (
            <motion.div
              key={entry.id}
              variants={reduced ? undefined : item}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="relative flex items-start gap-3 py-3"
            >
              <span className="w-12 shrink-0 pt-1 text-right text-xs font-mono text-muted-foreground">
                {formatTime(entry.time)}
              </span>

              <div className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                    dot
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-foreground">
                  {entry.action}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {entry.detail}
                </p>
                <p className="mt-1 text-xs font-medium text-primary/80">
                  {entry.user}
                </p>
              </div>
            </motion.div>
          );
        })}

        {activity.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        )}
      </motion.div>
    </ScrollArea>
  );
}
