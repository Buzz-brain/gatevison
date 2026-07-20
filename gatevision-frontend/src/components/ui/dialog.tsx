import { forwardRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { modalOverlay, modalContent } from "@/lib/animations";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  showClose = true,
}: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full max-w-lg rounded-xl glass-strong shadow-modal p-6",
              className,
            )}
          >
            {showClose && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute right-4 top-4"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {title && (
              <h2 className="text-lg font-medium">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
            <div className={cn(title || description ? "mt-4" : "")}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { Dialog };
