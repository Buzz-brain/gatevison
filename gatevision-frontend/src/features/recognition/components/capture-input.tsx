import { useRef } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./upload-zone";
import { InputPreview } from "./input-preview";
import type { DetectionOverlay as OverlayType } from "../types";

interface CaptureInputProps {
  imageUrl?: string | null;
  overlay?: OverlayType | null;
  activeStage?: string;
  metadata?: {
    resolution?: string;
    fileSize?: string;
    captureTime?: string;
  };
  disabled?: boolean;
  readOnly?: boolean;
  onFileSelected?: (file: File | null) => void;
}

function CaptureInput({ imageUrl, overlay, activeStage, metadata, disabled, readOnly, onFileSelected }: CaptureInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(imageUrl);

  if (!hasImage) {
    return <UploadZone onFileSelected={onFileSelected} disabled={disabled} />;
  }

  return (
    <div className="space-y-3">
      <InputPreview
        overlay={overlay ?? null}
        activeStage={activeStage}
        imageUrl={imageUrl ?? undefined}
        metadata={metadata}
      />
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Replace Image
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onFileSelected?.(null)}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelected?.(f);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

export { CaptureInput };
