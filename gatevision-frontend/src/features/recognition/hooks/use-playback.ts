import { useState, useEffect, useCallback, useRef } from "react";
import type { StageState, PlaybackState } from "../types";
import { STAGE_ORDER } from "./use-pipeline";

interface UsePlaybackOptions {
  stages: StageState[];
  onStageChange?: (index: number) => void;
  onComplete?: () => void;
}

interface UsePlaybackReturn {
  playback: PlaybackState;
  setPlaying: (v: boolean) => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  restart: () => void;
  setSpeed: (s: number) => void;
}

function usePlayback(opts: UsePlaybackOptions): UsePlaybackReturn {
  const { stages, onStageChange, onComplete } = opts;
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    isComplete: false,
    currentStageIndex: 0,
    speed: 1,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const advance = useCallback(() => {
    setPlayback((prev) => {
      const next = prev.currentStageIndex + 1;
      if (next >= stages.length) {
        onComplete?.();
        return { ...prev, isPlaying: false, isComplete: true, currentStageIndex: stages.length - 1 };
      }
      onStageChange?.(next);
      return { ...prev, currentStageIndex: next };
    });
  }, [stages.length, onStageChange, onComplete]);

  const togglePlay = useCallback(() => {
    setPlayback((prev) => {
      if (prev.isComplete) {
        onStageChange?.(0);
        return { isPlaying: true, isComplete: false, currentStageIndex: 0, speed: prev.speed };
      }
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  }, [onStageChange]);

  const setPlaying = useCallback((v: boolean) => {
    setPlayback((prev) => {
      if (v && prev.isComplete) {
        onStageChange?.(0);
        return { isPlaying: true, isComplete: false, currentStageIndex: 0, speed: prev.speed };
      }
      return { ...prev, isPlaying: v };
    });
  }, [onStageChange]);

  const stepForward = useCallback(() => {
    setPlayback((prev) => {
      const next = Math.min(prev.currentStageIndex + 1, stages.length - 1);
      onStageChange?.(next);
      const isComplete = next >= stages.length - 1;
      return { ...prev, currentStageIndex: next, isPlaying: false, isComplete };
    });
  }, [stages.length, onStageChange]);

  const stepBack = useCallback(() => {
    setPlayback((prev) => {
      const next = Math.max(prev.currentStageIndex - 1, 0);
      onStageChange?.(next);
      return { ...prev, currentStageIndex: next, isPlaying: false, isComplete: false };
    });
  }, [onStageChange]);

  const restart = useCallback(() => {
    clearTimer();
    onStageChange?.(0);
    setPlayback({ isPlaying: true, isComplete: false, currentStageIndex: 0, speed: playback.speed });
  }, [clearTimer, onStageChange, playback.speed]);

  const setSpeed = useCallback((s: number) => {
    setPlayback((prev) => ({ ...prev, speed: s }));
  }, []);

  useEffect(() => {
    if (!playback.isPlaying || playback.isComplete) return;
    clearTimer();
    const delay = 600 / playback.speed;
    timerRef.current = setTimeout(advance, delay);
    return clearTimer;
  }, [playback.isPlaying, playback.isComplete, playback.currentStageIndex, playback.speed, advance, clearTimer]);

  return { playback, setPlaying, togglePlay, stepForward, stepBack, restart, setSpeed };
}

export { usePlayback };
