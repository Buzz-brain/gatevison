import { useDemoStore } from "@/store/demo-store";
import { DemoHeader } from "./components/demo-header";
import { ScenarioSelector } from "./components/scenario-selector";
import { AutoDemo } from "./components/auto-demo";
import { PresentationDashboard } from "./components/presentation-dashboard";
import { JudgeMode } from "./components/judge-mode";
import { LiveMetricsSimulation } from "./components/live-metrics-simulation";
import { RecognitionPlayback } from "./components/recognition-playback";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Radio } from "lucide-react";

function StoryModeView() {
  const { startDemo, isActive } = useDemoStore();

  if (isActive) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground/50">
        <p>AI Story Mode is running as a fullscreen overlay. Press Exit to return.</p>
      </div>
    );
  }

  return (
    <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
      <div className="p-4 rounded-full bg-primary/10">
        <Radio className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">AI Story Mode</h3>
      <p className="text-muted-foreground max-w-md">Launch the full-screen narrated demonstration that walks through every step of the GateVision AI pipeline.</p>
      <Button size="lg" className="gap-2 mt-2" onClick={startDemo}>
        <Play className="h-5 w-5" /> Launch Story Mode
      </Button>
    </Card>
  );
}

const VIEWS = {
  scenarios: ScenarioSelector,
  auto: AutoDemo,
  presentation: PresentationDashboard,
  judge: JudgeMode,
  metrics: LiveMetricsSimulation,
  story: StoryModeView,
  playback: RecognitionPlayback,
} as const;

function DemoPage() {
  const { activeView } = useDemoStore();
  const ViewComponent = VIEWS[activeView];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <DemoHeader />
      <ViewComponent />
    </div>
  );
}

export { DemoPage };
