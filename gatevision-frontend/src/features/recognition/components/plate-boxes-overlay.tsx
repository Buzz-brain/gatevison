import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiPlateBox } from "../types/api";

interface Props {
  imageUrl: string;
  plates: ApiPlateBox[];
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
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }
  const scale = Math.max(containerWidth / imageWidth, containerHeight / imageHeight);
  const w = imageWidth * scale;
  const h = imageHeight * scale;
  return { scale, ox: (containerWidth - w) / 2, oy: (containerHeight - h) / 2 };
}

function toneColor(status: string): string {
  if (status === "valid") return "rgba(34,197,94,0.95)";
  if (status === "invalid") return "rgba(239,68,68,0.95)";
  return "rgba(245,158,11,0.95)";
}

export function PlateBoxesOverlay({ imageUrl, plates }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    boxRef.current = node;
    if (node) {
      const measure = () => {
        const r = node.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setBox((prev) => (prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }));
        }
      };
      measure();
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
      ro?.observe(node);
      requestAnimationFrame(measure);
    }
  }, []);

  const visible = plates.filter((p) => Array.isArray(p.bbox) && p.bbox.length >= 4);
  const map = objectCoverMap(box.w, box.h, imgDims?.w ?? 0, imgDims?.h ?? 0);
  const showDraw = Boolean(map && box.w > 0 && visible.length > 0);

  return (
    <div ref={setRef} className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {showDraw &&
        map &&
        visible.map((p, i) => {
          const [rx1, ry1, rx2, ry2] = p.bbox;
          const x1 = rx1! * map.scale + map.ox;
          const y1 = ry1! * map.scale + map.oy;
          const x2 = rx2! * map.scale + map.ox;
          const y2 = ry2! * map.scale + map.oy;
          const color = toneColor(p.validation_status);
          const w = Math.max(0, x2 - x1);
          const h = Math.max(0, y2 - y1);
          return (
            <div key={i}>
              <div
                className="absolute rounded-md"
                style={{
                  left: x1,
                  top: y1,
                  width: w,
                  height: h,
                  border: `3px solid ${color}`,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                  background: "rgba(59,130,246,0.08)",
                }}
              />
              <div
                className="absolute flex -translate-y-full flex-col gap-0.5 whitespace-nowrap"
                style={{ left: x1, top: Math.max(0, y1 - 4) }}
              >
                <div className="rounded bg-black/85 px-2 py-0.5 text-[11px] font-bold leading-tight text-white backdrop-blur-sm">
                  {p.plate || "Plate"} · OCR {Math.round(p.confidence * 100)}%
                </div>
                {typeof p.detection_confidence === "number" && p.detection_confidence > 0 && (
                  <div className="rounded bg-black/85 px-2 py-0.5 text-[10px] font-semibold leading-tight text-white/80 backdrop-blur-sm">
                    YOLO {Math.round(p.detection_confidence * 100)}% · {p.validation_status}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
