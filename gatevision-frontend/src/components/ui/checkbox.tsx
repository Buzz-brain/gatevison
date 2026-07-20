import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn("inline-flex items-center gap-2 cursor-pointer", className)}
      >
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded border border-border bg-surface transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary" />
          <Check className="absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </div>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
