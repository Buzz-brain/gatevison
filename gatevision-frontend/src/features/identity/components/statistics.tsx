import { motion } from "framer-motion";
import { Users, Car, ShieldCheck, UserCheck, ScanLine, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { IdentityStats } from "../types";

interface StatisticsProps {
  stats: IdentityStats;
}

function StatTile({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Users; color: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60">{label}</span>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </Card>
  );
}

function Statistics({ stats }: StatisticsProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Total Drivers" value={String(stats.totalDrivers)} icon={Users} color="text-primary" />
        <StatTile label="Total Vehicles" value={String(stats.totalVehicles)} icon={Car} color="text-success" />
        <StatTile label="Access Policies" value={String(stats.totalPolicies)} icon={ShieldCheck} color="text-warning" />
        <StatTile label="Enrollment Rate" value={`${stats.enrollmentRate.toFixed(0)}%`} icon={UserCheck} color="text-info" />
        <StatTile label="Verification" value={`${stats.verificationSuccess.toFixed(0)}%`} icon={ScanLine} color="text-success" />
        <StatTile label="Recognition Quality" value={`${stats.recognitionQuality.toFixed(0)}%`} icon={Gauge} color="text-primary" />
      </div>
    </motion.div>
  );
}

export { Statistics };
