import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlaybackState } from "../types";

interface PlaybackControlsProps {
  playback: PlaybackState;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
}

const speeds = [0.5, 1, 2];

function PlaybackControls({
  playback, onTogglePlay, onStepForward, onStepBack, onRestart, onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-lg bg-elevated/60 p-2 border border-border">
      <Button variant="ghost" size="icon-xs" onClick={onStepBack} aria-label="Step back" disabled={playback.currentStageIndex === 0}>
        <SkipBack className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onRestart} aria-label="Restart">
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={playback.isPlaying ? "secondary" : "default"}
        size="icon-sm"
        onClick={onTogglePlay}
        aria-label={playback.isPlaying ? "Pause" : "Play"}
      >
        {playback.isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onStepForward} aria-label="Step forward" disabled={playback.isComplete}>
        <SkipForward className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <div className="flex items-center gap-0.5">
        <Gauge className="h-3.5 w-3.5 text-muted-foreground/50" />
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors",
              playback.speed === s ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:bg-elevated",
            )}
          >
            ×{s}
          </button>
        ))}
      </div>
    </div>
  );
}

export { PlaybackControls };
