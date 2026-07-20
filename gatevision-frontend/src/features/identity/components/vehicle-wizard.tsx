import { useState } from "react";
import { motion } from "framer-motion";
import { Car, Fingerprint, CheckCircle2, ChevronLeft, ChevronRight, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { VehicleWizardData } from "../types";
import type { DriverProfile, AccessPolicy } from "../types";

interface VehicleWizardProps {
  onClose: () => void;
  onSubmit: (data: VehicleWizardData) => void;
  drivers: DriverProfile[];
  policies: AccessPolicy[];
}

const STEPS = [
  { id: "details", label: "Details", icon: Car },
  { id: "fp", label: "Fingerprint", icon: Fingerprint },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

const empty: VehicleWizardData = {
  plate: "", make: "", model: "", year: new Date().getFullYear(), color: "", ownerId: "", fingerprintCaptured: false, policyId: "",
};

function VehicleWizard({ onClose, onSubmit, drivers, policies }: VehicleWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<VehicleWizardData>(empty);
  const [done, setDone] = useState(false);
  const prefersReduced = useReducedMotion();

  const set = <K extends keyof VehicleWizardData>(key: K, value: VehicleWizardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const canNext = step === 0 ? data.plate && data.make && data.model && data.ownerId : step === 1 ? data.fingerprintCaptured : true;

  const submit = () => { setDone(true); setTimeout(() => onSubmit(data), 900); };

  return (
    <Dialog open onClose={onClose} className="max-w-xl">
      {done ? (
        <div className="flex flex-col items-center py-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </motion.div>
          <p className="mt-3 text-sm font-medium">Vehicle Registered</p>
          <p className="font-mono text-[11px] text-muted-foreground/60">{data.plate}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Vehicle Registration</h2>
            <span className="text-[10px] text-muted-foreground/50">Step {step + 1} / {STEPS.length}</span>
          </div>

          <div className="mt-3 flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-1 items-center gap-1">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors", i <= step ? "bg-primary text-white" : "bg-surface text-muted-foreground/50")}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 rounded", i < step ? "bg-primary" : "bg-border")} />}
                </div>
              );
            })}
          </div>

          <div className="mt-4 min-h-[220px]">
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Plate Number</Label><Input value={data.plate} onChange={(e) => set("plate", e.target.value)} placeholder="ABC-123AA" /></div>
                <div>
                  <Label>Owner</Label>
                  <Select value={data.ownerId} onChange={(e) => set("ownerId", e.target.value)} placeholder="Select owner" options={drivers.map((d) => ({ value: d.id, label: d.name }))} />
                </div>
                <div><Label>Make</Label><Input value={data.make} onChange={(e) => set("make", e.target.value)} placeholder="Toyota" /></div>
                <div><Label>Model</Label><Input value={data.model} onChange={(e) => set("model", e.target.value)} placeholder="Camry" /></div>
                <div><Label>Year</Label><Input type="number" value={data.year} onChange={(e) => set("year", Number(e.target.value))} /></div>
                <div><Label>Color</Label><Input value={data.color} onChange={(e) => set("color", e.target.value)} placeholder="White" /></div>
              </div>
            )}

            {step === 1 && (
              <Card className="flex flex-col items-center justify-center p-8 text-center">
                <div className={cn("flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed transition-colors", data.fingerprintCaptured ? "border-success bg-success/5" : "border-border")}>
                  {data.fingerprintCaptured ? <CheckCircle2 className="h-10 w-10 text-success" /> : <ScanLine className="h-8 w-8 text-muted-foreground/50" />}
                </div>
                <p className="mt-3 text-sm font-medium">{data.fingerprintCaptured ? "Fingerprint Captured" : "Capture Vehicle Fingerprint"}</p>
                <p className="text-[11px] text-muted-foreground/60">Visual signature extraction</p>
                <Button variant={data.fingerprintCaptured ? "outline" : "default"} size="sm" className="mt-3 gap-1.5" onClick={() => set("fingerprintCaptured", !data.fingerprintCaptured)}>
                  <ScanLine className="h-3.5 w-3.5" /> {data.fingerprintCaptured ? "Retake" : "Capture"}
                </Button>
              </Card>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Review Details</p>
                {[
                  ["Plate", data.plate], ["Owner", drivers.find((d) => d.id === data.ownerId)?.name ?? "-"],
                  ["Vehicle", `${data.make} ${data.model} ${data.year}`], ["Color", data.color],
                  ["Policy", policies.find((p) => p.id === data.policyId)?.name ?? "Unassigned"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                    <span className="text-muted-foreground/60">{k}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                  <span className="text-muted-foreground/60">Fingerprint</span>
                  <span className="font-medium">{data.fingerprintCaptured ? "Captured" : "Missing"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => (step === 0 ? onClose() : setStep(step - 1))} className="gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext} className="gap-1">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={submit} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Register Vehicle</Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}

export { VehicleWizard };
