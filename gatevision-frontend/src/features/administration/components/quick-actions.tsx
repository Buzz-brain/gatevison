import { motion } from "framer-motion";
import {
  UserPlus,
  Shield,
  CheckCircle,
  FileText,
  RotateCcw,
  Bell,
  Download,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { QuickAction } from "../types";

const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus,
  Shield,
  CheckCircle,
  FileText,
  RotateCcw,
  Bell,
  Download,
  Lock,
};

const VARIANT_STYLE: Record<string, { card: string; icon: string }> = {
  danger: {
    card: "hover:border-red-500/40 hover:bg-red-500/5",
    icon: "bg-red-500/10 text-red-500",
  },
  warning: {
    card: "hover:border-amber-500/40 hover:bg-amber-500/5",
    icon: "bg-amber-500/10 text-amber-500",
  },
  default: {
    card: "hover:border-primary/40 hover:bg-primary/5",
    icon: "bg-primary/10 text-primary",
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (id: string) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      variants={stagger}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      {actions.map((action) => {
        const Icon = ICON_MAP[action.icon] ?? UserPlus;
        const vs = VARIANT_STYLE[action.variant]!;

        return (
          <motion.div
            key={action.id}
            variants={reduced ? undefined : item}
            transition={{ duration: reduced ? 0 : 0.2 }}
            whileHover={reduced ? undefined : { y: -4, transition: { duration: 0.15 } }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
          >
            <Card
              className={cn(
                "cursor-pointer border transition-all",
                vs.card
              )}
              onClick={() => onAction(action.id)}
            >
              <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    vs.icon
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
