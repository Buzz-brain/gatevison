import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, X, FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface UploadZoneProps {
  onFileSelected?: (file: File | null) => void;
  disabled?: boolean;
}

function UploadZone({ onFileSelected, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelected?.(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          isDragging ? "border-primary bg-primary/10 scale-[1.02]" :
          "border-border bg-surface hover:border-primary/40 hover:bg-elevated/30",
          disabled && "pointer-events-none opacity-50",
        )}
        whileHover={prefersReduced ? undefined : { scale: 1.01 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={prefersReduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <img src={preview} alt="Preview" className="max-h-40 rounded-lg" />
              <button
                onClick={(e) => { e.stopPropagation(); setPreview(null); onFileSelected?.(null); }}
                className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white"
                aria-label="Remove preview"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={prefersReduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
                isDragging ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground",
              )}>
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium">
                {isDragging ? "Drop image to analyze" : "Drag & drop vehicle image"}
              </p>
              <p className="text-xs text-muted-foreground/70">
                or click to browse · PNG, JPG up to 10MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick actions */}
      <div>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-1.5"
        >
          <FileImage className="h-3.5 w-3.5" />
          Choose Image
        </Button>
      </div>
    </div>
  );
}

export { UploadZone };
