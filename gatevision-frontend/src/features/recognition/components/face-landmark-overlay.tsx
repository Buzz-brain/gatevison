import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LandmarkData } from "../utils/face-coaching";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Props {
  data: LandmarkData;
  imageWidth: number;
  imageHeight: number;
  coaching?: {
    text: string;
    tone: "good" | "adjust" | "low";
    score: number;
  };
}

interface MapCtx {
  scale: number;
  ox: number;
  oy: number;
}

function objectCoverMap(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): MapCtx | null {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }
  const scale = Math.max(containerWidth / imageWidth, containerHeight / imageHeight);
  const w = imageWidth * scale;
  const h = imageHeight * scale;
  return {
    scale,
    ox: (containerWidth - w) / 2,
    oy: (containerHeight - h) / 2,
  };
}

const LANDMARK_LABELS = ["Left Eye", "Right Eye", "Nose", "Mouth", "Mouth"];

export function FaceLandmarkOverlay({ data, imageWidth, imageHeight, coaching }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const prefersReduced = useReducedMotion();

  const setRef = useCallback((node: HTMLDivElement | null) => {
    boxRef.current = node;
    if (node) {
      const measure = () => {
        const r = node.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setBox((prev) =>
            prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height },
          );
        }
      };
      measure();
      const ro =
        typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
      ro?.observe(node);
      requestAnimationFrame(measure);
    }
  }, []);

  const map = objectCoverMap(box.w, box.h, imageWidth, imageHeight);
  const showDraw = Boolean(map && box.w > 0);

  const bbox = (() => {
    if (!map || !Array.isArray(data.bbox) || data.bbox.length < 4) return null;
    const [x1, y1, x2, y2] = data.bbox;
    return {
      x1: x1! * map.scale + map.ox,
      y1: y1! * map.scale + map.oy,
      x2: x2! * map.scale + map.ox,
      y2: y2! * map.scale + map.oy,
    };
  })();

  const pts = (() => {
    if (!map) return null;
    return data.landmarks.map(([x, y]) => ({
      x: x! * map.scale + map.ox,
      y: y! * map.scale + map.oy,
    }));
  })();

  const tone = coaching?.tone ?? "adjust";
  const borderColor =
    tone === "good"
      ? "rgba(34,197,94,0.95)"
      : tone === "low"
        ? "rgba(239,68,68,0.95)"
        : "rgba(245,158,11,0.95)";
  const statusColor =
    tone === "good" ? "text-success" : tone === "low" ? "text-danger" : "text-warning";
  const boxW = bbox ? Math.max(0, bbox.x2 - bbox.x1) : 0;
  const dotR = Math.max(4, Math.min(8, boxW / 12));

  return (
    <div
      ref={setRef}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {showDraw && bbox && pts && pts.length >= 5 && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
        >
          <rect
            x={bbox.x1}
            y={bbox.y1}
            width={boxW}
            height={Math.max(0, bbox.y2 - bbox.y1)}
            fill="rgba(59,130,246,0.08)"
            stroke="#fff"
            strokeWidth={3}
            strokeDasharray="10 6"
            rx={12}
          />
          <rect
            x={bbox.x1}
            y={bbox.y1}
            width={boxW}
            height={Math.max(0, bbox.y2 - bbox.y1)}
            fill="none"
            stroke={borderColor}
            strokeWidth={1.5}
            rx={12}
          />
          <line x1={pts[0]!.x} y1={pts[0]!.y} x2={pts[1]!.x} y2={pts[1]!.y} stroke="#fff" strokeWidth={2} strokeOpacity={0.8} />
          <line x1={pts[0]!.x} y1={pts[0]!.y} x2={pts[2]!.x} y2={pts[2]!.y} stroke="#fff" strokeWidth={1.5} strokeOpacity={0.7} />
          <line x1={pts[1]!.x} y1={pts[1]!.y} x2={pts[2]!.x} y2={pts[2]!.y} stroke="#fff" strokeWidth={1.5} strokeOpacity={0.7} />
          <line x1={pts[2]!.x} y1={pts[2]!.y} x2={pts[3]!.x} y2={pts[3]!.y} stroke="#fff" strokeWidth={1.5} strokeOpacity={0.7} />
          <line x1={pts[2]!.x} y1={pts[2]!.y} x2={pts[4]!.x} y2={pts[4]!.y} stroke="#fff" strokeWidth={1.5} strokeOpacity={0.7} />
          <line x1={pts[3]!.x} y1={pts[3]!.y} x2={pts[4]!.x} y2={pts[4]!.y} stroke="#fff" strokeWidth={2} strokeOpacity={0.8} />
        </svg>
      )}

      {bbox && bbox.x1 !== undefined && (
        <svg
          className="pointer-events-none absolute inset-0 z-10"
          style={{ width: box.w, height: box.h }}
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
        >
          {pts &&
            pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={dotR} fill={borderColor} stroke="#fff" strokeWidth={2} />
              </g>
            ))}
        </svg>
      )}

      {bbox && bbox.y1 !== undefined && (
        <div className="absolute inset-0 z-20">
          {pts &&
            pts.map((p, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: p.x, top: p.y }}
              >
                <div className="absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {LANDMARK_LABELS[i]}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/75 px-3 py-1 backdrop-blur-sm">
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", statusColor)}>
          Face {coaching?.text ?? "Tracking"}
        </span>
        {typeof coaching?.score === "number" && (
          <span className="text-[11px] font-semibold tabular-nums text-white/90">
            {coaching.score}%
          </span>
        )}
        <span
          aria-hidden
          className={cn(
            "h-2 w-2 rounded-full",
            tone === "good" ? "bg-success" : tone === "low" ? "bg-danger" : "bg-warning",
            !prefersReduced && (tone === "adjust" || tone === "low") && "animate-pulse",
          )}
        />
      </div>
    </div>
  );
}
