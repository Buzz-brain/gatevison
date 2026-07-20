import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, ShieldCheck } from "lucide-react";
import { fadeIn } from "@/lib/animations";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

function LoadingScreen({ message = "Loading...", className }: LoadingScreenProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-32",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute h-10 w-10 animate-ping rounded-full bg-primary/20" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse-soft">{message}</p>
    </motion.div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin text-primary", className)} />
  );
}

export { LoadingScreen, LoadingSpinner };
