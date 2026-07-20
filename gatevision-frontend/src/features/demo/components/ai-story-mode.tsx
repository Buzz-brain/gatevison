import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Camera, Car, ScanLine, FileText, User, Truck,
  Fingerprint, CheckCircle, ArrowRight, Loader2, Play, Pause,
  X, ChevronRight, ChevronLeft, Eye, Radio, Database, LayoutDashboard,
  Sparkles, Monitor,
} from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type IconComponent = typeof ShieldCheck;

const STEP_ICON_MAP: Record<string, IconComponent> = {
  boot: Loader2, camera: Camera, vehicle_arrives: Car, plate_detection: ScanLine,
  ocr: FileText, face_recognition: User, vehicle_fingerprint: Truck,
  identity_verification: Fingerprint, decision_engine: CheckCircle,
  gate_opens: ShieldCheck, vehicle_enters: ArrowRight, dashboard_update: LayoutDashboard,
  reports_update: FileText, admin_notification: ShieldCheck, mission_replay: Play,
  traffic_playback: Eye, complete: CheckCircle,
};

const STEP_COLOR_MAP: Record<string, string> = {
  boot: "text-primary", camera: "text-success", vehicle_arrives: "text-warning",
  plate_detection: "text-info", ocr: "text-info", face_recognition: "text-info",
  vehicle_fingerprint: "text-info", identity_verification: "text-info",
  decision_engine: "text-success", gate_opens: "text-success", vehicle_enters: "text-success",
  dashboard_update: "text-primary", reports_update: "text-primary",
  admin_notification: "text-primary", mission_replay: "text-primary",
  traffic_playback: "text-primary", complete: "text-success",
};

const PARTICLE_COUNT = 30;

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/20"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            opacity: 0,
          }}
          animate={{
            x: [null, Math.random() * 100 + "%"],
            y: [null, Math.random() * 100 + "%"],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function AnimatedGradient({ id }: { id: string }) {
  const gradients: Record<string, string> = {
    boot: "from-primary/10 via-background to-background",
    camera: "from-success/10 via-background to-background",
    vehicle_arrives: "from-warning/5 via-background to-background",
    decision_engine: "from-success/10 via-primary/5 to-background",
    complete: "from-success/10 via-primary/10 to-background",
  };

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`absolute inset-0 bg-gradient-to-br ${gradients[id] ?? "from-primary/5 via-background to-background"}`}
    />
  );
}

function AiStoryMode() {
  const {
    isActive, currentStep, isCompleted, isPaused, steps,
    nextStep, prevStep, stopDemo, setStep, togglePause, resetDemo,
    activeView, setView,
  } = useDemoStore();
  const prefersReduced = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);
  const [visibleParticles, setVisibleParticles] = useState(true);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (!isActive || isCompleted || isPaused || !currentStepData) return;

    const duration = prefersReduced ? 300 : currentStepData.duration;
    const tick = 50;
    const totalTicks = duration / tick;
    let tickCount = 0;

    intervalRef.current = setInterval(() => {
      tickCount++;
      setProgress(Math.min((tickCount / totalTicks) * 100, 100));
      if (tickCount >= totalTicks) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        nextStep();
        setProgress(0);
      }
    }, tick);

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isActive, currentStep, isCompleted, isPaused, prefersReduced, currentStepData, nextStep]);

  useEffect(() => { if (isCompleted || !isActive) setProgress(0); }, [isCompleted, isActive]);

  if (!isActive) return null;

  const IconComponent = STEP_ICON_MAP[currentStepData?.id ?? ""] ?? ShieldCheck;
  const iconColor = STEP_COLOR_MAP[currentStepData?.id ?? ""] ?? "text-primary";
  const isSuccessStep = currentStepData?.id === "decision_engine" || currentStepData?.id === "complete";

  if (isCompleted) {
    return (
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-background/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ParticleField />
        <Card className="max-w-lg p-8 text-center relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20"
          >
            <Sparkles className="h-8 w-8 text-success" />
          </motion.div>
          <h2 className="text-2xl font-bold">Demo Complete</h2>
          <p className="mt-2 text-muted-foreground">
            GateVision AI demonstration completed successfully. All {steps.length} steps executed in sequence.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-background p-3">
              <p className="text-lg font-bold text-success">{steps.length}</p>
              <p className="text-xs text-muted-foreground">Steps</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-lg font-bold text-primary">99.1%</p>
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-lg font-bold text-warning">2.3s</p>
              <p className="text-xs text-muted-foreground">Gate Response</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={resetDemo}>
              <Play className="mr-1 h-4 w-4" /> Replay
            </Button>
            <Button onClick={stopDemo}>
              <X className="mr-1 h-4 w-4" /> Close
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col bg-background/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatedGradient id={currentStepData?.id ?? "boot"} />
      {!prefersReduced && visibleParticles && <ParticleField />}

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-border/50 px-6 py-3 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary">
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold">GateVision AI Demo</span>
            <Badge variant="info" className="ml-2 text-[9px] px-1.5 py-0">Live</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            Step {currentStep + 1}/{steps.length}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => { setVisibleParticles((p) => !p); }}>
            {visibleParticles ? <Eye className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground/40" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={stopDemo}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Progress bar */}
          <div className="flex w-full items-center gap-1">
            {steps.slice(0, -1).map((step, i) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= currentStep ? "bg-primary" : "bg-border/50"
                }`} />
              </div>
            ))}
          </div>

          {/* Icon */}
          <motion.div
            key={currentStep}
            initial={prefersReduced ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
            className={`relative flex h-28 w-28 items-center justify-center rounded-3xl ${
              isSuccessStep ? "bg-success/15" : "bg-elevated/80"
            } border border-border/30`}
          >
            <motion.div
              animate={!prefersReduced ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <IconComponent className={`h-14 w-14 ${iconColor}`} />
            </motion.div>
            {!prefersReduced && (
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-primary/20"
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>

          {/* Label */}
          <motion.h2
            key={`label-${currentStep}`}
            initial={prefersReduced ? {} : { y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold text-center"
          >
            {currentStepData?.label}
          </motion.h2>

          {/* Narration */}
          <motion.div
            key={`narration-${currentStep}`}
            initial={prefersReduced ? {} : { y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: prefersReduced ? 0 : 0.1 }}
            className="max-w-2xl text-center"
          >
            <p className="text-lg leading-relaxed text-muted-foreground">
              {currentStepData?.narration}
            </p>
          </motion.div>

          {/* Confidence */}
          {currentStepData?.confidence != null && (
            <motion.div
              key={`confidence-${currentStep}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="w-full max-w-sm"
            >
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Confidence</span>
                <span className="font-mono font-bold text-success">{currentStepData.confidence}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border/50">
                <motion.div
                  className="h-full rounded-full bg-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentStepData.confidence}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Timer bar */}
          <div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-border/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-info to-success"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="relative flex items-center justify-center gap-4 border-t border-border/50 px-6 py-4 bg-background/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" onClick={prevStep} disabled={currentStep === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant={isPaused ? "default" : "outline"} size="icon-sm" onClick={togglePause}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={nextStep} disabled={currentStep >= steps.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="ml-4 flex gap-1.5">
          {steps.slice(0, 8).map((step, i) => (
            <button
              key={step.id}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep ? "w-6 bg-primary" : "w-2 bg-border/50 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" className="ml-4 text-xs" onClick={stopDemo}>
          Exit
        </Button>
      </div>
    </motion.div>
  );
}

export { AiStoryMode };
