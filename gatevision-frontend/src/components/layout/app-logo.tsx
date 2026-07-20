import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "h-6 w-6", logo: "h-5 w-5", text: "text-sm" },
  md: { icon: "h-8 w-8", logo: "h-4 w-4", text: "text-base" },
  lg: { icon: "h-10 w-10", logo: "h-5 w-5", text: "text-lg" },
};

function AppLogo({ size = "md", showText = true, className }: AppLogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary",
          s.icon,
        )}
      >
        <ShieldCheck className={cn("text-white", s.logo)} />
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight", s.text)}>
          GateVision
        </span>
      )}
    </div>
  );
}

export { AppLogo };
