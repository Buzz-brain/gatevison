import { useState } from "react";
import {
  LayoutDashboard, Users, Shield, CheckCircle2, FileSearch, AlertTriangle,
  Monitor, Bell, Building2, Settings, UserPlus, Lock, RefreshCw, AlertOctagon,
} from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdmin } from "./hooks/use-admin";
import { AdminOverview } from "./components/admin-overview";
import { UserTable } from "./components/user-table";
import { UserProfile } from "./components/user-profile";
import { UserWizard } from "./components/user-wizard";
import { RoleManagement } from "./components/role-management";
import { RbacMatrix } from "./components/rbac-matrix";
import { PermissionTree } from "./components/permission-tree";
import { ManualReviewCenter } from "./components/manual-review-center";
import { ReviewWorkspace } from "./components/review-workspace";
import { AuditLog } from "./components/audit-log";
import { SecurityEvents } from "./components/security-events";
import { ActiveSessions } from "./components/active-sessions";
import { NotificationManager } from "./components/notification-manager";
import { OrganizationChart } from "./components/organization-chart";
import { SecurityScore } from "./components/security-score";
import { AdminInsights } from "./components/admin-insights";
import { ActivityTimeline } from "./components/activity-timeline";
import { QuickActions } from "./components/quick-actions";
import { EmergencyMode } from "./components/emergency-mode";
import { SecurityCommandMatrix } from "./components/security-command-matrix";
import { SecurityCommandCenter } from "./components/security-command-center";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "reviews", label: "Manual Reviews", icon: CheckCircle2 },
  { id: "audit", label: "Audit Logs", icon: FileSearch },
  { id: "events", label: "Security Events", icon: AlertTriangle },
  { id: "sessions", label: "Sessions", icon: Monitor },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "system", label: "System Admin", icon: Settings },
];

function LoadingSkeleton() {
  return (
    <PageContainer>
      <div className="mb-6">
        <div className="h-8 w-72 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
      </div>
      <div className="mb-6">
        <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-xl bg-muted/20 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    </PageContainer>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-24">
        <AlertOctagon className="mb-4 h-12 w-12 text-danger" />
        <h2 className="text-lg font-semibold mb-2">Failed to load Administration Center</h2>
        <p className="text-sm text-muted-foreground mb-6">There was an error fetching data from the server. Please try again.</p>
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    </PageContainer>
  );
}

function AdminPage() {
  const hook = useAdmin();
  const [showWizard, setShowWizard] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<string | null>(null);
  const [permTreeSelection, setPermTreeSelection] = useState<string | null>(null);

  const selectedReview = reviewDetail ? hook.reviews.find((r) => r.id === reviewDetail) ?? null : null;

  if (hook.isLoading) return <LoadingSkeleton />;
  if (hook.isError) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration & Security Center</h1>
          <p className="text-sm text-muted-foreground">Manage users, roles, security events, and system configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowWizard(true)}>
            <UserPlus className="mr-1 h-4 w-4" />Create User
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setShowEmergency(true)}>
            <Lock className="mr-1 h-4 w-4" />Emergency
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <SecurityCommandMatrix data={hook.commandMatrix} />
      </div>

      <Tabs value={hook.activeTab} onValueChange={hook.setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} active={hook.activeTab === tab.id}>
              <tab.icon className="mr-1.5 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" active={hook.activeTab === "overview"}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <AdminOverview stats={hook.stats} />
              <AdminInsights insights={hook.insights} />
            </div>
            <div className="space-y-6">
              <SecurityScore score={hook.securityScore} />
              <ActivityTimeline activity={hook.activity} />
            </div>
          </div>
          <div className="mt-6">
            <SecurityCommandCenter
              reviews={hook.reviews}
              events={hook.allEvents}
              commandMatrix={hook.commandMatrix}
              stats={hook.stats}
              securityScore={hook.securityScore}
              insights={hook.insights}
              health={hook.health}
              models={hook.models}
              isLoading={false}
              isError={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="users" active={hook.activeTab === "users"}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{hook.filteredUsers.length} users</span>
                <Button size="sm" onClick={() => setShowWizard(true)}><UserPlus className="mr-1 h-4 w-4" />Create User</Button>
              </div>
              <UserTable
                users={hook.filteredUsers}
                selectedUser={hook.selectedUser}
                onSelect={hook.setSelectedUser}
                selectedUsers={hook.selectedUsers}
                onToggleSelect={hook.toggleUserSelection}
                onSelectAll={hook.selectAllUsers}
                search={hook.userSearch}
                onSearchChange={hook.setUserSearch}
                statusFilter={hook.userStatusFilter}
                onStatusFilterChange={hook.setUserStatusFilter}
                roleFilter={hook.userRoleFilter}
                onRoleFilterChange={hook.setUserRoleFilter}
                deptFilter={hook.userDeptFilter}
                onDeptFilterChange={hook.setUserDeptFilter}
              />
            </div>
            <div className="lg:col-span-1">
              <UserProfile user={hook.selectedUser} onClose={() => hook.setSelectedUser(null)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles" active={hook.activeTab === "roles"}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <RoleManagement roles={hook.roles} />
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-elevated p-4">
                <h3 className="mb-3 text-sm font-semibold">Permission Explorer</h3>
                <PermissionTree tree={hook.permissionTree} onSelect={setPermTreeSelection} />
              </div>
              {permTreeSelection && (
                <div className="rounded-xl border border-border bg-elevated p-4">
                  <p className="text-xs text-muted-foreground">Selected: <span className="font-medium text-foreground">{permTreeSelection}</span></p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <RbacMatrix entries={hook.rbacEntries} />
          </div>
        </TabsContent>

        <TabsContent value="reviews" active={hook.activeTab === "reviews"}>
          <div className="grid gap-6 lg:grid-cols-2">
            <ManualReviewCenter reviews={hook.reviews} onUpdate={hook.updateReview} />
            <ReviewWorkspace review={selectedReview} onUpdate={hook.updateReview} onClose={() => setReviewDetail(null)} />
          </div>
        </TabsContent>

        <TabsContent value="audit" active={hook.activeTab === "audit"}>
          <AuditLog
            logs={hook.auditLogs}
            search={hook.auditSearch}
            onSearchChange={hook.setAuditSearch}
            module={hook.auditModule}
            onModuleChange={hook.setAuditModule}
            severity={hook.auditSeverity}
            onSeverityChange={hook.setAuditSeverity}
          />
        </TabsContent>

        <TabsContent value="events" active={hook.activeTab === "events"}>
          <SecurityEvents events={hook.events} filter={hook.eventFilter} onFilterChange={hook.setEventFilter} onAcknowledge={hook.acknowledgeEvent} />
        </TabsContent>

        <TabsContent value="sessions" active={hook.activeTab === "sessions"}>
          <ActiveSessions sessions={hook.sessions} />
        </TabsContent>

        <TabsContent value="notifications" active={hook.activeTab === "notifications"}>
          <NotificationManager notifications={hook.notifications} />
        </TabsContent>

        <TabsContent value="organization" active={hook.activeTab === "organization"}>
          <OrganizationChart data={hook.organization} />
        </TabsContent>

        <TabsContent value="system" active={hook.activeTab === "system"}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <AdminInsights insights={hook.insights} />
              <QuickActions actions={hook.quickActions} onAction={(id: string) => id === "qa8" ? setShowEmergency(true) : undefined} />
            </div>
            <div>
              <ActivityTimeline activity={hook.activity} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showWizard && (
        <UserWizard
          onClose={() => setShowWizard(false)}
          onComplete={(data: any) => { console.log("User created:", data); setShowWizard(false); }}
        />
      )}

      <EmergencyMode open={showEmergency} onClose={() => setShowEmergency(false)} />
    </PageContainer>
  );
}

export { AdminPage };
