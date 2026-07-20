import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { fadeIn, slideUp } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={reduced ? fadeIn : slideUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <motion.div
        initial={reduced ? {} : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-elevated border border-border"
      >
        {icon || <Inbox className="h-6 w-6 text-muted-foreground" />}
      </motion.div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {action && <motion.div className="mt-4" whileHover={{ scale: reduced ? 1 : 1.02 }}>{action}</motion.div>}
    </motion.div>
  );
}

export { EmptyState };
