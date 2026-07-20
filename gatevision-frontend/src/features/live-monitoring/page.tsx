import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function LiveMonitoringPage() {
  return (
    <PageContainer>
      <SectionHeader
        title="Live Monitoring"
        description="Real-time camera feeds and detection streams"
        action={<Badge variant="success">12 Cameras Online</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="aspect-video flex items-center justify-center bg-elevated">
            <p className="text-sm text-muted-foreground">Camera Feed {i + 1}</p>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

export { LiveMonitoringPage };
