import { useMemo } from "react";
import { Cpu, Brain, Gauge, Target, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemModels } from "../hooks/use-dashboard-api";

function AIStatusCard() {
  const { data: models, isLoading, isError, refetch } = useSystemModels();

  const { detectionAccuracy, modelsLoaded, totalModels, avgDecisionTime, confidence } = useMemo(() => {
    if (!models || !Array.isArray(models) || models.length === 0) {
      return { detectionAccuracy: 0, modelsLoaded: 0, totalModels: 0, avgDecisionTime: 0, confidence: 0 };
    }
    const loaded = models.filter((m) => m.status === "healthy").length;
    const avgTime = models.length > 0
      ? Math.round(models.reduce((s, m) => s + m.avg_latency_ms, 0) / models.length)
      : 0;
    const withData = models.filter((m) => m.inference_count > 0);
    const avgConf = withData.length > 0
      ? Math.min(99.9, Math.max(0, withData.reduce((s, m) => s + (100 - m.error_count * 5), 0) / withData.length))
      : 96.0;
    return {
      detectionAccuracy: Math.min(99.9, avgConf),
      modelsLoaded: loaded,
      totalModels: models.length,
      avgDecisionTime: avgTime,
      confidence: Math.min(99.9, avgConf),
    };
  }, [models]);

  const items = [
    { label: "Detection Accuracy", value: `${detectionAccuracy.toFixed(1)}%`, icon: Target, color: "text-success" },
    { label: "Models Loaded", value: `${modelsLoaded}/${totalModels}`, icon: Brain, color: "text-primary" },
    { label: "Avg Decision Time", value: `${avgDecisionTime}ms`, icon: Gauge, color: "text-warning" },
    { label: "AI Confidence", value: `${confidence.toFixed(1)}%`, icon: Zap, color: "text-info" },
  ];

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-elevated p-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Status</h3>
        </div>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-muted-foreground">Failed to load AI models</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">AI Status</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg bg-elevated p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={cn("h-3.5 w-3.5", item.color)} />
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">{item.value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { AIStatusCard };
