import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem, fadeIn } from "@/lib/animations";

interface InitStep {
  label: string;
  duration: number;
}

const INIT_STEPS: InitStep[] = [
  { label: "Camera Network Online", duration: 300 },
  { label: "License Plate Detection Ready", duration: 250 },
  { label: "OCR Engine Ready", duration: 200 },
  { label: "Facial Recognition Ready", duration: 300 },
  { label: "Vehicle Fingerprinting Ready", duration: 250 },
  { label: "Decision Engine Ready", duration: 200 },
  { label: "Identity Service Ready", duration: 250 },
  { label: "Gate Control Ready", duration: 300 },
];

function SystemInitSequence() {
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const { setSystemInitComplete } = useAuthStore();
  const prefersReduced = useReducedMotion();

  const advance = useCallback(() => {
    setCompletedSteps((prev) => {
      const next = prev + 1;
      if (next >= INIT_STEPS.length) {
        setTimeout(() => {
          setIsComplete(true);
          setTimeout(() => {
            setSystemInitComplete();
          }, prefersReduced ? 500 : 1200);
        }, 400);
        return INIT_STEPS.length;
      }
      return next;
    });
  }, [setSystemInitComplete, prefersReduced]);

  useEffect(() => {
    if (prefersReduced) {
      setCompletedSteps(INIT_STEPS.length);
      setIsComplete(true);
      setTimeout(() => setSystemInitComplete(), 100);
      return;
    }

    setCompletedSteps(0);
    setIsComplete(false);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 400;

    for (let i = 0; i < INIT_STEPS.length; i++) {
      const step = INIT_STEPS[i];
      if (!step) continue;
      const t = setTimeout(() => {
        advance();
      }, delay);
      timers.push(t);
      delay += step.duration;
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }}
        >
          {/* Logo */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-12 flex flex-col items-center"
          >
            <motion.div
              variants={staggerItem}
              className="relative mb-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <svg
                  viewBox="0 0 40 40"
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 4L4 12v6c0 10 6.5 18.5 16 22 9.5-3.5 16-12 16-22v-6L20 4z" />
                  <path d="M20 16v8" />
                  <circle cx="20" cy="12" r="1.5" />
                </svg>
              </div>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-xl font-semibold tracking-tight"
            >
              GateVision AI
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-1 text-sm text-muted-foreground"
            >
              Initializing Security Operations Center
            </motion.p>
          </motion.div>

          {/* Progress steps */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-sm space-y-2.5"
          >
            {INIT_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {i < completedSteps ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : i === completedSteps ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-border" />
                  )}
                </div>
                <span
                  className={`text-sm transition-colors duration-200 ${
                    i < completedSteps
                      ? "text-foreground"
                      : i === completedSteps
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Progress bar */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-10 h-1 w-64 overflow-hidden rounded-full bg-border"
          >
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{
                width: `${(completedSteps / INIT_STEPS.length) * 100}%`,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </motion.div>

          {/* Ready message */}
          <AnimatePresence>
            {completedSteps === INIT_STEPS.length && (
              <motion.p
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-6 text-sm font-medium text-success"
              >
                Security Operations Center Ready
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { SystemInitSequence };
