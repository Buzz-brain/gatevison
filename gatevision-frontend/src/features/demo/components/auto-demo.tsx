import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, RotateCcw, Camera, ScanLine, FileText, User, Truck, Fingerprint, CheckCircle, Shield, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  { id: "camera", label: "Camera", icon: Camera, color: "text-success", desc: "LPR cameras monitoring all approach lanes" },
  { id: "detection", label: "Detection", icon: ScanLine, color: "text-info", desc: "YOLOv8 detecting vehicles in frame" },
  { id: "ocr", label: "OCR", icon: FileText, color: "text-info", desc: "EasyOCR reading license plate characters" },
  { id: "face", label: "Face", icon: User, color: "text-info", desc: "InsightFace recognizing driver identity" },
  { id: "vehicle", label: "Vehicle", icon: Truck, color: "text-info", desc: "ResNet50 classifying vehicle make/model" },
  { id: "identity", label: "Identity", icon: Fingerprint, color: "text-info", desc: "Cross-referencing against registered profiles" },
  { id: "decision", label: "Decision", icon: CheckCircle, color: "text-warning", desc: "Decision engine evaluating all evidence" },
  { id: "gate", label: "Gate", icon: Shield, color: "text-success", desc: "Gate control executing access verdict" },
];

export function AutoDemo() {
  const { isAutoRunning, autoProgress, setAutoRunning, setAutoProgress, setView } = useDemoStore();
  const prefersReduced = useReducedMotion();
  const [activeStage, setActiveStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [logs, setLogs] = useState<{ text: string; time: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (text: string) => {
    setLogs((prev) => [...prev.slice(-19), { text, time: new Date().toLocaleTimeString() }]);
  };

  const startAuto = () => {
    setAutoRunning(true);
    setActiveStage(0);
    setCompletedStages([]);
    setLogs([]);
    setAutoProgress(0);
  };

  const stopAuto = () => {
    setAutoRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!isAutoRunning) return;
    if (activeStage >= STAGES.length) {
      setAutoRunning(false);
      setAutoProgress(100);
      setCompletedStages(Array.from({ length: STAGES.length }, (_, i) => i));
      addLog("Auto Demo complete. All systems demonstrated.");
      return;
    }

    const stage = STAGES[activeStage]!;
    addLog(`[${stage.label}] ${stage.desc}...`);

    const duration = prefersReduced ? 400 : 2000;
    const tick = 50;
    const totalTicks = duration / tick;
    let tickCount = 0;

    intervalRef.current = setInterval(() => {
      tickCount++;
      const pct = (tickCount / totalTicks) * 100;
      setAutoProgress((activeStage / STAGES.length) * 100 + (pct / STAGES.length));
      if (tickCount >= totalTicks) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setCompletedStages((prev) => [...prev, activeStage]);
        setActiveStage((prev) => prev + 1);
      }
    }, tick);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAutoRunning, activeStage, prefersReduced, setAutoProgress]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">One-click full system demonstration. Watch every component of GateVision work in sequence.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isAutoRunning ? (
            <Button onClick={startAuto} className="gap-2" disabled={isAutoRunning}>
              <Play className="h-4 w-4" /> Start Auto Demo
            </Button>
          ) : (
            <Button variant="outline" onClick={stopAuto} className="gap-2">
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => { setAutoRunning(false); setActiveStage(-1); setCompletedStages([]); setLogs([]); setAutoProgress(0); }} disabled={isAutoRunning}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i === activeStage;
          const isDone = completedStages.includes(i);
          return (
            <Card
              key={stage.id}
              className={`p-3 text-center transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-primary shadow-glow-primary scale-105"
                  : isDone
                  ? "border-success/30 bg-success/5"
                  : "opacity-50"
              }`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Icon className={`h-5 w-5 mx-auto ${isDone ? "text-success" : stage.color}`} />
              </motion.div>
              <p className={`text-[10px] font-medium mt-1.5 ${isDone ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {stage.label}
              </p>
              {isDone && <CheckCircle className="h-3 w-3 text-success mx-auto mt-1" />}
            </Card>
          );
        })}
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-info to-success"
          style={{ width: `${autoProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">{Math.round(autoProgress)}% complete</p>

      {/* Live log */}
      <Card className="p-4 max-h-48 overflow-auto">
        <div className="space-y-1">
          {logs.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">Click Start Auto Demo to begin</p>
          )}
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs font-mono"
              >
                <span className="text-muted-foreground/50 shrink-0">[{log.time}]</span>
                <span className="text-foreground/80">{log.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {!isAutoRunning && completedStages.length === STAGES.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 p-6 rounded-xl bg-success/5 border border-success/20"
        >
          <Sparkles className="h-5 w-5 text-success" />
          <span className="text-sm font-medium text-success">Auto Demo Complete - All 8 systems demonstrated successfully</span>
          <Button size="sm" onClick={() => setView("scenarios")} variant="outline">Explore Scenarios</Button>
        </motion.div>
      )}
    </div>
  );
}
