import { cn } from "@/lib/utils";

interface GateVisionLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { container: "h-8 w-8", icon: "h-4 w-4", rounded: "rounded-lg", text: "text-sm" },
  md: { container: "h-10 w-10", icon: "h-5 w-5", rounded: "rounded-xl", text: "text-base" },
  lg: { container: "h-14 w-14", icon: "h-7 w-7", rounded: "rounded-2xl", text: "text-xl" },
};

function GateVisionLogo({ size = "md", showText = true, className }: GateVisionLogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "flex items-center justify-center bg-primary shadow-lg shadow-primary/20",
        s.container,
        s.rounded,
      )}>
        <svg
          viewBox="0 0 40 40"
          className={cn("text-white", s.icon)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Shield outer */}
          <path d="M20 4L4 12v6c0 10 6.5 18.5 16 22 9.5-3.5 16-12 16-22v-6L20 4z" />
          {/* Camera aperture */}
          <circle cx="20" cy="18" r="6" strokeWidth="2" />
          <circle cx="20" cy="18" r="2" strokeWidth="1.5" fill="currentColor" />
          {/* Eye / sensor line */}
          <path d="M20 12V8" strokeWidth="2" />
          <path d="M14 18H10" strokeWidth="1.5" />
          <path d="M30 18H26" strokeWidth="1.5" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-semibold tracking-tight leading-none", s.text)}>
            GateVision
          </span>
          <span className="text-[10px] text-muted-foreground/40 tracking-wider leading-none mt-0.5">
            AI SECURITY OPERATIONS
          </span>
        </div>
      )}
    </div>
  );
}

function LoadingMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
        <svg
          viewBox="0 0 40 40"
          className="h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 4L4 12v6c0 10 6.5 18.5 16 22 9.5-3.5 16-12 16-22v-6L20 4z" />
          <circle cx="20" cy="18" r="6" strokeWidth="2" />
          <circle cx="20" cy="18" r="2" strokeWidth="1.5" fill="currentColor" />
          <path d="M20 12V8" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

export { GateVisionLogo, LoadingMark };
