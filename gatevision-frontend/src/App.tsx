import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ErrorBoundary } from "@/components/feedback/error-boundary";
import { ApiErrorBoundary } from "@/components/feedback/api-error-boundary";
import { useAuthStore } from "@/store/auth-store";
import { queryClient } from "@/lib/api/query-client";
import { LoadingMark } from "@/components/brand/logo";

function AuthInit({ children }: { children: React.ReactNode }) {
  const { isInitialized, getInitialized } = useAuthStore();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    getInitialized();
    const timer = setTimeout(() => setShowLoader(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized && showLoader) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <LoadingMark />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Initializing...</p>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ApiErrorBoundary>
            <AuthInit>
              <RouterProvider router={router} />
            </AuthInit>
          </ApiErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export { App };
