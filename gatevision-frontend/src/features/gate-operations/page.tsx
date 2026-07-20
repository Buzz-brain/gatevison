import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { useGateOperations } from "./hooks/use-gate-operations";
import { GateOverview } from "./components/gate-overview";
import { CameraWall } from "./components/camera-wall";
import { VehicleQueue } from "./components/vehicle-queue";
import { DecisionConsole } from "./components/decision-console";
import { BarrierAnimation } from "./components/barrier-animation";
import { ManualReviewConsole } from "./components/manual-review";
import { EmergencyOverride } from "./components/emergency-override";
import { SessionMonitor } from "./components/session-monitor";
import { GateHealth } from "./components/gate-health";
import { GateActivityFeed } from "./components/activity-feed";
import { SiteMap } from "./components/site-map";
import { ReplayTransaction } from "./components/replay-transaction";
import { TrafficPlayback } from "./components/traffic-playback";
import { SITE_MAP_NODES, SITE_MAP_EDGES } from "./constants";

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

  const hasData = useMemo(
    () => ops.gates.length > 0 || ops.sessions.length > 0,
    [ops.gates.length, ops.sessions.length],
  );

  if (ops.isError && !hasData) {
    return (
      <div className="space-y-8 pb-12">
        <SectionHeader title="Gate Operations" description="Live gate control room" />
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
        <SectionHeader title="Gate Operations" description="Live gate control room" />
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
    <div className="space-y-8 pb-12">
      <SectionHeader
        title="Gate Operations"
        description="Live gate control room — monitor arrivals, process decisions and manage the facility in real time"
        action={
          <div className="flex items-center gap-2">
            {ops.isError && (
              <button onClick={ops.refetchAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            )}
            <span className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> LIVE
            </span>
          </div>
        }
      />

      {/* 1. Live Gate Overview */}
      <section>
        <SectionTitle hint="Live">Live Gate Overview</SectionTitle>
        <GateOverview gates={ops.gates} selectedGateId={ops.selectedGateId} onSelect={ops.selectGate} />
      </section>

      {/* 2. Gate Camera Wall */}
      <section>
        <SectionTitle hint="Recording">Gate Camera Wall</SectionTitle>
        <CameraWall cameras={ops.cameras} />
      </section>

      {/* Processing + Decisions */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <SectionTitle>Access Decision Console</SectionTitle>
            <DecisionConsole decisionFlow={ops.decisionFlow} onTrigger={ops.triggerDecision} />
          </div>
          <div>
            <SectionTitle>Barrier Animation</SectionTitle>
            <BarrierAnimation barrier={ops.barrier} plate={ops.decisionFlow?.plate} />
          </div>
          <div>
            <SectionTitle>Replay Last Transaction</SectionTitle>
            <ReplayTransaction
              frames={ops.replay.frames}
              playing={ops.replay.playing}
              index={ops.replay.index}
              onPlay={ops.replayPlay}
              onPause={ops.replayPause}
              onRestart={ops.replayRestart}
              onStep={ops.replayStep}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle>Live Vehicle Queue</SectionTitle>
            <VehicleQueue queue={ops.queue} onReorder={ops.reorderQueue} />
          </div>
          <div>
            <SectionTitle>Manual Review Console</SectionTitle>
            <ManualReviewConsole reviews={ops.manualReviews} onResolve={ops.resolveManualReview} />
          </div>
          <div>
            <SectionTitle>Emergency Override</SectionTitle>
            <EmergencyOverride gates={ops.gates} onAction={ops.emergencyAction} />
          </div>
        </div>
      </section>

      {/* Sessions + Health */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>Session Monitor</SectionTitle>
          <SessionMonitor sessions={ops.sessions} />
        </div>
        <div>
          <SectionTitle>Gate Health</SectionTitle>
          <GateHealth gates={ops.gates} />
        </div>
      </section>

      {/* Traffic Playback */}
      <section>
        <SectionTitle hint="Hackathon">Gate Traffic Playback</SectionTitle>
        <TrafficPlayback />
      </section>

      {/* Digital Twin + Activity */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle hint="Digital Twin">Interactive Site Map</SectionTitle>
          <SiteMap
            nodes={SITE_MAP_NODES}
            edges={SITE_MAP_EDGES}
            movingVehicles={ops.movingVehicles}
            gates={ops.gates}
            selectedGateId={ops.selectedGateId}
            onSelectGate={ops.selectGate}
          />
        </div>
        <div>
          <SectionTitle>Live Activity Feed</SectionTitle>
          <GateActivityFeed events={ops.activity} />
        </div>
      </section>
    </div>
  );
}

export { GateOperationsPage };
