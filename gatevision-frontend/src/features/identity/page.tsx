import { useState } from "react";
import {
  Users, Car, UserPlus, Car as CarIcon, Upload, Search, ShieldCheck, Network, Plus, BrainCircuit,
} from "lucide-react";
import { SectionHeader } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIdentity } from "./hooks/use-identity";
import { useIdentityRelationships } from "./hooks/use-identity-api";
import { DriverCard } from "./components/driver-card";
import { VehicleCard } from "./components/vehicle-card";
import { DriverProfile } from "./components/driver-profile";
import { VehicleProfile } from "./components/vehicle-profile";
import { DriverWizard } from "./components/driver-wizard";
import { VehicleWizard } from "./components/vehicle-wizard";
import { RelationshipGraph } from "./components/relationship-graph";
import { PolicyCard } from "./components/policy-card";
import { PolicyEditor } from "./components/policy-editor";
import { BiometricPanel } from "./components/biometric-panel";
import { ActivityFeed } from "./components/activity-feed";
import { Timeline } from "./components/timeline";
import { Statistics } from "./components/statistics";
import { BulkImport } from "./components/bulk-import";
import { DigitalIdentityPassport } from "./components/digital-identity-passport";
import { IdentityIntelligencePanel } from "./components/identity-intelligence-panel";
import type { DriverProfile as Driver, VehicleProfile as Vehicle, AccessPolicy } from "./types";

type Workspace = "drivers" | "vehicles" | "enrollment" | "policies" | "explorer" | "intelligence";

function IdentityPage() {
  const [workspace, setWorkspace] = useState<Workspace>("drivers");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [passportDriver, setPassportDriver] = useState<Driver | null>(null);
  const [driverWizard, setDriverWizard] = useState(false);
  const [vehicleWizard, setVehicleWizard] = useState(false);
  const [policyEditor, setPolicyEditor] = useState<AccessPolicy | null>(null);
  const [bulkImport, setBulkImport] = useState(false);

  const {
    drivers, vehicles, policies, activity, stats,
    searchQuery, setSearchQuery, filteredDrivers, filteredVehicles, filteredPolicies,
    addDriver, addVehicle,
  } = useIdentity();
  const { data: relationships } = useIdentityRelationships();

  const policyForDriver = selectedDriver
    ? policies.find((p) => p.driverIds.includes(selectedDriver.id))
    : undefined;

  const vehiclesForDriver = selectedDriver
    ? vehicles.filter((v) => v.ownerId === selectedDriver.id)
    : [];

  const emptyState = (label: string, icon: typeof Users) => {
    const Icon = icon;
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground/70">No {label.toLowerCase()} found</p>
        {searchQuery && <p className="mt-1 text-[11px] text-muted-foreground/50">Try a different search term</p>}
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="Identity Management"
        description="Security Enrollment Center - manage drivers, vehicles, access policies and their relationships"
        action={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search identities..."
              className="w-56 pl-8"
            />
          </div>
        }
      />

      <Statistics stats={stats} />

      <Tabs value={workspace} onValueChange={(v) => setWorkspace(v as Workspace)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="drivers" active={workspace === "drivers"} className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Drivers
          </TabsTrigger>
          <TabsTrigger value="vehicles" active={workspace === "vehicles"} className="gap-1.5">
            <Car className="h-3.5 w-3.5" /> Vehicles
          </TabsTrigger>
          <TabsTrigger value="enrollment" active={workspace === "enrollment"} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Enrollment
          </TabsTrigger>
          <TabsTrigger value="policies" active={workspace === "policies"} className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Access Policies
          </TabsTrigger>
          <TabsTrigger value="explorer" active={workspace === "explorer"} className="gap-1.5">
            <Network className="h-3.5 w-3.5" /> Relationship Explorer
          </TabsTrigger>
          <TabsTrigger value="intelligence" active={workspace === "intelligence"} className="gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5" /> Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" active={workspace === "drivers"}>
          <div className="mb-3 flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setDriverWizard(true)}>
              <Plus className="h-3.5 w-3.5" /> Enroll Driver
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBulkImport(true)}>
              <Upload className="h-3.5 w-3.5" /> Bulk Import
            </Button>
          </div>
          {filteredDrivers.length === 0 ? emptyState("drivers", Users) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDrivers.map((d) => (
                <DriverCard key={d.id} driver={d} onOpen={setSelectedDriver} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vehicles" active={workspace === "vehicles"}>
          <div className="mb-3">
            <Button size="sm" className="gap-1.5" onClick={() => setVehicleWizard(true)}>
              <Plus className="h-3.5 w-3.5" /> Register Vehicle
            </Button>
          </div>
          {filteredVehicles.length === 0 ? emptyState("vehicles", CarIcon) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onOpen={setSelectedVehicle} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollment" active={workspace === "enrollment"}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-medium">Driver Enrollment</h3>
                </div>
                <p className="text-[11px] text-muted-foreground/60">5-step wizard: personal info, face capture, vehicle link, policy assignment, review.</p>
                <Button size="sm" className="mt-3 w-full gap-1.5" onClick={() => setDriverWizard(true)}>
                  <Plus className="h-3.5 w-3.5" /> Start Enrollment
                </Button>
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CarIcon className="h-5 w-5 text-success" />
                  <h3 className="text-sm font-medium">Vehicle Registration</h3>
                </div>
                <p className="text-[11px] text-muted-foreground/60">3-step wizard: details, vehicle fingerprint, review.</p>
                <Button size="sm" variant="outline" className="mt-3 w-full gap-1.5" onClick={() => setVehicleWizard(true)}>
                  <Plus className="h-3.5 w-3.5" /> Register Vehicle
                </Button>
              </Card>
              {selectedDriver && <BiometricPanel driver={selectedDriver} />}
            </div>
            <div className="space-y-4 lg:col-span-2">
              <ActivityFeed items={activity} />
              {selectedDriver && <Timeline entries={selectedDriver.timeline} />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="policies" active={workspace === "policies"}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((p) => (
              <PolicyCard
                key={p.id}
                policy={p}
                onEdit={setPolicyEditor}
                onDuplicate={() => {}}
                onPreview={(pol) => setPolicyEditor(pol)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="explorer" active={workspace === "explorer"}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RelationshipGraph nodes={relationships?.nodes ?? []} edges={relationships?.edges ?? []} />
            </div>
            <div className="space-y-4">
              <ActivityFeed items={activity} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" active={workspace === "intelligence"}>
          <IdentityIntelligencePanel />
        </TabsContent>
      </Tabs>

      {selectedDriver && (
        <DriverProfile
          driver={selectedDriver}
          vehicles={vehiclesForDriver}
          policy={policyForDriver}
          onClose={() => setSelectedDriver(null)}
          onPassport={setPassportDriver}
        />
      )}
      {selectedVehicle && (
        <VehicleProfile
          vehicle={selectedVehicle}
          owner={drivers.find((d) => d.id === selectedVehicle.ownerId) ?? null}
          onClose={() => setSelectedVehicle(null)}
        />
      )}

      {driverWizard && (
        <DriverWizard
          onClose={() => setDriverWizard(false)}
          onSubmit={(data) => { addDriver(data); setDriverWizard(false); }}
          vehicles={vehicles}
          policies={policies}
        />
      )}
      {vehicleWizard && (
        <VehicleWizard
          onClose={() => setVehicleWizard(false)}
          onSubmit={(data) => { addVehicle(data); setVehicleWizard(false); }}
          drivers={drivers}
          policies={policies}
        />
      )}

      {policyEditor && (
        <PolicyEditor policy={policyEditor} onClose={() => setPolicyEditor(null)} onSave={(p) => setPolicyEditor(p)} />
      )}

      {bulkImport && (
        <BulkImport onClose={() => setBulkImport(false)} onImported={() => {}} />
      )}

      {passportDriver && (
        <DigitalIdentityPassport
          driver={passportDriver}
          vehicles={vehiclesForDriver}
          policy={policyForDriver}
          onClose={() => setPassportDriver(null)}
        />
      )}
    </div>
  );
}

export { IdentityPage };
