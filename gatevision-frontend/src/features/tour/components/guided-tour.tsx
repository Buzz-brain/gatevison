import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ScanFace, IdCard, Car, BarChart3, ShieldCheck, Monitor, Settings,
  ChevronRight, ChevronLeft, X, SkipForward
} from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TourStep {
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  route: string;
  position: "bottom" | "top" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  { title: "Dashboard", description: "Real-time overview of all security operations, live camera feeds, AI analytics, and system health. Your mission control center.", icon: LayoutDashboard, route: "/", position: "bottom" },
  { title: "Recognition Center", description: "Upload images or feed live camera streams for license plate detection, OCR, facial recognition, and vehicle fingerprinting.", icon: ScanFace, route: "/recognition", position: "bottom" },
  { title: "Identity Management", description: "Manage driver profiles, vehicle registrations, access policies, and identity verification across the entire system.", icon: IdCard, route: "/identity", position: "bottom" },
  { title: "Gate Operations", description: "Monitor active gate sessions, control entry and exit points, view transaction history, and manage traffic flow.", icon: Car, route: "/gate-operations", position: "bottom" },
  { title: "Reports & Analytics", description: "Comprehensive analytics with traffic patterns, decision breakdowns, security insights, and exportable reports.", icon: BarChart3, route: "/reports", position: "bottom" },
  { title: "Administration", description: "Security command center with manual review queue, event monitoring, system health, and user management.", icon: ShieldCheck, route: "/admin", position: "bottom" },
  { title: "System Monitoring", description: "Live system health, AI model status, performance metrics, storage info, and the Digital Twin topology visualizer.", icon: Monitor, route: "/system", position: "bottom" },
  { title: "Settings", description: "Configure every subsystem: AI models, recognition thresholds, cameras, gates, security policies, notifications, and more.", icon: Settings, route: "/settings", position: "top" },
];

function GuidedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const completed = localStorage.getItem("gatevision-tour-completed");
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("gatevision-tour-completed", "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key={currentStep}
          initial={prefersReduced ? {} : { scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={prefersReduced ? {} : { scale: 0.9, opacity: 0, y: -20 }}
          transition={{ duration: prefersReduced ? 0 : 0.2 }}
          className="mx-4 w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge variant="info" className="text-xs">
              Tour {currentStep + 1} of {TOUR_STEPS.length}
            </Badge>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Skip tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Icon + Title */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-xs text-muted-foreground">Navigate to: <code className="font-mono text-primary">{step.route}</code></p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Dots */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === currentStep ? "bg-primary" : "bg-border hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              <SkipForward className="mr-1 h-3 w-3" />Skip
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                  <ChevronLeft className="mr-1 h-3 w-3" />Back
                </Button>
              )}
              {currentStep < TOUR_STEPS.length - 1 ? (
                <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                  Next<ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleComplete}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export { GuidedTour };
