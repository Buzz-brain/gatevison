import { useState } from "react";
import {
  Activity, Cpu, BrainCircuit, Camera, HardDrive, Terminal, Wrench, Server,
  RefreshCw, AlertOctagon,
} from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSystem } from "./hooks/use-system";
import { SystemHealth } from "./components/system-health";
import { InfrastructureDashboard } from "./components/infrastructure-dashboard";
import { AiModelGrid } from "./components/ai-model-grid";
import { ModelRegistry } from "./components/model-registry";
import { PipelineMonitor } from "./components/pipeline-monitor";
import { PipelineFlowMap } from "./components/pipeline-flow-map";
import { CameraNetwork } from "./components/camera-network";
import { CameraCard } from "./components/camera-card";
import { StorageCenter } from "./components/storage-center";
import { PerformanceCenter } from "./components/performance-center";
import { LogViewer } from "./components/log-viewer";
import { AlertCenter } from "./components/alert-center";
import { ConfigurationTree } from "./components/configuration-tree";
import { BackupCenter } from "./components/backup-center";
import { CleanupCenter } from "./components/cleanup-center";
import { VersionCenter } from "./components/version-center";
import { EventStream } from "./components/event-stream";
import { SecurityHealth } from "./components/security-health";
import { MaintenanceCenter } from "./components/maintenance-center";
import { TopologyMap } from "./components/topology-map";
import { DigitalTwinMonitor } from "./components/digital-twin-monitor";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "infrastructure", label: "Infrastructure", icon: Server },
  { id: "models", label: "Models & Pipeline", icon: BrainCircuit },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "logs", label: "Logs & Alerts", icon: Terminal },
  { id: "configuration", label: "Configuration", icon: Cpu },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

function LoadingSkeleton() {
  return (
    <PageContainer>
      <div className="mb-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
      </div>
      <div className="mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    </PageContainer>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-24">
        <AlertOctagon className="mb-4 h-12 w-12 text-danger" />
        <h2 className="text-lg font-semibold mb-2">Failed to load System Operations Center</h2>
        <p className="text-sm text-muted-foreground mb-6">There was an error fetching system data. Please try again.</p>
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    </PageContainer>
  );
}

function SystemPage() {
  const hook = useSystem();
  const [activeTab, setActiveTab] = useState("overview");

  if (hook.isLoading) return <LoadingSkeleton />;
  if (hook.isError) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <PageContainer>
      <SectionHeader
        title="System Operations Center"
        description="Monitor, manage, and maintain the GateVision AI infrastructure"
      />

      <div className="mb-6">
        <DigitalTwinMonitor
          health={hook.health}
          models={hook.models}
          alerts={hook.alerts}
          isLoading={hook.isLoading}
          isError={hook.isError}
          onRetry={() => window.location.reload()}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} active={activeTab === tab.id}>
              <tab.icon className="mr-1.5 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" active={activeTab === "overview"}>
          <SystemHealth health={hook.health} />
          <div className="mt-6">
            <InfrastructureDashboard metrics={hook.metrics} />
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" active={activeTab === "infrastructure"}>
          <div className="space-y-6">
            <TopologyMap topology={hook.topology} />
            <div className="grid gap-6 lg:grid-cols-2">
              <SecurityHealth security={hook.security} />
              <div className="space-y-6">
                <EventStream events={hook.timeline} />
                <VersionCenter versions={hook.versions} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" active={activeTab === "models"}>
          <div className="space-y-6">
            <AiModelGrid
              models={hook.models}
              selectedModel={hook.selectedModel}
              onSelect={hook.setSelectedModel}
              onReload={hook.reloadModel}
              onUnload={hook.unloadModel}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <PipelineMonitor pipeline={hook.pipeline} />
              <PipelineFlowMap pipeline={hook.pipeline} />
            </div>
            <ModelRegistry models={hook.models} />
          </div>
        </TabsContent>

        <TabsContent value="cameras" active={activeTab === "cameras"}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CameraNetwork
                cameras={hook.cameras}
                onSelect={hook.setSelectedCamera}
                selectedId={hook.selectedCamera?.id}
              />
            </div>
            <div>
              {hook.selectedCamera ? (
                <CameraCard camera={hook.selectedCamera} selected />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  Select a camera to inspect
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="storage" active={activeTab === "storage"}>
          <div className="grid gap-6 lg:grid-cols-2">
            <StorageCenter storage={hook.storage} />
            <PerformanceCenter perf={hook.perf} />
          </div>
        </TabsContent>

        <TabsContent value="logs" active={activeTab === "logs"}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-1">
              <LogViewer
                logs={hook.logs}
                logFollow={hook.logFollow}
                setLogFollow={hook.setLogFollow}
                logLevel={hook.logLevel}
                setLogLevel={(v: string) => hook.setLogLevel(v as any)}
                logSearch={hook.logSearch}
                setLogSearch={hook.setLogSearch}
              />
            </div>
            <div className="lg:col-span-1">
              <AlertCenter
                alerts={hook.alerts}
                alertFilter={hook.alertFilter}
                setAlertFilter={(v: string) => hook.setAlertFilter(v as any)}
                onAcknowledge={hook.acknowledgeAlert}
                onDismiss={hook.dismissAlert}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="configuration" active={activeTab === "configuration"}>
          <div className="grid gap-6 lg:grid-cols-2">
            <ConfigurationTree config={hook.config} />
            <div className="space-y-6">
              <BackupCenter backups={hook.backups} />
              <CleanupCenter cleanup={hook.cleanup} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" active={activeTab === "maintenance"}>
          <div className="space-y-6">
            <MaintenanceCenter />
            <div className="grid gap-6 lg:grid-cols-2">
              <BackupCenter backups={hook.backups} />
              <CleanupCenter cleanup={hook.cleanup} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export { SystemPage };
