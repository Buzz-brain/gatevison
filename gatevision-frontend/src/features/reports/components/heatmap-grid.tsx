import { memo, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ChartCard } from "./chart-card";
import { GATE_NAMES, type GateId } from "../types";
import { densityColor, densityLabel, formatHour } from "../utils";
import type { HeatmapCell } from "../types";

interface HeatmapGridProps {
  data: HeatmapCell[];
  isLoading?: boolean;
  isError?: boolean;
}

function HeatmapGridSkeleton() {
  return (
    <ChartCard title="Traffic Heatmap" subtitle="Density by hour and gate">
      <div className="grid gap-1" style={{ gridTemplateColumns: "80px repeat(24, 1fr)" }}>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="contents">
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            {Array.from({ length: 24 }).map((_, col) => (
              <div key={col} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function HeatmapGridError() {
  return (
    <ChartCard title="Traffic Heatmap" subtitle="Density by hour and gate">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load heatmap data.</p>
      </div>
    </ChartCard>
  );
}

function HeatmapGridEmpty() {
  return (
    <ChartCard title="Traffic Heatmap" subtitle="Density by hour and gate">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No heatmap data available.</p>
      </div>
    </ChartCard>
  );
}

interface CellTooltipProps {
  label: string;
  density: number;
  gateName: string;
  hour: number;
}

function CellTooltip({ label, density, gateName, hour }: CellTooltipProps) {
  return (
    <div className="pointer-events-none absolute z-50 rounded-md border border-border bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{gateName}</p>
      <p className="text-muted-foreground">{formatHour(hour)}</p>
      <p className="mt-1 font-medium" style={{ color: densityColor(density) }}>
        {label} ({density.toFixed(0)}%)
      </p>
    </div>
  );
}

interface HeatmapGridInnerProps {
  data: HeatmapCell[];
}

const HeatmapGridInner = memo(function HeatmapGridInner({ data }: HeatmapGridInnerProps) {
  const [hoveredCell, setHoveredCell] = useState<{ gateId: string; hour: number } | null>(null);

  const gateIds = useMemo(() => {
    const unique = new Set<GateId>();
    for (const cell of data) {
      unique.add(cell.gateId);
    }
    return Array.from(unique);
  }, [data]);

  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    for (const cell of data) {
      map.set(`${cell.gateId}-${cell.hour}`, cell);
    }
    return map;
  }, [data]);

  const getCell = (gateId: GateId, hour: number): HeatmapCell | undefined => {
    return cellMap.get(`${gateId}-${hour}`);
  };

  return (
    <ChartCard title="Traffic Heatmap" subtitle="Density by hour and gate">
      <div className="overflow-x-auto">
        <div
          className="gap-px"
          style={{
            display: "grid",
            gridTemplateColumns: `80px repeat(24, minmax(28px, 1fr))`,
            gridTemplateRows: `24px repeat(${gateIds.length}, 32px)`,
          }}
        >
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              className="flex items-center justify-center text-[10px] text-muted-foreground"
            >
              {h.toString().padStart(2, "0")}
            </div>
          ))}

          {gateIds.map((gateId) => (
            <>
              <div
                key={`label-${gateId}`}
                className="flex items-center text-[11px] font-medium text-muted-foreground"
              >
                {GATE_NAMES[gateId] ?? gateId}
              </div>
              {Array.from({ length: 24 }).map((_, h) => {
                const cell = getCell(gateId, h);
                const density = cell?.density ?? 0;
                const isHovered =
                  hoveredCell?.gateId === gateId && hoveredCell?.hour === h;

                return (
                  <div
                    key={`${gateId}-${h}`}
                    className="relative flex items-center justify-center rounded-sm transition-transform"
                    style={{ backgroundColor: densityColor(density) }}
                    onMouseEnter={() => setHoveredCell({ gateId, hour: h })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {isHovered && (
                      <CellTooltip
                        label={densityLabel(density)}
                        density={density}
                        gateName={GATE_NAMES[gateId] ?? gateId}
                        hour={h}
                      />
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-0.5">
          {[0, 25, 50, 75].map((v) => (
            <div
              key={v}
              className="h-3 w-6 rounded-sm"
              style={{ backgroundColor: densityColor(v + 1) }}
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </ChartCard>
  );
});

export function HeatmapGrid({ data, isLoading, isError }: HeatmapGridProps) {
  if (isLoading) return <HeatmapGridSkeleton />;
  if (isError) return <HeatmapGridError />;
  if (!data || data.length === 0) return <HeatmapGridEmpty />;
  return <HeatmapGridInner data={data} />;
}
