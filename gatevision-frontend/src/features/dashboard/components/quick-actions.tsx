import { useNavigate } from "@tanstack/react-router";
import { Camera, Users, Shield, BarChart3, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Recognition", icon: Camera, route: "/recognition", variant: "outline" as const },
  { label: "Drivers", icon: Users, route: "/identity", variant: "outline" as const },
  { label: "Gate", icon: Shield, route: "/gate-operations", variant: "outline" as const },
  { label: "Reports", icon: BarChart3, route: "/reports", variant: "outline" as const },
  { label: "Settings", icon: Settings, route: "/settings", variant: "outline" as const },
];

function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.variant}
            size="sm"
            className="gap-1.5"
            onClick={() => navigate({ to: a.route })}
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export { QuickActions };
