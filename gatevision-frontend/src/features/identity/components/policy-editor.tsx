import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, DoorOpen, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { GATES, type AccessPolicy, type WeeklySchedule } from "../types";

interface PolicyEditorProps {
  policy: AccessPolicy;
  onClose: () => void;
  onSave: (policy: AccessPolicy) => void;
}

const DAYS: (keyof WeeklySchedule)[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function PolicyEditor({ policy, onClose, onSave }: PolicyEditorProps) {
  const [draft, setDraft] = useState<AccessPolicy>(policy);
  const prefersReduced = useReducedMotion();

  useEffect(() => { setDraft(policy); }, [policy]);

  const toggleGate = (gate: string) => {
    setDraft((d) => ({
      ...d,
      allowedGates: d.allowedGates.includes(gate)
        ? d.allowedGates.filter((g) => g !== gate)
        : [...d.allowedGates, gate],
    }));
  };

  const togglePerm = (id: string) => {
    setDraft((d) => ({
      ...d,
      permissions: d.permissions.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p),
    }));
  };

  const toggleDay = (day: keyof WeeklySchedule) => {
    setDraft((d) => ({
      ...d,
      schedule: { ...d.schedule, [day]: d.schedule[day] ? null : { start: "06:00", end: "22:00" } },
    }));
  };

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-medium">{draft.name}</h3>
              <p className="text-[10px] text-muted-foreground/60">Policy Editor</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70">Priority</span>
            <Badge variant="neutral" size="sm">P{String(draft.priority).padStart(2, "0")}</Badge>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium"><DoorOpen className="h-3.5 w-3.5" /> Allowed Gates</p>
            <div className="flex flex-wrap gap-1.5">
              {GATES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGate(g)}
                  className={cn("rounded-full border px-2.5 py-1 text-[11px] transition-colors", draft.allowedGates.includes(g) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground/70 hover:bg-elevated")}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium"><Clock className="h-3.5 w-3.5" /> Weekly Schedule</p>
            <div className="space-y-1">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5">
                  <button onClick={() => toggleDay(day)} className="flex items-center gap-2 text-xs">
                    <span className={cn("h-2 w-2 rounded-full", draft.schedule[day] ? "bg-success" : "bg-border")} />
                    {DAY_LABELS[day]}
                  </button>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {draft.schedule[day] ? `${draft.schedule[day]!.start} – ${draft.schedule[day]!.end}` : "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium">Permissions</p>
            <div className="space-y-1">
              {draft.permissions.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <span className="text-xs">{p.label}</span>
                  <Switch checked={p.enabled} onCheckedChange={() => togglePerm(p.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(draft)} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Policy</Button>
        </div>
      </Card>
    </motion.div>
  );
}

export { PolicyEditor };
