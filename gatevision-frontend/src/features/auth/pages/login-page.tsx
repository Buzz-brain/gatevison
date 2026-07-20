import { motion } from "framer-motion";
import { AnimatedBackground } from "../components/animated-background";
import { LoginForm } from "../components/login-form";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { ShieldCheck } from "lucide-react";

const TECH_STACK = [
  "YOLO •",
  "EasyOCR •",
  "InsightFace •",
  "ResNet50",
];

function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <AnimatedBackground />

      {/* Subtle gradient overlay */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03),transparent_70%)]" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex w-full max-w-sm flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          variants={staggerItem}
          className="mb-4 flex flex-col items-center"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <svg
              viewBox="0 0 40 40"
              className="h-7 w-7 text-white"
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
          <h1 className="text-xl font-semibold tracking-tight">GateVision</h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={staggerItem}
          className="mb-8 text-center text-sm text-muted-foreground"
        >
          AI Vehicle Access Control Platform
        </motion.p>

        {/* Subtitle */}
        <motion.p
          variants={staggerItem}
          className="mb-8 text-center text-xs text-muted-foreground/60 italic"
        >
          Secure access to your Security Operations Center
        </motion.p>

        {/* Login card */}
        <motion.div
          variants={scaleIn}
          className="w-full rounded-2xl border border-border/60 bg-elevated/80 backdrop-blur-xl p-8 shadow-2xl"
        >
          <LoginForm />
        </motion.div>

        {/* Tech stack */}
        <motion.p
          variants={staggerItem}
          className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground/30"
        >
          Protected by AI Recognition
        </motion.p>
        <motion.p
          variants={staggerItem}
          className="mt-1 text-center text-[11px] text-muted-foreground/40"
        >
          {TECH_STACK.join(" ")}
        </motion.p>
      </motion.div>
    </div>
  );
}

export { LoginPage };
