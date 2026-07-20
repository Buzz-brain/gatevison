import { useState } from "react";
import { motion } from "framer-motion";
import { User, Fingerprint, Car, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { GATES, DEPARTMENTS, type DriverWizardData } from "../types";
import type { VehicleProfile, AccessPolicy } from "../types";

interface DriverWizardProps {
  onClose: () => void;
  onSubmit: (data: DriverWizardData) => void;
  vehicles: VehicleProfile[];
  policies: AccessPolicy[];
}

const STEPS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "face", label: "Face", icon: Fingerprint },
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "policy", label: "Policy", icon: ShieldCheck },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

const empty: DriverWizardData = {
  name: "", employeeId: "", department: "", email: "", phone: "", role: "",
  faceCaptured: false, vehicleIds: [], policyId: "", workingHours: "09:00 - 17:00",
  allowedGates: [], securityLevel: "standard", emergencyAccess: false,
};

function DriverWizard({ onClose, onSubmit, vehicles, policies }: DriverWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<DriverWizardData>(empty);
  const [done, setDone] = useState(false);
  const prefersReduced = useReducedMotion();

  const set = <K extends keyof DriverWizardData>(key: K, value: DriverWizardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const toggleVehicle = (id: string) =>
    set("vehicleIds", data.vehicleIds.includes(id) ? data.vehicleIds.filter((v) => v !== id) : [...data.vehicleIds, id]);

  const toggleGate = (g: string) =>
    set("allowedGates", data.allowedGates.includes(g) ? data.allowedGates.filter((x) => x !== g) : [...data.allowedGates, g]);

  const canNext =
    step === 0 ? data.name && data.employeeId && data.department :
    step === 1 ? data.faceCaptured :
    step === 3 ? data.policyId && data.allowedGates.length > 0 : true;

  const submit = () => { setDone(true); setTimeout(() => onSubmit(data), 900); };

  return (
    <Dialog open onClose={onClose} className="max-w-xl">
      {done ? (
        <div className="flex flex-col items-center py-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </motion.div>
          <p className="mt-3 text-sm font-medium">Driver Enrolled</p>
          <p className="text-[11px] text-muted-foreground/60">{data.name} &middot; {data.employeeId}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Driver Enrollment</h2>
            <span className="text-[10px] text-muted-foreground/50">Step {step + 1} / {STEPS.length}</span>
          </div>

          <div className="mt-3 flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-1 items-center gap-1">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] transition-colors", i <= step ? "bg-primary text-white" : "bg-surface text-muted-foreground/50")}>
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
                <div><Label>Full Name</Label><Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" /></div>
                <div><Label>Employee ID</Label><Input value={data.employeeId} onChange={(e) => set("employeeId", e.target.value)} placeholder="EMP-0000" /></div>
                <div>
                  <Label>Department</Label>
                  <Select value={data.department} onChange={(e) => set("department", e.target.value)} placeholder="Select" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
                </div>
                <div><Label>Role</Label><Input value={data.role} onChange={(e) => set("role", e.target.value)} placeholder="Engineer" /></div>
                <div><Label>Email</Label><Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@corp.io" /></div>
                <div><Label>Phone</Label><Input value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234" /></div>
              </div>
            )}

            {step === 1 && (
              <Card className="flex flex-col items-center justify-center p-8 text-center">
                <div className={cn("flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed transition-colors", data.faceCaptured ? "border-success bg-success/5" : "border-border")}>
                  {data.faceCaptured ? <CheckCircle2 className="h-10 w-10 text-success" /> : <Camera className="h-8 w-8 text-muted-foreground/50" />}
                </div>
                <p className="mt-3 text-sm font-medium">{data.faceCaptured ? "Face Captured" : "Capture Face Biometric"}</p>
                <p className="text-[11px] text-muted-foreground/60">Simulated capture for demo</p>
                <Button variant={data.faceCaptured ? "outline" : "default"} size="sm" className="mt-3 gap-1.5" onClick={() => set("faceCaptured", !data.faceCaptured)}>
                  <Camera className="h-3.5 w-3.5" /> {data.faceCaptured ? "Retake" : "Capture"}
                </Button>
              </Card>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label>Link Vehicles</Label>
                {vehicles.map((v) => (
                  <button key={v.id} onClick={() => toggleVehicle(v.id)} className={cn("flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors", data.vehicleIds.includes(v.id) ? "border-primary bg-primary/5" : "border-border hover:bg-elevated")}>
                    <div>
                      <p className="font-mono text-xs font-medium">{v.plate}</p>
                      <p className="text-[10px] text-muted-foreground/60">{v.make} {v.model}</p>
                    </div>
                    {data.vehicleIds.includes(v.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <Label>Access Policy</Label>
                  <Select value={data.policyId} onChange={(e) => set("policyId", e.target.value)} placeholder="Select policy" options={policies.map((p) => ({ value: p.id, label: p.name }))} />
                </div>
                <div>
                  <Label>Allowed Gates</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {GATES.map((g) => (
                      <button key={g} onClick={() => toggleGate(g)} className={cn("rounded-full border px-2.5 py-1 text-[11px]", data.allowedGates.includes(g) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground/70 hover:bg-elevated")}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Security Level</Label>
                    <Select value={data.securityLevel} onChange={(e) => set("securityLevel", e.target.value)} options={[{ value: "standard", label: "Standard" }, { value: "elevated", label: "Elevated" }, { value: "vip", label: "VIP" }]} />
                  </div>
                  <div className="flex items-end justify-between rounded-lg border border-border p-3">
                    <span className="text-xs">Emergency Access</span>
                    <Switch checked={data.emergencyAccess} onCheckedChange={(v) => set("emergencyAccess", v)} />
                  </div>
                </div>
                <div><Label>Working Hours</Label><Input value={data.workingHours} onChange={(e) => set("workingHours", e.target.value)} /></div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Review Details</p>
                {[
                  ["Name", data.name], ["Employee ID", data.employeeId], ["Department", data.department],
                  ["Vehicles", data.vehicleIds.length.toString()], ["Policy", policies.find((p) => p.id === data.policyId)?.name ?? "-"],
                  ["Gates", data.allowedGates.join(", ") || "-"], ["Security", data.securityLevel], ["Emergency", data.emergencyAccess ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                    <span className="text-muted-foreground/60">{k}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
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
              <Button size="sm" onClick={submit} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Enroll Driver</Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}

export { DriverWizard };
