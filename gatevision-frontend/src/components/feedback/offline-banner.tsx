import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={prefersReduced ? {} : { y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReduced ? {} : { y: -40, opacity: 0 }}
          className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warning/10 px-4 py-2 text-sm border-b border-warning/20"
        >
          <WifiOff className="h-4 w-4 text-warning" />
          <span className="text-warning-foreground font-medium">You are offline</span>
          <span className="text-muted-foreground">Some features may be unavailable</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-7 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-1 h-3 w-3" />Retry
          </Button>
        </motion.div>
      )}
      {showReconnected && !isOffline && (
        <motion.div
          initial={prefersReduced ? {} : { y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReduced ? {} : { y: -40, opacity: 0 }}
          className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-success/10 px-4 py-2 text-sm border-b border-success/20"
        >
          <Wifi className="h-4 w-4 text-success" />
          <span className="text-success-foreground font-medium">Back online</span>
          <span className="text-muted-foreground">Connection restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { OfflineBanner };
