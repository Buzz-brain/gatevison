import { useState } from "react";
import { motion } from "framer-motion";
import { Car, User, ShieldCheck, Clock, Fingerprint, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { vehicleStatusConfig, policyTypeConfig, formatDate, formatRelative } from "../utils";
import type { VehicleProfile, DriverProfile } from "../types";

interface VehicleProfileProps {
  vehicle: VehicleProfile;
  owner: DriverProfile | null;
  onClose: () => void;
}

type Tab = "overview" | "biometrics" | "access";

function VehicleProfile({ vehicle, owner, onClose }: VehicleProfileProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const prefersReduced = useReducedMotion();
  const status = vehicleStatusConfig[vehicle.status];

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-xl">
          <AvatarFallback className={cn("rounded-xl bg-gradient-to-br text-white font-mono", vehicle.fingerprintPreviewColor)}>
            {vehicle.plate.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-lg font-semibold">{vehicle.plate}</h2>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground/70">{vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.color}</p>
          <p className="text-[10px] text-muted-foreground/50">Owner: {vehicle.ownerName}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-4">
        <TabsList>
          <TabsTrigger value="overview" active={tab === "overview"} className="gap-1"><Car className="h-3 w-3" /> Overview</TabsTrigger>
          <TabsTrigger value="biometrics" active={tab === "biometrics"} className="gap-1"><Fingerprint className="h-3 w-3" /> Fingerprint</TabsTrigger>
          <TabsTrigger value="access" active={tab === "access"} className="gap-1"><ShieldCheck className="h-3 w-3" /> Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" active={tab === "overview"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><User className="h-3 w-3" /> Owner</p><p className="text-xs">{owner?.name ?? vehicle.ownerName}</p></Card>
            <Card className="p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><Clock className="h-3 w-3" /> Registered</p><p className="text-xs">{formatDate(vehicle.registered)}</p></Card>
            <Card className="p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><Clock className="h-3 w-3" /> Last Seen</p><p className="text-xs">{formatRelative(vehicle.lastSeen)}</p></Card>
            <Card className="p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"><ScanLine className="h-3 w-3" /> Accuracy</p><p className="text-xs">{vehicle.recognitionAccuracy.toFixed(1)}%</p></Card>
            <Card className="p-3"><p className="text-[10px] text-muted-foreground/60">Total Access</p><p className="text-xs">{vehicle.totalAccess}</p></Card>
            <Card className="p-3"><p className="text-[10px] text-muted-foreground/60">Color</p><p className="text-xs">{vehicle.color}</p></Card>
          </div>
        </TabsContent>

        <TabsContent value="biometrics" active={tab === "biometrics"}>
          <Card className="p-4">
            <p className="mb-2 text-xs font-medium">Vehicle Fingerprint</p>
            <div className="flex h-24 items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={prefersReduced ? undefined : { height: 0 }}
                  animate={{ height: `${30 + ((i * 37) % 70)}%` }}
                  transition={{ delay: i * 0.02 }}
                  className="flex-1 rounded-t bg-primary/60"
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/60">Visual signature captured at {formatDate(vehicle.registered)}</p>
          </Card>
        </TabsContent>

        <TabsContent value="access" active={tab === "access"}>
          {vehicle.policies.length === 0 ? (
            <Card className="p-6 text-center text-xs text-muted-foreground/60">No policies linked</Card>
          ) : (
            <div className="space-y-2">
              {vehicle.policies.map((p) => (
                <Card key={p} className="flex items-center gap-2 p-3">
                  <ShieldCheck className="h-4 w-4 text-warning" />
                  <span className="text-xs">{p}</span>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}

export { VehicleProfile };
