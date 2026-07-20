import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  className?: string;
}

function FileUpload({
  accept = "image/*",
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  onChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList) => {
    const valid = Array.from(newFiles).filter((f) => f.size <= maxSize);
    const updated = multiple ? [...files, ...valid] : [valid[0]!];
    setFiles(updated.filter(Boolean));
    onChange?.(updated.filter(Boolean));
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange?.(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface p-6 transition-colors hover:border-primary/50",
          dragOver && "border-primary bg-primary/5",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        aria-label="Upload file"
      >
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files here or click to upload
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Max {maxSize / 1024 / 1024}MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-md bg-surface px-3 py-2"
            >
              <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)}KB
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { FileUpload };
