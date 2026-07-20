import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Eye, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RBACEntry, RoleId, PermissionAction } from "../types";
import { ROLE_CONFIG } from "../utils";

const ALL_ROLES: RoleId[] = ["admin", "security_officer", "supervisor", "auditor", "operator", "viewer"];

const ROLE_RISK_ORDER: { group: string; roles: RoleId[]; color: string }[] = [
  { group: "Critical Risk", roles: ["admin"], color: "#ef4444" },
  { group: "High Risk", roles: ["security_officer"], color: "#f59e0b" },
  { group: "Medium Risk", roles: ["supervisor"], color: "#3b82f6" },
  { group: "Low Risk", roles: ["auditor", "operator", "viewer"], color: "#22c55e" },
];

const CATEGORY_ORDER = [
  { label: "Users", prefix: "users" },
  { label: "Recognition", prefix: "recognition" },
  { label: "Identity", prefix: "identity" },
  { label: "Vehicles", prefix: "vehicles" },
  { label: "Gates", prefix: "gate" },
  { label: "Reports", prefix: "report" },
  { label: "Settings", prefix: "setting" },
  { label: "Audit", prefix: "audit" },
  { label: "Alerts", prefix: "alert" },
  { label: "Other", prefix: "__other__" },
];

const DESCRIPTIONS: Record<string, string> = {
  create: "Can create new records of this type.",
  read: "Can view and read existing records.",
  update: "Can modify and edit existing records.",
  delete: "Can permanently remove records.",
  approve: "Can approve pending requests and changes.",
  audit: "Can view audit logs and compliance data.",
};

function getActionLevel(actions: PermissionAction[]): "full" | "read" | "readonly" | "none" {
  if (actions.length === 0) return "none";
  const hasWrite = actions.includes("create") || actions.includes("update") || actions.includes("delete");
  const hasApprove = actions.includes("approve");
  if (hasWrite || hasApprove) return "full";
  if (actions.includes("read") && actions.includes("audit")) return "readonly";
  if (actions.includes("read")) return "read";
  return "none";
}

function getCellColor(level: string): string {
  switch (level) {
    case "full":
      return "bg-success/15 text-success border-success/30";
    case "read":
      return "bg-primary/15 text-primary border-primary/30";
    case "readonly":
      return "bg-warning/15 text-warning border-warning/30";
    default:
      return "bg-surface text-muted-foreground/40 border-border";
  }
}

function CellIcon({ level }: { level: string }) {
  switch (level) {
    case "full":
      return <Check className="h-4 w-4" />;
    case "read":
      return <Circle className="h-3.5 w-3.5" />;
    case "readonly":
      return <Eye className="h-3.5 w-3.5" />;
    default:
      return <Minus className="h-3.5 w-3.5 opacity-40" />;
  }
}

function categorizePermission(permission: string): string {
  for (const cat of CATEGORY_ORDER) {
    if (cat.prefix === "__other__") return "__other__";
    if (permission.toLowerCase().startsWith(cat.prefix)) return cat.prefix;
  }
  return "__other__";
}

interface CellDetail {
  permission: string;
  role: RoleId;
  actions: PermissionAction[];
  level: string;
}

export function RbacMatrix({ entries }: { entries: RBACEntry[] }) {
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, RBACEntry[]> = {};
    for (const entry of entries) {
      const cat = categorizePermission(entry.permission);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(entry);
    }
    return groups;
  }, [entries]);

  const visibleRoles = useMemo(() => {
    return ALL_ROLES.filter((r) => entries.some((e) => e.roles[r] && e.roles[r].length > 0));
  }, [entries]);

  const maxVisibleRoles = Math.max(visibleRoles.length, 1);

  function handleCellClick(permission: string, role: RoleId, actions: PermissionAction[]) {
    const level = getActionLevel(actions);
    setSelectedCell({ permission, role, actions, level });
  }

  const staggerDelay = reducedMotion ? 0 : 0.04;

  return (
    <div className="flex gap-4" ref={containerRef}>
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Permissions Matrix</CardTitle>
            <p className="text-xs text-muted-foreground">
              Click any cell to view permission details
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 bg-elevated border-b border-border px-4 py-2.5 text-left font-medium text-muted-foreground min-w-[200px]">
                        Permission
                      </th>
                      {ROLE_RISK_ORDER.map((group) =>
                        group.roles
                          .filter((r) => visibleRoles.includes(r))
                          .map((role) => (
                            <th
                              key={role}
                              className="border-b border-border px-3 py-2.5 text-center font-medium min-w-[90px]"
                              style={{ borderBottomColor: group.color }}
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: group.color }}
                                >
                                  {ROLE_CONFIG[role].label}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {group.group}
                                </span>
                              </div>
                            </th>
                          ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORY_ORDER.map((cat) => {
                      const catEntries = groupedEntries[cat.prefix];
                      if (!catEntries || catEntries.length === 0) return null;
                      return (
                        <motion.tbody
                          key={cat.prefix}
                          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <tr>
                            <td
                              colSpan={maxVisibleRoles + 1}
                              className="bg-surface/80 border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {cat.label}
                            </td>
                          </tr>
                          {catEntries.map((entry, rowIdx) => (
                            <motion.tr
                              key={entry.permission}
                              initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.25,
                                delay: rowIdx * staggerDelay,
                              }}
                              className="border-b border-border/50 hover:bg-elevated/50 transition-colors"
                            >
                              <td className="sticky left-0 z-10 bg-elevated/90 backdrop-blur-sm border-r border-border px-4 py-2.5 font-medium text-foreground">
                                {entry.permission}
                              </td>
                              {visibleRoles.map((role) => {
                                const actions = entry.roles[role] ?? [];
                                const level = getActionLevel(actions);
                                const isSelected =
                                  selectedCell?.permission === entry.permission &&
                                  selectedCell?.role === role;
                                return (
                                  <td key={role} className="border-l border-border/50 px-1 py-1">
                                    <button
                                      onClick={() =>
                                        handleCellClick(entry.permission, role, actions)
                                      }
                                      className={cn(
                                        "w-full flex items-center justify-center rounded-md px-2 py-1.5 transition-all duration-150 border",
                                        getCellColor(level),
                                        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                      )}
                                    >
                                      <CellIcon level={level} />
                                    </button>
                                  </td>
                                );
                              })}
                            </motion.tr>
                          ))}
                        </motion.tbody>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20, width: 280 }}
            animate={{ opacity: 1, x: 0, width: 280 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Permission Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSelectedCell(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Permission</p>
                  <p className="text-sm font-medium">{selectedCell.permission}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Role</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      style={{ borderColor: ROLE_CONFIG[selectedCell.role].color, color: ROLE_CONFIG[selectedCell.role].color }}
                    >
                      {ROLE_CONFIG[selectedCell.role].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Level</p>
                  <Badge
                    variant={
                      selectedCell.level === "full"
                        ? "success"
                        : selectedCell.level === "read"
                          ? "info"
                          : selectedCell.level === "readonly"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {selectedCell.level === "full"
                      ? "Full Access"
                      : selectedCell.level === "read"
                        ? "Read"
                        : selectedCell.level === "readonly"
                          ? "Read Only"
                          : "No Access"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Allowed Actions</p>
                  <div className="space-y-2">
                    {(["create", "read", "update", "delete", "approve", "audit"] as PermissionAction[]).map(
                      (action) => {
                        const allowed = selectedCell.actions.includes(action);
                        return (
                          <div
                            key={action}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-xs border",
                              allowed
                                ? "bg-success/10 border-success/20 text-success"
                                : "bg-surface border-border text-muted-foreground/40"
                            )}
                          >
                            {allowed ? (
                              <Check className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <Minus className="h-3 w-3 flex-shrink-0 opacity-40" />
                            )}
                            <span className="font-medium capitalize">{action}</span>
                            <span className="ml-auto opacity-70">{DESCRIPTIONS[action]}</span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
