import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-elevated before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite_linear] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
