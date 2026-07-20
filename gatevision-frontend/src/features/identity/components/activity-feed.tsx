import { motion } from "framer-motion";
import {
  UserPlus, Car, ShieldAlert, ShieldCheck, Link2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatRelative } from "../utils";
import type { ActivityItem, ActivityType } from "../types";

interface ActivityFeedProps {
  items: ActivityItem[];
}

const typeConfig: Record<ActivityType, { icon: typeof UserPlus; color: string }> = {
  enrollment: { icon: UserPlus, color: "text-success" },
  vehicle_registered: { icon: Car, color: "text-primary" },
  policy_changed: { icon: ShieldAlert, color: "text-warning" },
  identity_verified: { icon: ShieldCheck, color: "text-info" },
  link: { icon: Link2, color: "text-muted-foreground" },
};

function ActivityFeed({ items }: ActivityFeedProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Recent Activity</h3>
      </div>
      <div className="space-y-0">
        {items.map((item, i) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={item.id}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-3 pb-3 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-surface", config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {i < items.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-1">
                <p className="text-xs font-medium">{item.title}</p>
                <p className="text-[10px] text-muted-foreground/60">{item.description}</p>
                <p className="text-[9px] text-muted-foreground/40 mt-0.5">{item.actor} · {formatRelative(item.timestamp)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export { ActivityFeed };
