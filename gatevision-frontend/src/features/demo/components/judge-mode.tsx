import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, CheckCircle, XCircle, AlertTriangle, ChevronRight, Lightbulb, Target, TrendingUp, Shield, Users, Ban, ArrowRight, Eye } from "lucide-react";
import { useDemoStore, getScenarioById } from "@/store/demo-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SCENARIOS } from "../constants";
import type { Scenario } from "../types";
import { getConfidenceColor, getConfidenceBg, formatPercent } from "../utils";

function JudgeView({ scenario }: { scenario: Scenario }) {
  const [expandedReason, setExpandedReason] = useState<number | null>(null);
  const totalConfidence = scenario.reasoning.filter((r) => r.passed).length / scenario.reasoning.length * 100;
  const impactScore = scenario.severity === "critical" ? 92 : scenario.severity === "warning" ? 65 : 15;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Verdict banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`rounded-2xl p-8 text-center border-2 ${
          scenario.outcome === "granted" ? "bg-success/5 border-success/30" :
          scenario.outcome === "denied" ? "bg-danger/5 border-danger/30" :
          "bg-warning/5 border-warning/30"
        }`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          {scenario.outcome === "granted" ? (
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
          ) : scenario.outcome === "denied" ? (
            <XCircle className="h-16 w-16 text-danger mx-auto" />
          ) : (
            <AlertTriangle className="h-16 w-16 text-warning mx-auto" />
          )}
        </motion.div>
        <h2 className="text-4xl font-bold mt-4">ACCESS {scenario.outcome.toUpperCase()}</h2>
        <p className="text-lg text-muted-foreground mt-2">{scenario.title}</p>
        <p className="text-base text-muted-foreground/70 mt-1 max-w-2xl mx-auto">{scenario.description}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Statement */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold">Problem</h3>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">{scenario.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-elevated">
              <p className="text-xs text-muted-foreground">Entity Type</p>
              <p className="text-sm font-medium mt-0.5 capitalize">{scenario.id.replace(/_/g, " ")}</p>
            </div>
            <div className="p-3 rounded-lg bg-elevated">
              <p className="text-xs text-muted-foreground">Risk Level</p>
              <Badge variant={scenario.severity === "critical" ? "danger" : scenario.severity === "warning" ? "warning" : "success"} className="mt-0.5">
                {scenario.severity}
              </Badge>
            </div>
          </div>
        </Card>

        {/* AI Reasoning */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Reasoning</h3>
          </div>
          <div className="space-y-2">
            {scenario.reasoning.map((r, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedReason(expandedReason === i ? null : i)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-elevated transition-colors text-left"
                >
                  <div className={r.passed ? "text-success" : "text-danger"}>
                    {r.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <span className="text-sm flex-1 font-medium">{r.step}</span>
                  <Badge variant={r.passed ? "success" : "danger"} className="text-[9px] px-1.5">{r.result}</Badge>
                  <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expandedReason === i ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {expandedReason === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-muted-foreground/70 pl-8 pr-2 pb-2"
                    >
                      {r.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Card>

        {/* Evidence */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-info" />
            <h3 className="text-lg font-semibold">Evidence</h3>
          </div>
          <div className="space-y-3">
            {scenario.evidence.map((ev, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-elevated/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    ev.status === "match" ? "bg-success" :
                    ev.status === "mismatch" ? "bg-danger" :
                    "bg-warning"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{ev.label}</p>
                    <p className="text-[10px] text-muted-foreground/70 truncate max-w-[200px]">{ev.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[11px] font-mono ${getConfidenceColor(ev.confidence)}`}>
                    {ev.confidence.toFixed(0)}%
                  </span>
                  <Badge variant={ev.status === "match" ? "success" : ev.status === "mismatch" ? "danger" : "warning"} className="text-[8px] px-1">
                    {ev.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Business Impact */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-danger" />
            <h3 className="text-lg font-semibold">Business Impact</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Security Risk Score</span>
                <span className={`font-bold ${impactScore > 70 ? "text-danger" : impactScore > 40 ? "text-warning" : "text-success"}`}>
                  {impactScore}/100
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${impactScore}%` }}
                  className={`h-full rounded-full ${
                    impactScore > 70 ? "bg-danger" : impactScore > 40 ? "bg-warning" : "bg-success"
                  }`}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">AI Confidence</span>
                <span className={`font-bold ${getConfidenceColor(totalConfidence)}`}>{totalConfidence.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalConfidence}%` }}
                  className={`h-full rounded-full ${getConfidenceBg(totalConfidence)}`}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { label: "Manual Review Cost", value: scenario.outcome === "review" ? "High" : "None", color: scenario.outcome === "review" ? "text-warning" : "text-success" },
                { label: "Security Dispatch", value: scenario.severity === "critical" ? "Required" : "Not Required", color: scenario.severity === "critical" ? "text-danger" : "text-success" },
                { label: "Processing Time", value: `${(scenario.duration / 1000).toFixed(0)}s`, color: "text-primary" },
                { label: "System Load", value: scenario.steps.length > 7 ? "High" : "Normal", color: scenario.steps.length > 7 ? "text-warning" : "text-success" },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-elevated/50">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={`text-xs font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

export function JudgeMode() {
  const { selectedScenario } = useDemoStore();
  const [activeScenarioId, setActiveScenarioId] = useState(selectedScenario);

  const scenario = activeScenarioId ? getScenarioById(activeScenarioId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Judge Mode shows the complete AI decision pipeline: problem, reasoning, evidence, confidence, verdict, and business impact.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeScenarioId ?? ""}
            onChange={(e) => setActiveScenarioId(e.target.value as typeof activeScenarioId)}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-foreground"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {scenario ? (
        <JudgeView scenario={scenario} />
      ) : (
        <Card className="p-12 text-center">
          <Scale className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Select a scenario to view the judge's analysis</p>
        </Card>
      )}
    </div>
  );
}
