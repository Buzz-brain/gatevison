import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-glow-primary active:bg-primary/80",
        destructive:
          "bg-danger text-white shadow-sm hover:bg-danger/90 hover:shadow-glow-danger active:bg-danger/80",
        success:
          "bg-success text-white shadow-sm hover:bg-success/90 hover:shadow-glow-success active:bg-success/80",
        warning: "bg-warning text-white shadow-sm hover:bg-warning/90 active:bg-warning/80",
        outline:
          "border border-border bg-transparent hover:bg-elevated hover:text-foreground hover:border-border-hover active:bg-surface",
        secondary:
          "bg-elevated text-foreground shadow-sm hover:bg-elevated/80 hover:shadow-card-hover active:bg-elevated/60",
        ghost:
          "text-muted-foreground hover:bg-elevated/50 hover:text-foreground active:bg-surface",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-10 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-xs": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
