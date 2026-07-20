import { motion } from "framer-motion";
import { ScanLine, UserCheck, ShieldCheck, ArrowUpDown, LogIn, LogOut, AlertTriangle, Circle } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GateActivityEvent, ActivityKind } from "../types";
import { activityConfig } from "../utils";

const ICONS: Record<ActivityKind, typeof Circle> = {
  detected: ScanLine,
  recognized: UserCheck,
  decision: ShieldCheck,
  opened: ArrowUpDown,
  entered: LogIn,
  exited: LogOut,
  alert: AlertTriangle,
};

function getIcon(kind: ActivityKind) {
  return ICONS[kind] ?? Circle;
}

export function GateActivityFeed({ events }: { events: GateActivityEvent[] }) {
  const reduce = useReducedMotion();

  if (events.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted">No activity recorded yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="relative pl-6">
        <span className="absolute left-2 top-1 bottom-1 w-px bg-border" aria-hidden />
        <ul className="space-y-4">
          {events.map((e, i) => {
            const cfg = activityConfig[e.kind];
            const color = cfg?.color ?? "#6b7280";
            const Icon = getIcon(e.kind);
            return (
              <motion.li
                key={e.id}
                initial={reduce ? undefined : { opacity: 0, x: -8 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="relative"
              >
                <span
                  className="absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="flex items-start gap-2">
                  <Icon size={16} className="mt-0.5 shrink-0" style={{ color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-muted">{e.time}</span>
                      {e.gate ? (
                        <Badge variant="outline" size="sm">
                          {e.gate}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium leading-snug">{e.label}</p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
