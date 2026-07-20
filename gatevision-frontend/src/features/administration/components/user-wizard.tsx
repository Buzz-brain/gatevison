import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Shield,
  Key,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { ROLE_CONFIG, DEPARTMENT_CONFIG } from "../utils";
import type { DepartmentId, RoleId } from "../types";

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Department", icon: Building2 },
  { label: "Role", icon: Shield },
  { label: "Permissions", icon: Key },
  { label: "Review", icon: ClipboardCheck },
];

const PERMISSIONS = [
  "Users",
  "Recognition",
  "Identity",
  "Reports",
  "Monitoring",
  "Settings",
  "Gate Operations",
];

interface WizardData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: DepartmentId | "";
  role: RoleId | "";
  permissions: string[];
}

const INITIAL: WizardData = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "",
  role: "",
  permissions: [],
};

interface UserWizardProps {
  onClose: () => void;
  onComplete: (data: WizardData) => void;
}

export function UserWizard({ onClose, onComplete }: UserWizardProps) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [done, setDone] = useState(false);

  function update<K extends keyof WizardData>(key: K, val: WizardData[K]) {
    setData((d) => ({ ...d, [key]: val }));
  }

  function togglePermission(p: string) {
    setData((d) => ({
      ...d,
      permissions: d.permissions.includes(p)
        ? d.permissions.filter((x) => x !== p)
        : [...d.permissions, p],
    }));
  }

  function handleSubmit() {
    onComplete(data);
    setDone(true);
    setTimeout(onClose, 1500);
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <motion.div
          initial={reduced ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl bg-elevated p-10 text-center shadow-2xl"
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-xl font-bold text-foreground">User Created</h3>
          <p className="mt-2 text-sm text-muted-foreground">The user has been added successfully.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl rounded-2xl bg-elevated shadow-2xl overflow-hidden"
      >
        {/* Close */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute right-3 top-3 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 px-8 pt-8 pb-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const completed = i < step;
            const current = i === step;
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      completed
                        ? "border-green-500 bg-green-500 text-white"
                        : current
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-muted-foreground"
                    )}
                  >
                    {completed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 text-[10px] font-medium",
                      current ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 mb-5 h-0.5 w-12",
                      i < step ? "bg-green-500" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="min-h-[300px] px-8 py-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={reduced ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                <InputField label="Full Name" value={data.name} onChange={(v) => update("name", v)} placeholder="John Doe" />
                <InputField label="Email" value={data.email} onChange={(v) => update("email", v)} placeholder="john@example.com" type="email" />
                <InputField label="Phone" value={data.phone} onChange={(v) => update("phone", v)} placeholder="+1 (555) 000-0000" />
                <InputField label="Job Title" value={data.jobTitle} onChange={(v) => update("jobTitle", v)} placeholder="Security Analyst" />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="s1"
                initial={reduced ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-foreground">Select Department</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(DEPARTMENT_CONFIG) as [DepartmentId, { label: string; color: string }][]).map(
                    ([id, cfg]) => (
                      <button
                        key={id}
                        onClick={() => update("department", id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                          data.department === id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={reduced ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-foreground">Assign Role</h3>
                <div className="space-y-2">
                  {(Object.entries(ROLE_CONFIG) as [RoleId, { label: string; color: string; riskLevel: string }][]).map(
                    ([id, cfg]) => (
                      <label
                        key={id}
                        className={cn(
                          "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all",
                          data.role === id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={data.role === id}
                          onChange={() => update("role", id)}
                          className="accent-primary"
                        />
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Risk: {cfg.riskLevel}
                          </p>
                        </div>
                      </label>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={reduced ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-foreground">Permissions</h3>
                <div className="space-y-2">
                  {PERMISSIONS.map((p) => (
                    <label
                      key={p}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={data.permissions.includes(p)}
                        onChange={() => togglePermission(p)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-sm text-foreground">{p}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="s4"
                initial={reduced ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-foreground">Review</h3>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <ReviewRow label="Name" value={data.name || "-"} />
                    <ReviewRow label="Email" value={data.email || "-"} />
                    <ReviewRow label="Phone" value={data.phone || "-"} />
                    <ReviewRow label="Job Title" value={data.jobTitle || "-"} />
                    <ReviewRow
                      label="Department"
                      value={data.department ? DEPARTMENT_CONFIG[data.department].label : "-"}
                    />
                    <ReviewRow
                      label="Role"
                      value={data.role ? ROLE_CONFIG[data.role].label : "-"}
                    />
                    <div>
                      <span className="text-xs text-muted-foreground">Permissions</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {data.permissions.length > 0 ? (
                          data.permissions.map((p) => <Badge key={p} variant="info" size="sm">{p}</Badge>)
                        ) : (
                          <span className="text-sm text-muted-foreground">None selected</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-8 py-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Submit</Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
