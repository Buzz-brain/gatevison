import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Fingerprint, Car, ShieldCheck, History, IdCard, Mail, Phone,
  Building2, Clock, BadgeCheck, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { statusConfig, policyTypeConfig, initials, formatDate, formatRelative } from "../utils";
import { BiometricPanel } from "./biometric-panel";
import { Timeline } from "./timeline";
import type { DriverProfile, VehicleProfile, AccessPolicy } from "../types";

interface DriverProfileProps {
  driver: DriverProfile;
  vehicles: VehicleProfile[];
  policy?: AccessPolicy;
  onClose: () => void;
  onPassport: (driver: DriverProfile) => void;
}

type Tab = "overview" | "biometrics" | "vehicles" | "access" | "history";

function DriverProfile({ driver, vehicles, policy, onClose, onPassport }: DriverProfileProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const prefersReduced = useReducedMotion();
  const status = statusConfig[driver.status];

  return (
    <Dialog
      open
      onClose={onClose}
      className="max-w-2xl"
      title={undefined}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-xl">
          <AvatarFallback className={cn("rounded-xl bg-gradient-to-br text-lg text-white", driver.photoColor)}>
            {initials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{driver.name}</h2>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground/60">{driver.employeeId}</p>
          <p className="text-xs text-muted-foreground/70">{driver.department} · {driver.role}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => onPassport(driver)}>
          <Download className="h-3.5 w-3.5" /> Passport
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" active={tab === "overview"} className="gap-1"><User className="h-3 w-3" /> Overview</TabsTrigger>
          <TabsTrigger value="biometrics" active={tab === "biometrics"} className="gap-1"><Fingerprint className="h-3 w-3" /> Biometrics</TabsTrigger>
          <TabsTrigger value="vehicles" active={tab === "vehicles"} className="gap-1"><Car className="h-3 w-3" /> Vehicles</TabsTrigger>
          <TabsTrigger value="access" active={tab === "access"} className="gap-1"><ShieldCheck className="h-3 w-3" /> Access</TabsTrigger>
          <TabsTrigger value="history" active={tab === "history"} className="gap-1"><History className="h-3 w-3" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" active={tab === "overview"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><Mail className="h-3 w-3" /> Email</p>
              <p className="text-xs">{driver.email}</p>
            </Card>
            <Card className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><Phone className="h-3 w-3" /> Phone</p>
              <p className="text-xs">{driver.phone}</p>
            </Card>
            <Card className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><Building2 className="h-3 w-3" /> Access Level</p>
              <p className="text-xs">{driver.accessLevel}</p>
            </Card>
            <Card className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><Clock className="h-3 w-3" /> Last Access</p>
              <p className="text-xs">{formatRelative(driver.lastAccess)}</p>
            </Card>
            <Card className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><IdCard className="h-3 w-3" /> Enrolled</p>
              <p className="text-xs">{formatDate(driver.enrollmentDate)}</p>
            </Card>
            <Card className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><BadgeCheck className="h-3 w-3" /> Accuracy</p>
              <p className="text-xs">{driver.recognitionAccuracy.toFixed(1)}%</p>
            </Card>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Card className="p-3 text-center"><p className="text-lg font-semibold">{driver.registeredVehicles.length}</p><p className="text-[10px] text-muted-foreground/60">Vehicles</p></Card>
            <Card className="p-3 text-center"><p className="text-lg font-semibold">{driver.avgVisitsPerWeek}</p><p className="text-[10px] text-muted-foreground/60">Visits/wk</p></Card>
            <Card className="p-3 text-center"><p className="text-lg font-semibold truncate">{driver.mostUsedGate}</p><p className="text-[10px] text-muted-foreground/60">Top Gate</p></Card>
          </div>
        </TabsContent>

        <TabsContent value="biometrics" active={tab === "biometrics"}>
          <BiometricPanel driver={driver} />
        </TabsContent>

        <TabsContent value="vehicles" active={tab === "vehicles"}>
          {vehicles.length === 0 ? (
            <Card className="p-6 text-center text-xs text-muted-foreground/60">No linked vehicles</Card>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <Card key={v.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-mono text-xs font-medium">{v.plate}</p>
                    <p className="text-[10px] text-muted-foreground/60">{v.make} {v.model} · {v.color}</p>
                  </div>
                  <Badge variant={v.status === "active" ? "success" : "neutral"} size="sm">{v.status}</Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access" active={tab === "access"}>
          {policy ? (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn("h-4 w-4", policyTypeConfig[policy.type].color)} />
                <p className="text-sm font-medium">{policy.name}</p>
                <Badge variant="neutral" size="sm">{policyTypeConfig[policy.type].label}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {policy.allowedGates.map((g) => (
                  <span key={g} className="rounded-full bg-surface px-2.5 py-1 text-[11px] text-muted-foreground/70">{g}</span>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-xs text-muted-foreground/60">No access policy assigned</Card>
          )}
        </TabsContent>

        <TabsContent value="history" active={tab === "history"}>
          <Timeline entries={driver.timeline} />
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}

export { DriverProfile };
