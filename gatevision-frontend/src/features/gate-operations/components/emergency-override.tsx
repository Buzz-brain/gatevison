import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";
import type { EmergencyAction, GateInfo } from "../types";
import { emergencyConfig } from "../utils";

interface EmergencyOverrideProps {
  gates: GateInfo[];
  onAction: (action: EmergencyAction, gateId: string) => void;
}

const ACTIONS: EmergencyAction[] = [
  "force_open",
  "lock_gate",
  "fire_mode",
  "maintenance",
  "emergency_vehicle",
];

export function EmergencyOverride({ gates, onAction }: EmergencyOverrideProps) {
  const [selectedGateId, setSelectedGateId] = useState<string>(gates[0]?.id ?? "");
  const [pendingAction, setPendingAction] = useState<EmergencyAction | null>(null);

  const options = gates.map((g) => ({ value: g.id, label: g.name }));
  const pendingConfig = pendingAction ? emergencyConfig[pendingAction] : null;
  const selectedGate = gates.find((g) => g.id === selectedGateId);

  const confirm = () => {
    if (pendingAction) {
      onAction(pendingAction, selectedGateId);
    }
    setPendingAction(null);
  };

  return (
    <Card className="border-danger/30 bg-danger/5 p-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-danger" />
        <h3 className="text-sm font-medium text-danger">Emergency Override</h3>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Select a gate, then choose an emergency action. Confirmation required.
      </p>

      <div className="mt-3">
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
          Target Gate
        </label>
        <Select
          value={selectedGateId}
          onChange={(e) => setSelectedGateId(e.target.value)}
          options={options}
          placeholder="Select gate"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {ACTIONS.map((action) => {
          const cfg = emergencyConfig[action];
          return (
            <Button
              key={action}
              variant={cfg.variant}
              className="justify-start"
              onClick={() => setPendingAction(action)}
            >
              <span className="font-medium">{cfg.label}</span>
              <span className="ml-2 truncate text-xs opacity-80">{cfg.description}</span>
            </Button>
          );
        })}
      </div>

      <Dialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={pendingConfig ? pendingConfig.label : undefined}
      >
        {pendingConfig && (
          <div>
            <p className="text-sm text-muted-foreground">{pendingConfig.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Target gate:{" "}
              <span className="font-mono">
                {selectedGate ? selectedGate.name : selectedGateId || "none"}
              </span>
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirm}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Card>
  );
}
