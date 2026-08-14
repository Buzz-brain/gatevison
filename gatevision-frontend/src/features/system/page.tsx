import { useState } from "react";
import {
  Activity, BrainCircuit, Cpu,
  RefreshCw, AlertOctagon,
} from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSystem } from "./hooks/use-system";
import { SystemHealth } from "./components/system-health";
import { AiModelGrid } from "./components/ai-model-grid";
import { VersionCenter } from "./components/version-center";

const TABS = [
  { id: "health", label: "Health", icon: Activity },
  { id: "models", label: "Models", icon: BrainCircuit },
  { id: "versions", label: "Versions", icon: Cpu },
];

function LoadingSkeleton() {
  return (
    <PageContainer>
      <div className="mb-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
      </div>
      <div className="mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
  const [activeTab, setActiveTab] = useState("health");

  if (hook.isLoading) return <LoadingSkeleton />;
  if (hook.isError) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <PageContainer>
      <SectionHeader
        title="System Operations Center"
        description="Monitor, manage, and maintain the GateVision AI infrastructure"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} active={activeTab === tab.id}>
              <tab.icon className="mr-1.5 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="health" active={activeTab === "health"}>
          <SystemHealth health={hook.health} />
        </TabsContent>

        <TabsContent value="models" active={activeTab === "models"}>
          <AiModelGrid models={hook.models} />
        </TabsContent>

        <TabsContent value="versions" active={activeTab === "versions"}>
          <VersionCenter versions={hook.versions} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export { SystemPage };
