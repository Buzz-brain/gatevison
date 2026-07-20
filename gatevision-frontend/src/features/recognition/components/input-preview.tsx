import { useState } from "react";
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DetectionOverlay } from "./detection-overlay";
import type { DetectionOverlay as OverlayType } from "../types";

interface InputPreviewProps {
  overlay: OverlayType | null;
  activeStage?: string;
  imageUrl?: string;
  metadata?: {
    resolution: string;
    fileSize: string;
    captureTime: string;
  };
}

function InputPreview({ overlay, activeStage, imageUrl, metadata }: InputPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMeta, setShowMeta] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleZoom = (delta: number) => {
    setZoom((z) => Math.max(0.5, Math.min(3, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;
    const onMove = (ev: MouseEvent) => {
      setPosition({ x: ev.clientX - startX, y: ev.clientY - startY });
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const reset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-2">
      <div
        className="relative overflow-hidden rounded-lg border border-border"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default" }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.2s",
          }}
        >
          <DetectionOverlay overlay={overlay} activeStage={activeStage} imageUrl={imageUrl} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => handleZoom(-0.25)} aria-label="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-12 text-center text-[10px] font-mono text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-xs" onClick={() => handleZoom(0.25)} aria-label="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={reset} aria-label="Reset view">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" aria-label="Download" onClick={() => {}}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Toggle metadata"
            onClick={() => setShowMeta((s) => !s)}
            className={cn(showMeta && "text-primary")}
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Fullscreen" onClick={() => {}}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      {showMeta && metadata && (
        <div className="rounded-lg border border-border bg-surface p-3 text-xs">
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground/60">Resolution</span>
            <span className="font-mono">{metadata.resolution}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground/60">File Size</span>
            <span className="font-mono">{metadata.fileSize}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground/60">Capture Time</span>
            <span className="font-mono">{metadata.captureTime}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { InputPreview };
