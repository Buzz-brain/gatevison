import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Eye, Star, Siren, ShieldX, Clock, Truck, UserX, TriangleAlert, Shield, ArrowRight, Play, RotateCcw } from "lucide-react";
import { useDemoStore, getScenarioById } from "@/store/demo-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SCENARIOS } from "../constants";
import type { ScenarioId, Scenario } from "../types";
import { getConfidenceColor, getConfidenceBg, formatMs } from "../utils";

const ICON_MAP: Record<string, typeof Shield> = {
  CheckCircle, XCircle, AlertTriangle, Eye, Star, Siren, ShieldX, Clock, Truck, UserX, TriangleAlert,
};

const OUTCOME_CONFIG = {
  granted: { label: "Granted", color: "text-success", bg: "bg-success/10 border-success/30" },
  denied: { label: "Denied", color: "text-danger", bg: "bg-danger/10 border-danger/30" },
  review: { label: "Review", color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  override: { label: "Override", color: "text-danger", bg: "bg-danger/10 border-danger/30" },
};

function ScenarioCard({ scenario, onSelect }: { scenario: Scenario; onSelect: (id: ScenarioId) => void }) {
  const Icon = ICON_MAP[scenario.icon] ?? Shield;
  const outcome = OUTCOME_CONFIG[scenario.outcome];
  const severityColors: Record<string, string> = {
    safe: "bg-success/20 text-success border-success/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    critical: "bg-danger/20 text-danger border-danger/30",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer"
      onClick={() => onSelect(scenario.id)}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elevated h-full">
        <div className="p-5 flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${outcome.bg}`}>
              <Icon className={`h-5 w-5 ${outcome.color}`} />
            </div>
            <Badge variant={scenario.severity === "critical" ? "danger" : scenario.severity === "warning" ? "warning" : "success"}>
              {scenario.severity}
            </Badge>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{scenario.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{scenario.subtitle}</p>
            <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{scenario.description}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{outcome.label}</span>
            <span className="text-[10px] text-muted-foreground/50">{scenario.steps.length} steps</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ScenarioDetail({ scenarioId }: { scenarioId: ScenarioId }) {
  const { selectScenario, setView } = useDemoStore();
  const scenario = getScenarioById(scenarioId);
  const prefersReduced = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  if (!scenario) return null;

  const outcome = OUTCOME_CONFIG[scenario.outcome];
  const Icon = ICON_MAP[scenario.icon] ?? Shield;
  const totalConfidence = scenario.steps.reduce((sum, s) => sum + (s.confidence ?? 0), 0);
  const avgConfidence = scenario.steps.filter((s) => s.confidence).length > 0
    ? totalConfidence / scenario.steps.filter((s) => s.confidence).length : 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scenarioId}
        initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={() => selectScenario(null)} className="text-muted-foreground hover:text-foreground mt-1">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <div className={`p-3 rounded-2xl ${outcome.bg}`}>
            <Icon className={`h-7 w-7 ${outcome.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{scenario.title}</h2>
              <Badge variant={scenario.severity === "critical" ? "danger" : scenario.severity === "warning" ? "warning" : "success"}>
                {scenario.severity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={outcome.label === "Granted" ? "success" : outcome.label === "Denied" ? "danger" : "warning"}>
                {outcome.label}
              </Badge>
              <span className="text-xs text-muted-foreground/60">{scenario.steps.length} steps · {formatMs(scenario.duration)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps timeline */}
          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Processing Pipeline</h3>
            {scenario.steps.map((step, i) => {
              const statusIcon = step.status === "success" ? CheckCircle
                : (step.status as string) === "fail" || (step.status as string) === "critical" ? XCircle
                : step.status === "warning" ? AlertTriangle
                : Clock;
              const statusColor = step.status === "success" ? "text-success"
                : (step.status as string) === "fail" || (step.status as string) === "critical" ? "text-danger"
                : step.status === "warning" ? "text-warning" : "text-muted-foreground";
              const isActive = i === activeStep;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-transparent hover:bg-elevated"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${statusColor}`}>
                      {statusIcon === CheckCircle ? <CheckCircle className="h-4 w-4" /> :
                       statusIcon === XCircle ? <XCircle className="h-4 w-4" /> :
                       statusIcon === AlertTriangle ? <AlertTriangle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                        {step.confidence != null && (
                          <span className={`text-[10px] font-mono ${getConfidenceColor(step.confidence)}`}>
                            {step.confidence.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-muted-foreground mt-1 leading-relaxed"
                        >
                          {step.narration}
                        </motion.p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50">{formatMs(step.duration)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Evidence + Reasoning */}
          <div className="space-y-4">
            {/* Evidence Panel */}
            <div className="rounded-xl border border-border/50 bg-elevated/50 p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Evidence</h3>
              <div className="space-y-2">
                {scenario.evidence.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{ev.label}</p>
                      <p className="text-[10px] text-muted-foreground/70 truncate">{ev.value}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className={`text-[10px] font-mono ${getConfidenceColor(ev.confidence)}`}>
                        {ev.confidence.toFixed(0)}%
                      </span>
                      <Badge variant={ev.status === "match" ? "success" : ev.status === "mismatch" ? "danger" : "warning"} className="text-[8px] px-1 py-0">
                        {ev.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning Panel */}
            <div className="rounded-xl border border-border/50 bg-elevated/50 p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Reasoning</h3>
              <div className="space-y-2">
                {scenario.reasoning.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5">
                    <div className={`mt-0.5 ${r.passed ? "text-success" : "text-danger"}`}>
                      {r.passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{r.step}</p>
                      <p className="text-[10px] text-muted-foreground/70">{r.detail}</p>
                    </div>
                    <Badge variant={r.passed ? "success" : "danger"} className="text-[8px] px-1 py-0 shrink-0">
                      {r.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Summary */}
            {avgConfidence > 0 && (
              <div className="rounded-xl border border-border/50 bg-elevated/50 p-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Confidence</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${avgConfidence}%` }}
                      className={`h-full rounded-full ${getConfidenceBg(avgConfidence)}`}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className={`text-lg font-bold font-mono ${getConfidenceColor(avgConfidence)}`}>
                    {avgConfidence.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Run this scenario button */}
            <Button className="w-full gap-2" onClick={() => { setView("story"); }}>
              <Play className="h-4 w-4" /> Run Demo
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ScenarioSelector() {
  const { selectedScenario, selectScenario, setView } = useDemoStore();

  if (selectedScenario) {
    return <ScenarioDetail scenarioId={selectedScenario} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Select a scenario to see the full AI processing pipeline, evidence, and reasoning for each access control situation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("auto")}>
            <Play className="h-3.5 w-3.5" /> Auto Demo
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SCENARIOS.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} onSelect={(id) => selectScenario(id)} />
        ))}
      </div>
    </div>
  );
}
