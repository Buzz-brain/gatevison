import { useState, useMemo } from "react";
import { useDrivers, useVehicles, usePolicies, useIdentityStats, useIdentityActivity, useCreateDriver, useCreateVehicle } from "./use-identity-api";
import type {
  DriverProfile, VehicleProfile, AccessPolicy, ActivityItem, IdentityStats,
  DriverWizardData, VehicleWizardData,
} from "../types";

interface UseIdentityReturn {
  drivers: DriverProfile[];
  vehicles: VehicleProfile[];
  policies: AccessPolicy[];
  activity: ActivityItem[];
  stats: IdentityStats;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredDrivers: DriverProfile[];
  filteredVehicles: VehicleProfile[];
  filteredPolicies: AccessPolicy[];
  getDriver: (id: string) => DriverProfile | undefined;
  getVehicle: (id: string) => VehicleProfile | undefined;
  getPolicy: (id: string) => AccessPolicy | undefined;
  addDriver: (data: DriverWizardData) => void;
  addVehicle: (data: VehicleWizardData) => void;
}

function useIdentity(): UseIdentityReturn {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: driversData } = useDrivers();
  const { data: vehiclesData } = useVehicles();
  const { data: policiesData } = usePolicies();
  const { data: statsData } = useIdentityStats();
  const { data: activityData } = useIdentityActivity();

  const drivers = driversData ?? [];
  const vehicles = vehiclesData ?? [];
  const policies = policiesData ?? [];
  const activity = activityData ?? [];
  const stats = statsData ?? {
    totalDrivers: 0,
    totalVehicles: 0,
    totalPolicies: 0,
    enrollmentRate: 0,
    verificationSuccess: 0,
    recognitionQuality: 0,
    driversByStatus: {} as IdentityStats["driversByStatus"],
  };

  const createDriver = useCreateDriver();
  const createVehicle = useCreateVehicle();

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return drivers;
    return drivers.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.employeeId.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.role.toLowerCase().includes(q) ||
      d.registeredVehicles.some((v) => v.toLowerCase().includes(q)),
    );
  }, [drivers, searchQuery]);

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      v.plate.toLowerCase().includes(q) ||
      v.ownerName.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.color.toLowerCase().includes(q),
    );
  }, [vehicles, searchQuery]);

  const filteredPolicies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return policies;
    return policies.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.allowedGates.some((g) => g.toLowerCase().includes(q)),
    );
  }, [policies, searchQuery]);

  const getDriver = (id: string) => drivers.find((d) => d.id === id);
  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getPolicy = (id: string) => policies.find((p) => p.id === id);

  const addDriver = (data: DriverWizardData) => {
    createDriver.mutate({
      name: data.name,
      employee_id: data.employeeId,
      department: data.department,
      email: data.email,
      phone: data.phone,
      role: data.role,
      face_captured: data.faceCaptured,
      vehicle_ids: data.vehicleIds,
      policy_id: data.policyId,
      working_hours: data.workingHours,
      allowed_gates: data.allowedGates,
      security_level: data.securityLevel,
      emergency_access: data.emergencyAccess,
    });
  };

  const addVehicle = (data: VehicleWizardData) => {
    createVehicle.mutate({
      plate: data.plate,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      owner_id: data.ownerId,
      fingerprint_captured: data.fingerprintCaptured,
      policy_id: data.policyId,
    });
  };

  return {
    drivers, vehicles, policies, activity, stats,
    searchQuery, setSearchQuery,
    filteredDrivers, filteredVehicles, filteredPolicies,
    getDriver, getVehicle, getPolicy,
    addDriver, addVehicle,
  };
}

export { useIdentity };
