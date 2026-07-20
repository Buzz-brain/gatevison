import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";

export const typography = {
  display: "text-3xl font-semibold tracking-tight",
  heading: "text-2xl font-semibold tracking-tight",
  title: "text-lg font-medium",
  body: "text-sm font-normal",
  caption: "text-xs text-muted-foreground",
  label: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
  mono: "font-mono text-sm",
} as const;

export type TypographyVariant = keyof typeof typography;

export function getTypography(variant: TypographyVariant, ...additional: ClassValue[]) {
  return cn(typography[variant], ...additional);
}
