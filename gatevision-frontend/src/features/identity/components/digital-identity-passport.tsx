import { motion } from "framer-motion";
import { X, Download, ShieldCheck, Car, Fingerprint, QrCode, Sparkles, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { initials, formatDate } from "../utils";
import type { DriverProfile, VehicleProfile, AccessPolicy } from "../types";

interface DigitalIdentityPassportProps {
  driver: DriverProfile;
  vehicles: VehicleProfile[];
  policy?: AccessPolicy;
  onClose: () => void;
}

function QrPattern({ seed }: { seed: string }) {
  const cells: boolean[] = [];
  for (let i = 0; i < 49; i++) {
    cells.push((seed.charCodeAt(i % seed.length) + i * 7) % 3 === 0);
  }
  return (
    <div className="grid grid-cols-7 gap-px rounded-md bg-white/90 p-1.5">
      {cells.map((on, i) => (
        <div key={i} className={cn("h-2.5 w-2.5", on ? "bg-black" : "bg-transparent")} />
      ))}
    </div>
  );
}

function DigitalIdentityPassport({ driver, vehicles, policy, onClose }: DigitalIdentityPassportProps) {
  const prefersReduced = useReducedMotion();
  const verified = driver.status === "verified" && driver.biometrics.faceEnrolled && driver.biometrics.vehicleFingerprintEnrolled;

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={prefersReduced ? undefined : { y: 16 }}
        animate={{ y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1220] via-[#0e1830] to-[#101a36] p-[1px] shadow-2xl"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#0a1020] p-5">
          {/* Watermark */}
          <Sparkles className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-primary/5" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff,#fff 1px,transparent 1px,transparent 8px)" }} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/80">GateVision Passport</span>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white"><X className="h-4 w-4" /></Button>
          </div>

          <div className="relative mt-4 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 rounded-xl border border-white/15">
                <AvatarFallback className={cn("rounded-xl bg-gradient-to-br text-xl text-white", driver.photoColor)}>{initials(driver.name)}</AvatarFallback>
              </Avatar>
              {verified && (
                <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#0a1020] text-success" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{driver.name}</h2>
              <p className="font-mono text-[11px] text-white/50">{driver.employeeId}</p>
              <p className="text-[11px] text-white/60">{driver.department}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={driver.status === "verified" ? "success" : "neutral"} size="sm" className="bg-white/10 text-white">
                  {driver.status.toUpperCase()}
                </Badge>
                <Badge variant="neutral" size="sm" className="bg-white/10 text-white">{driver.accessLevel.split(" — ")[0]}</Badge>
              </div>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/50"><Car className="h-3 w-3" /> Linked Vehicles</p>
              <div className="mt-1 space-y-0.5">
                {vehicles.slice(0, 2).map((v) => (
                  <p key={v.id} className="font-mono text-[11px] text-white/80">{v.plate} <span className="text-white/40">· {v.model}</span></p>
                ))}
                {vehicles.length === 0 && <p className="text-[11px] text-white/40">None</p>}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/50"><ShieldCheck className="h-3 w-3" /> Access Policy</p>
              <p className="mt-1 text-[12px] font-semibold text-white/90">{policy?.name ?? "—"}</p>
              <p className="text-[10px] text-white/50">{policy ? `${policy.allowedGates.length} gates` : "Unassigned"}</p>
            </div>
          </div>

          <div className="relative mt-3 flex items-center justify-between rounded-xl bg-white/5 p-3">
            <div className="flex gap-3">
              <div className="text-center">
                <Fingerprint className={cn("h-4 w-4 mx-auto", driver.biometrics.faceEnrolled ? "text-success" : "text-white/30")} />
                <p className="mt-0.5 text-[8px] text-white/50">FACE</p>
              </div>
              <div className="text-center">
                <Fingerprint className={cn("h-4 w-4 mx-auto", driver.biometrics.vehicleFingerprintEnrolled ? "text-success" : "text-white/30")} />
                <p className="mt-0.5 text-[8px] text-white/50">VCAP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/50">Enrolled</p>
              <p className="text-[11px] font-semibold text-white/80">{formatDate(driver.enrollmentDate)}</p>
            </div>
          </div>

          <div className="relative mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <QrPattern seed={driver.id + driver.employeeId} />
            <div className="flex-1 pl-3">
              <div className="flex items-center gap-1 text-[10px] text-white/60"><QrCode className="h-3 w-3" /> Secure Token</div>
              <p className="mt-1 break-all font-mono text-[9px] text-white/40">{driver.id}-GV-{(driver.employeeId.charCodeAt(0) * 7).toString(16).toUpperCase()}</p>
              <p className="mt-1 text-[8px] text-white/30">Scan at gate terminal to verify identity</p>
            </div>
          </div>

          <motion.button
            whileHover={prefersReduced ? undefined : { scale: 1.02 }}
            onClick={onClose}
            className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-info py-2.5 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" /> Download / Print Passport
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export { DigitalIdentityPassport };
