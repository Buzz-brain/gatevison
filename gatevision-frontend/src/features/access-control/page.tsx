import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

const gates = [
  { name: "Main Gate", status: "active" as const, vehicles: 342 },
  { name: "Gate B", status: "active" as const, vehicles: 198 },
  { name: "Service Gate", status: "warning" as const, vehicles: 0 },
  { name: "Employee Gate", status: "active" as const, vehicles: 87 },
];

function AccessControlPage() {
  return (
    <PageContainer>
      <SectionHeader
        title="Access Control"
        description="Manage gate permissions and access rules"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {gates.map((gate) => (
          <Card key={gate.name} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">{gate.name}</h3>
              <StatusPill
                status={gate.status}
                label={gate.status}
              />
            </div>
            <p className="text-2xl font-semibold">{gate.vehicles}</p>
            <p className="text-xs text-muted-foreground">vehicles today</p>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

export { AccessControlPage };
