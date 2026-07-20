import { type ReactNode } from "react";
import { WifiOff, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

interface ApiErrorBoundaryProps {
  children: ReactNode;
}

function ApiErrorDisplay({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="max-w-md p-8 text-center">
        <div className="mb-4 flex justify-center">{icon}</div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {action && (
          <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
            {action.label === "Retry" && <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            {action.label === "Login" && <LogIn className="mr-1.5 h-3.5 w-3.5" />}
            {action.label}
          </Button>
        )}
      </Card>
    </div>
  );
}

function ApiErrorBoundary({ children }: ApiErrorBoundaryProps) {
  const { isAuthenticated, error } = useAuthStore();

  if (!navigator.onLine) {
    return (
      <ApiErrorDisplay
        icon={<WifiOff className="h-10 w-10 text-warning" />}
        title="No Internet Connection"
        message="You are currently offline. Please check your network connection and try again."
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    );
  }

  if (error?.code === "SERVER_ERROR" || error?.code === "NETWORK_ERROR") {
    return (
      <ApiErrorDisplay
        icon={<AlertTriangle className="h-10 w-10 text-danger" />}
        title="Server Error"
        message="Unable to connect to the GateVision backend. The server may be down or unreachable."
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    );
  }

  if (!isAuthenticated && error && (error.code === "SESSION_EXPIRED" || error.code === "UNAUTHORIZED")) {
    return (
      <ApiErrorDisplay
        icon={<LogIn className="h-10 w-10 text-primary" />}
        title="Session Expired"
        message="Your session has expired. Please log in again to continue."
        action={{ label: "Login", onClick: () => { window.location.href = "/login"; } }}
      />
    );
  }

  return <>{children}</>;
}

export { ApiErrorBoundary };
