import { useDemoStore } from "@/store/demo-store";
import type { DemoView } from "../types";
import { VIEW_CONFIG } from "../constants";

const VIEW_ORDER: DemoView[] = ["scenarios", "auto", "presentation", "judge", "metrics", "story", "playback"];

export function DemoHeader() {
  const { activeView, setView, isActive } = useDemoStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demo Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Interactive demonstrations for presentations and evaluations</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {VIEW_ORDER.map((key) => {
          const cfg = VIEW_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeView === key
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-elevated"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
      {isActive && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm text-primary">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          AI Story Mode active
        </div>
      )}
    </div>
  );
}
