import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Building2, MapPin, DoorOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { OrganizationNode } from "../types";

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  warning: "bg-amber-500",
  inactive: "bg-red-500",
};

const NODE_ICON: Record<string, typeof Building2> = {
  department: Building2,
  building: Building2,
  zone: MapPin,
  gate: DoorOpen,
  team: Users,
};

const TYPE_LABEL: Record<string, string> = {
  department: "Department",
  building: "Building",
  zone: "Zone",
  gate: "Gate",
  team: "Team",
};

interface OrgNodeCardProps {
  node: OrganizationNode;
  depth: number;
  reduced: boolean;
}

function OrgNodeCard({ node, depth, reduced }: OrgNodeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const Icon = NODE_ICON[node.type] ?? Building2;

  return (
    <div
      className={cn("relative", depth > 0 && "ml-6 mt-2")}
    >
      {depth > 0 && (
        <svg
          className="absolute -left-5 -top-4 h-4 w-5 text-border"
          viewBox="0 0 20 16"
          fill="none"
        >
          <path
            d="M0 0 L0 12 L14 12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      )}

      <div
        className={cn(
          "group cursor-pointer rounded-lg border border-border transition-colors hover:bg-elevated/50",
          expanded && "bg-elevated/30"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 p-3">
          {hasChildren && (
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
          {!hasChildren && <div className="w-4" />}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{node.label}</p>
              <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[node.status])} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{TYPE_LABEL[node.type]}</span>
              {node.users !== undefined && (
                <>
                  <span className="text-border">|</span>
                  <span>{node.users} users</span>
                </>
              )}
            </div>
          </div>

          {hasChildren && (
            <Badge variant="neutral" size="sm">
              {node.children?.length ?? 0}
            </Badge>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {node.children?.map((child) => (
              <OrgNodeCard
                key={child.id}
                node={child}
                depth={depth + 1}
                reduced={reduced}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface OrganizationChartProps {
  data: OrganizationNode[];
}

export function OrganizationChart({ data }: OrganizationChartProps) {
  const reduced = useReducedMotion();

  return (
    <div className="space-y-2">
      {data.map((node) => (
        <OrgNodeCard
          key={node.id}
          node={node}
          depth={0}
          reduced={reduced}
        />
      ))}
    </div>
  );
}
