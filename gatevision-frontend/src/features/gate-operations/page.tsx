import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, Play, CheckCircle2, Loader2 } from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useGateOperations } from "./hooks/use-gate-operations";
import { VehiclesInside } from "./components/vehicles-inside";
import { SessionMonitor } from "./components/session-monitor";

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">{children}</h3>
      {hint && <span className="flex items-center gap-1.5 text-[10px] text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />{hint}</span>}
    </div>
  );
}

function GateOperationsPage() {
  const ops = useGateOperations();
  const addNotification = useUIStore((s) => s.addNotification);

  const [demoRunning, setDemoRunning] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDemo = useCallback(() => {
    if (demoRunning) return;
    setDemoRunning(true);
    setDemoComplete(false);
    ops.triggerDecision();
    exitTimer.current = setTimeout(() => {
      ops.triggerExit();
    }, 7000);
    doneTimer.current = setTimeout(() => {
      setDemoRunning(false);
      setDemoComplete(true);
      addNotification({
        type: "success",
        category: "recognition",
        title: "Demo completed successfully",
        description: "Entry and exit flow simulated end-to-end through the live gate workflow.",
      });
    }, 16000);
  }, [demoRunning, ops, addNotification]);

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);
  }, []);

  const hasData = useMemo(
    () => ops.gates.length > 0 || ops.sessions.length > 0,
    [ops.gates.length, ops.sessions.length],
  );

  if (ops.isError && !hasData) {
    return (
      <div className="space-y-8 pb-12">
        <SectionHeader title="Gate Operations" description="Control vehicle entry and exit" />
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">{ops.errorMessage ?? "Failed to load gate data"}</p>
          <button onClick={ops.refetchAll} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </Card>
      </div>
    );
  }

  if (ops.isLoading && !hasData) {
    return (
      <div className="space-y-8 pb-12">
        <SectionHeader title="Gate Operations" description="Control vehicle entry and exit" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse p-4">
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="h-4 w-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="space-y-6 pb-12">
      <SectionHeader
        title="Gate Operations"
        description="Operator console — live vehicle entry and exit control"
        action={
          <div className="flex items-center gap-2">
            {ops.isError && (
              <button onClick={ops.refetchAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            )}
            {demoRunning ? (
              <span className="flex items-center gap-2 rounded-full bg-info/10 px-3 py-1.5 text-xs font-medium text-info">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Demo Running
              </span>
            ) : demoComplete ? (
              <span className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Demo Completed Successfully
              </span>
            ) : (
              <span className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> LIVE
              </span>
            )}
            <Button size="sm" onClick={runDemo} disabled={demoRunning}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Run Demo
            </Button>
          </div>
        }
      />

      {/* 1. Occupancy */}
      <section>
        <SectionTitle>Occupancy</SectionTitle>
        <VehiclesInside sessions={ops.sessions} />
      </section>

      {/* 2. Active Sessions */}
      <section>
        <SectionTitle>Active Sessions</SectionTitle>
        <SessionMonitor sessions={ops.sessions} />
      </section>
    </PageContainer>
  );
}

export { GateOperationsPage };
