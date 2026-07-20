import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Key, Clock, ShieldCheck, Eye, ShieldAlert, ListChecks, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { SecurityConfig } from "../types";

interface SecuritySettingsProps {
  security: SecurityConfig;
  onSetSecurity: (config: SecurityConfig) => void;
}

function SliderControl({ label, value, min, max, step, unit, onChange, color }: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs font-mono font-medium text-muted-foreground">
          {value.toLocaleString()}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface"
        style={{
          background: `linear-gradient(to right, ${color ?? "var(--primary)"} ${pct}%, hsl(var(--surface)) ${pct}%)`,
        }}
      />
    </div>
  );
}

function SwitchRow({ label, description, checked, onChange, icon: Icon, danger }: {
  label: string; description?: string; checked: boolean;
  onChange: (v: boolean) => void; icon?: typeof Lock; danger?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between rounded-lg border p-3",
      danger ? "border-red-500/20 bg-red-500/5" : "border-border bg-surface/30",
    )}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <Icon className={cn("h-4 w-4 shrink-0", danger ? "text-red-400" : "text-muted-foreground")} />
        )}
        <div className="min-w-0">
          <Label className="text-sm">{label}</Label>
          {description && (
            <p className="text-[11px] text-muted-foreground/70 truncate">{description}</p>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SecurityGauge({ score }: { score: number }) {
  const prefersReduced = useReducedMotion();

  const grade = useMemo(() => {
    if (score >= 90) return { label: "EXCELLENT", color: "text-emerald-400", ringColor: "stroke-emerald-500" };
    if (score >= 75) return { label: "GOOD", color: "text-blue-400", ringColor: "stroke-blue-500" };
    if (score >= 50) return { label: "MODERATE", color: "text-amber-400", ringColor: "stroke-amber-500" };
    return { label: "WEAK", color: "text-red-400", ringColor: "stroke-red-500" };
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="none" strokeWidth="8"
            className="stroke-surface"
          />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none" strokeWidth="8"
            strokeLinecap="round"
            className={grade.ringColor}
            initial={prefersReduced ? undefined : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            strokeDasharray={circumference}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold tabular-nums", grade.color)}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge
        variant={score >= 75 ? "success" : score >= 50 ? "warning" : "danger"}
        size="lg"
      >
        {grade.label}
      </Badge>
    </div>
  );
}

function SecuritySettings({ security, onSetSecurity }: SecuritySettingsProps) {
  const prefersReduced = useReducedMotion();

  const update = (partial: Partial<SecurityConfig>) => {
    onSetSecurity({ ...security, ...partial });
  };

  const updatePasswordPolicy = (partial: Partial<SecurityConfig["passwordPolicy"]>) => {
    onSetSecurity({
      ...security,
      passwordPolicy: { ...security.passwordPolicy, ...partial },
    });
  };

  const securityScore = useMemo(() => {
    let score = 0;
    if (security.mfa) score += 20;
    if (security.auditLogging) score += 15;
    if (security.ipRestrictions) score += 10;
    if (security.roleLock) score += 10;
    if (security.sessionTimeout <= 30) score += 10;
    else if (security.sessionTimeout <= 60) score += 5;
    if (security.passwordPolicy.minLength >= 12) score += 8;
    else if (security.passwordPolicy.minLength >= 8) score += 4;
    if (security.passwordPolicy.requireNumbers) score += 4;
    if (security.passwordPolicy.requireSymbols) score += 5;
    if (security.passwordPolicy.requireUppercase) score += 4;
    if (security.jwtExpiry <= 3600) score += 5;
    else if (security.jwtExpiry <= 14400) score += 3;
    if (security.rateLimit <= 200) score += 4;
    else if (security.rateLimit <= 500) score += 2;
    return Math.min(100, score);
  }, [security]);

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <motion.div variants={prefersReduced ? undefined : fadeIn}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Session & Authentication
                </CardTitle>
                <CardDescription>Configure session management and authentication requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <SliderControl
                  label="Session Timeout"
                  value={security.sessionTimeout}
                  min={5}
                  max={120}
                  step={5}
                  unit="min"
                  onChange={(sessionTimeout) => update({ sessionTimeout })}
                  color="#3b82f6"
                />

                <SliderControl
                  label="JWT Token Expiry"
                  value={security.jwtExpiry}
                  min={300}
                  max={86400}
                  step={300}
                  unit="s"
                  onChange={(jwtExpiry) => update({ jwtExpiry })}
                  color="#8b5cf6"
                />

                <SliderControl
                  label="Rate Limit"
                  value={security.rateLimit}
                  min={10}
                  max={1000}
                  step={10}
                  unit="/min"
                  onChange={(rateLimit) => update({ rateLimit })}
                  color="#f59e0b"
                />

                <Separator />

                <SwitchRow
                  label="Multi-Factor Authentication"
                  description="Require MFA for all admin accounts"
                  checked={security.mfa}
                  onChange={(mfa) => update({ mfa })}
                  icon={Key}
                />

                <SwitchRow
                  label="Remember Me"
                  description="Allow persistent login sessions"
                  checked={security.rememberMe}
                  onChange={(rememberMe) => update({ rememberMe })}
                  icon={Clock}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={prefersReduced ? undefined : fadeIn}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Password Policy
                </CardTitle>
                <CardDescription>Enforce password complexity requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <SliderControl
                  label="Minimum Length"
                  value={security.passwordPolicy.minLength}
                  min={6}
                  max={32}
                  step={1}
                  onChange={(minLength) => updatePasswordPolicy({ minLength })}
                  color="#10b981"
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <SwitchRow
                    label="Numbers"
                    checked={security.passwordPolicy.requireNumbers}
                    onChange={(requireNumbers) => updatePasswordPolicy({ requireNumbers })}
                    danger={!security.passwordPolicy.requireNumbers}
                  />
                  <SwitchRow
                    label="Symbols"
                    checked={security.passwordPolicy.requireSymbols}
                    onChange={(requireSymbols) => updatePasswordPolicy({ requireSymbols })}
                    danger={!security.passwordPolicy.requireSymbols}
                  />
                  <SwitchRow
                    label="Uppercase"
                    checked={security.passwordPolicy.requireUppercase}
                    onChange={(requireUppercase) => updatePasswordPolicy({ requireUppercase })}
                    danger={!security.passwordPolicy.requireUppercase}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={prefersReduced ? undefined : fadeIn}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Access Controls
                </CardTitle>
                <CardDescription>Network and role-based security controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SwitchRow
                  label="IP Restrictions"
                  description="Restrict admin access to whitelisted IPs"
                  checked={security.ipRestrictions}
                  onChange={(ipRestrictions) => update({ ipRestrictions })}
                  icon={Eye}
                />

                <SwitchRow
                  label="Role Lock"
                  description="Prevent admins from modifying their own role"
                  checked={security.roleLock}
                  onChange={(roleLock) => update({ roleLock })}
                  icon={ShieldCheck}
                />

                <SwitchRow
                  label="Audit Logging"
                  description="Log all configuration changes and access events"
                  checked={security.auditLogging}
                  onChange={(auditLogging) => update({ auditLogging })}
                  icon={ListChecks}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Score
              </CardTitle>
              <CardDescription>Overall system security posture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SecurityGauge score={securityScore} />

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Breakdown</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Authentication", value: security.mfa ? 20 : 5 },
                    { label: "Audit Trail", value: security.auditLogging ? 15 : 0 },
                    { label: "Network Security", value: security.ipRestrictions ? 10 : 0 },
                    { label: "Role Management", value: security.roleLock ? 10 : 0 },
                    { label: "Session Policy", value: security.sessionTimeout <= 30 ? 10 : 5 },
                    { label: "Password Strength", value: Math.round((security.passwordPolicy.minLength / 16) * 12) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className={cn("text-xs font-mono font-medium", item.value > 0 ? "text-emerald-400" : "text-red-400")}>
                        +{item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {securityScore < 75 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-400/80">
                    {securityScore < 50
                      ? "Security posture is weak. Enable MFA and audit logging to improve."
                      : "Consider enabling IP restrictions for enhanced security."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { SecuritySettings };
