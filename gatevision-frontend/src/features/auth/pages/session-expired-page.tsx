import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "../components/animated-background";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";

function SessionExpiredPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <AnimatedBackground />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex max-w-sm flex-col items-center text-center"
      >
        <motion.div
          variants={staggerItem}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10"
        >
          <Clock className="h-8 w-8 text-warning" />
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="text-xl font-semibold"
        >
          Session Expired
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-2 text-sm text-muted-foreground"
        >
          Your session has timed out due to inactivity. Please sign in again to continue.
        </motion.p>

        <motion.div variants={scaleIn} className="mt-8 w-full">
          <Button size="xl" className="w-full text-base" asChild>
            <Link to="/login">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sign In Again
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export { SessionExpiredPage };
