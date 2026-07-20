import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Search,
  Users,
  ScanEye,
  IdCard,
  BarChart3,
  Activity,
  Settings,
  Shield,
  ArrowUpDown,
  FileSearch,
  Bell,
  Lock,
  Car,
  DoorOpen,
  LayoutDashboard,
  UserCog,
  Camera,
  Database,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { PermissionNode } from "../types";

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  recognition: ScanEye,
  identity: IdCard,
  reports: BarChart3,
  monitoring: Activity,
  settings: Settings,
  admin: Shield,
  gate_ops: ArrowUpDown,
  audit: FileSearch,
  alerts: Bell,
  security: Lock,
  vehicles: Car,
  gates: DoorOpen,
  dashboard: LayoutDashboard,
  roles: UserCog,
  cameras: Camera,
  data: Database,
};

function getNodeIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] ?? Shield;
}

interface TreeNodeProps {
  node: PermissionNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  reducedMotion: boolean;
  index: number;
}

function TreeNode({ node, depth, selectedId, onSelect, searchTerm, reducedMotion, index }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = getNodeIcon(node.icon);

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (node.label.toLowerCase().includes(term)) return true;
    if (hasChildren) {
      return node.children!.some((child) => child.label.toLowerCase().includes(term));
    }
    return false;
  }, [searchTerm, node, hasChildren]);

  if (!matchesSearch) return null;

  return (
    <div>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-150 group",
          isSelected
            ? "bg-primary/15 text-primary border border-primary/30"
            : "hover:bg-elevated text-foreground border border-transparent"
        )}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.id);
        }}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </motion.div>
        ) : (
          <div className="w-3.5" />
        )}
        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm font-medium truncate">{node.label}</span>
        {hasChildren && (
          <Badge variant="neutral" size="sm" className="ml-auto">
            {node.children!.length}
          </Badge>
        )}
      </motion.div>
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children!.map((child, i) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                searchTerm={searchTerm}
                reducedMotion={reducedMotion}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function countNodes(nodes: PermissionNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) count += countNodes(node.children);
  }
  return count;
}

export function PermissionTree({ tree, onSelect }: { tree: PermissionNode[]; onSelect?: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onSelect?.(id);
    },
    [onSelect]
  );

  const totalCount = useMemo(() => countNodes(tree), [tree]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Permission Tree</CardTitle>
          <Badge variant="neutral">{totalCount} permissions</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
          {tree.map((node, i) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              onSelect={handleSelect}
              searchTerm={searchTerm}
              reducedMotion={reducedMotion}
              index={i}
            />
          ))}
          {tree.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No permissions defined.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
