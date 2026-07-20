import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  Copy,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import type { RoleInfo } from "../types";

const RISK_STYLES: Record<string, string> = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-amber-500/10 text-amber-500",
  critical: "bg-red-500/10 text-red-500",
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

interface RoleManagementProps {
  roles: RoleInfo[];
}

export function RoleManagement({ roles }: RoleManagementProps) {
  const reduced = useReducedMotion();
  const [cloneTarget, setCloneTarget] = useState<RoleInfo | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<RoleInfo | null>(null);

  function handleClone() {
    if (!cloneTarget || !cloneName.trim()) return;
    const newRole: RoleInfo = {
      ...cloneTarget,
      id: `${cloneTarget.id}_copy` as RoleInfo["id"],
      name: cloneName.trim(),
      userCount: 0,
    };
    console.log("Cloned role:", newRole);
    setCloneTarget(null);
    setCloneName("");
  }

  function handleDelete(role: RoleInfo) {
    console.log("Deleted role:", role.id);
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-4">
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={stagger}
        initial={reduced ? false : "hidden"}
        animate="visible"
      >
        {roles.map((role) => (
          <motion.div
            key={role.id}
            variants={reduced ? undefined : cardVariant}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            <Card
              className={cn(
                "relative overflow-hidden border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              )}
              style={{ borderLeftColor: role.color }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{role.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      RISK_STYLES[role.riskLevel]
                    )}
                  >
                    {role.riskLevel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 3).map((p) => (
                    <Badge key={p} variant="outline" size="sm">
                      {p}
                    </Badge>
                  ))}
                  {role.permissions.length > 3 && (
                    <Badge variant="neutral" size="sm">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCloneTarget(role);
                      setCloneName(`${role.name} (Copy)`);
                    }}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" /> Clone
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => alert(`Edit ${role.name}`)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setConfirmDelete(role)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Clone Modal */}
      {cloneTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div
            initial={reduced ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-xl bg-elevated border border-border shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Clone Role</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setCloneTarget(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">New Role Name</label>
              <Input
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCloneTarget(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleClone} disabled={!cloneName.trim()}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div
            initial={reduced ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-xl bg-elevated border border-border shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete Role</h3>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{confirmDelete.name}</strong>?
              {confirmDelete.userCount > 0 && (
                <span className="mt-1 block text-amber-500">
                  {confirmDelete.userCount} user(s) are currently assigned to this role.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(confirmDelete)}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {roles.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No roles configured.
        </p>
      )}
    </div>
  );
}
