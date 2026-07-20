import { type ReactNode, useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

interface ThemeProviderProps {
  children: ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
  }, [mode]);

  return <>{children}</>;
}

export { ThemeProvider };
