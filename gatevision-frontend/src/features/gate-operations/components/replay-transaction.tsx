import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReplayFrame } from "../types";

export function ReplayTransaction({
  frames,
  playing,
  index,
  onPlay,
  onPause,
  onRestart,
  onStep,
}: {
  frames: ReplayFrame[];
  playing: boolean;
  index: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  const reduce = useReducedMotion();
  const current = frames[index] ?? frames[0];
  const activeIdx = current ? frames.indexOf(current) : -1;

  return (
    <Card className="p-4 space-y-3">
      <div
        className="relative aspect-video w-full overflow-hidden rounded-lg border border-border"
        style={{ background: "linear-gradient(135deg, #0b1220 0%, #1e293b 100%)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? "none"}
            initial={reduce ? undefined : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
          >
            {current ? (
              <>
                <p className="text-sm font-medium text-foreground">{current.label}</p>
                <p className="mt-1 text-xs text-muted">{current.detail}</p>
                <p className="mt-2 font-mono text-[10px] text-muted">{current.timestamp}</p>
              </>
            ) : (
              <p className="text-sm text-muted">No frames to replay.</p>
            )}
          </motion.div>
        </AnimatePresence>
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" /> REC
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {frames.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onStep(i > index ? 1 : -1)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === activeIdx ? "bg-primary" : i < activeIdx ? "bg-primary/40" : "bg-border"
            }`}
            aria-label={`Frame ${i + 1}: ${f.label}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={onRestart} aria-label="Restart">
          <RotateCcw size={16} />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onStep(-1)} aria-label="Step back">
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="default"
          size="icon-sm"
          onClick={playing ? onPause : onPlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onStep(1)} aria-label="Step forward">
          <ChevronRight size={16} />
        </Button>
      </div>
    </Card>
  );
}
