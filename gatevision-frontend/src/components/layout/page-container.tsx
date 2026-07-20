import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageTransition, slideUp, staggerContainer, staggerItem } from "@/lib/animations";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

function PageContainer({ children, className }: PageContainerProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("p-6", className)}
    >
      {children}
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className={cn("mb-6 flex items-start justify-between", className)}
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <motion.div className="flex items-center gap-2">{action}</motion.div>}
    </motion.div>
  );
}

export { PageContainer, SectionHeader };
