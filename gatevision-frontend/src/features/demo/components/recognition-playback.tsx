import { useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Rewind, FastForward, Camera, ScanLine, User, Shield, CheckCircle } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getConfidenceColor } from "../utils";

const FRAME_ICONS = {
  capture: Camera,
  plate: ScanLine,
  face: User,
  vehicle: Camera,
  decision: Shield,
  gate: CheckCircle,
};

export function RecognitionPlayback() {
  const { playbackFrames, playbackPosition, isPlaying, playbackSpeed, setPlaybackPosition, setIsPlaying, setPlaybackSpeed } = useDemoStore();
  const prefersReduced = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posRef = useRef(playbackPosition);
  posRef.current = playbackPosition;

  const currentFrame = playbackFrames[playbackPosition]!;
  const totalFrames = playbackFrames.length;

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    const baseInterval = 100;
    const speedMap = [0.25, 0.5, 1, 2, 4];
    const speed = speedMap[playbackSpeed] ?? 1;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = posRef.current + 1;
      setPlaybackPosition(next);
      if (next >= totalFrames) { setIsPlaying(false); }
    }, baseInterval / speed);
  }, [playbackSpeed, totalFrames, setPlaybackPosition, setIsPlaying]);

  useEffect(() => {
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); } };
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, [setIsPlaying]);

  const togglePlay = () => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  };

  const stepFrame = (delta: number) => {
    const next = Math.max(0, Math.min(totalFrames - 1, playbackPosition + delta));
    setPlaybackPosition(next);
    if (isPlaying) stopPlayback();
  };

  const FrameIcon = currentFrame ? (FRAME_ICONS[currentFrame.type] ?? Camera) : Camera;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Timeline-based recognition playback with speed controls, slow motion, and frame stepping.</p>
      </div>

      {/* Frame viewer */}
      <Card className="p-8 flex items-center justify-center min-h-[200px] bg-gradient-to-br from-slate-900/50 via-primary/5 to-slate-900/50">
        {currentFrame ? (
          <motion.div
            key={currentFrame.id}
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <FrameIcon className="h-16 w-16 text-primary mx-auto" />
            <h3 className="text-lg font-medium mt-3">{currentFrame.label}</h3>
            <div className="flex items-center justify-center gap-3 mt-2">
              <Badge variant="outline">{currentFrame.camera}</Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(currentFrame.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
              </span>
              <span className={`text-xs font-mono ${getConfidenceColor(currentFrame.confidence)}`}>
                {currentFrame.confidence.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        ) : (
          <p className="text-muted-foreground/50">No frames available</p>
        )}
      </Card>

      {/* Timeline scrubber */}
      <div className="space-y-2">
        <div className="relative h-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1.5 rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${totalFrames > 0 ? (playbackPosition / (totalFrames - 1)) * 100 : 0}%` }}
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={playbackPosition}
            onChange={(e) => { setPlaybackPosition(Number(e.target.value)); if (isPlaying) stopPlayback(); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Frame position"
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-glow-primary pointer-events-none"
            style={{ left: `${totalFrames > 0 ? (playbackPosition / (totalFrames - 1)) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Frame {playbackPosition + 1} of {totalFrames}</span>
          <span>{new Date(currentFrame?.timestamp ?? "").toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => stepFrame(-10)} disabled={playbackPosition === 0}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => stepFrame(-1)} disabled={playbackPosition === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={isPlaying ? "default" : "outline"}
          size="sm"
          onClick={togglePlay}
          className="gap-1.5 min-w-[80px]"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => stepFrame(1)} disabled={playbackPosition >= totalFrames - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => stepFrame(10)} disabled={playbackPosition >= totalFrames - 1}>
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="ml-4 flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((speed) => {
            const labels = ["0.25x", "0.5x", "1x", "2x", "4x"];
            return (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setPlaybackSpeed(speed)}
                className="text-[10px] min-w-[36px]"
              >
                {labels[speed]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Frame thumbnails */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {playbackFrames.map((frame, i) => {
          const Icon = FRAME_ICONS[frame.type] ?? Camera;
          const isActive = i === playbackPosition;
          return (
            <button
              key={frame.id}
              onClick={() => { setPlaybackPosition(i); if (isPlaying) stopPlayback(); }}
              className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "ring-2 ring-primary bg-primary/10 scale-110"
                  : "bg-elevated hover:bg-elevated/70"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
