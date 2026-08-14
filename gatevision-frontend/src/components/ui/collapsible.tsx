import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function CollapsibleSection({ title, badge, children, defaultOpen = false, className }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated/60"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
          {title}
          {badge && (
            <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </Card>
  );
}

export { CollapsibleSection };
