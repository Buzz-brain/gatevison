import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getDriversApi, getDriverApi, createDriverApi, updateDriverApi, deleteDriverApi } from "@/services/api/driver.api";
import { getVehiclesApi, getVehicleApi, createVehicleApi, updateVehicleApi, deleteVehicleApi } from "@/services/api/vehicle-profile.api";
import { getPoliciesApi, getPolicyApi, createPolicyApi, updatePolicyApi, deletePolicyApi, duplicatePolicyApi } from "@/services/api/policy.api";
import { getIdentityStatsApi, getActivityFeedApi, verifyIdentityApi } from "@/services/api/identity.api";
import { enrollDriverApi, enrollVehicleApi } from "@/services/api/enrollment.api";
import { getRelationshipsApi } from "@/services/api/identity.api";
import { mapDriverProfile, mapVehicleProfile, mapAccessPolicy, mapActivityItem, mapIdentityStats, mapRelationships } from "../api/mapper";
import type { DriverProfile, VehicleProfile, AccessPolicy, ActivityItem, IdentityStats } from "../types";
import type { ApiDriverProfile } from "../types/api";

export function useDrivers(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.DRIVERS(search),
    queryFn: async () => {
      const res = await getDriversApi(1, 200, search);
      return (res.items ?? []).map(mapDriverProfile);
    },
  });
}

export function useDriver(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.DRIVER(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await getDriverApi(id);
      return mapDriverProfile(res);
    },
    enabled: !!id,
  });
}

export function useVehicles(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.VEHICLES(search),
    queryFn: async () => {
      const res = await getVehiclesApi(1, 200, search);
      return (res.items ?? []).map(mapVehicleProfile);
    },
  });
}

export function useVehicle(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.VEHICLE(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await getVehicleApi(id);
      return mapVehicleProfile(res);
    },
    enabled: !!id,
  });
}

export function usePolicies(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.POLICIES(search),
    queryFn: async () => {
      const res = await getPoliciesApi(1, 200, search);
      return (res.items ?? []).map(mapAccessPolicy);
    },
  });
}

export function usePolicy(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.POLICY(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await getPolicyApi(id);
      return mapAccessPolicy(res);
    },
    enabled: !!id,
  });
}

export function useIdentityStats() {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.STATS,
    queryFn: async () => {
      const res = await getIdentityStatsApi();
      return mapIdentityStats(res);
    },
  });
}

export function useIdentityActivity() {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.ACTIVITY,
    queryFn: async () => {
      const res = await getActivityFeedApi();
      return res.map(mapActivityItem);
    },
  });
}

export function useIdentityRelationships() {
  return useQuery({
    queryKey: QUERY_KEYS.IDENTITY.RELATIONSHIPS,
    queryFn: async () => {
      const res = await getRelationshipsApi();
      return mapRelationships(res);
    },
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      employee_id: string;
      department: string;
      email: string;
      phone: string;
      role: string;
      face_captured: boolean;
      vehicle_ids: string[];
      policy_id: string;
      working_hours: string;
      allowed_gates: string[];
      security_level: string;
      emergency_access: boolean;
    }) => {
      const res = await createDriverApi(data as any);
      return mapDriverProfile(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "drivers"] });
      qc.invalidateQueries({ queryKey: ["identity", "stats"] });
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      plate: string;
      make: string;
      model: string;
      year: number;
      color: string;
      owner_id: string;
      fingerprint_captured: boolean;
      policy_id: string;
    }) => {
      const res = await createVehicleApi(data as any);
      return mapVehicleProfile(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "vehicles"] });
      qc.invalidateQueries({ queryKey: ["identity", "stats"] });
    },
  });
}

export function useEnrollDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollDriverApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "drivers"] });
      qc.invalidateQueries({ queryKey: ["identity", "stats"] });
    },
  });
}

export function useEnrollVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollVehicleApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "vehicles"] });
      qc.invalidateQueries({ queryKey: ["identity", "stats"] });
    },
  });
}

export function useVerifyIdentity() {
  return useMutation({
    mutationFn: verifyIdentityApi,
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ApiDriverProfile> }) => {
      const res = await updateDriverApi(id, data);
      return mapDriverProfile(res);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["identity", "drivers"] });
      qc.invalidateQueries({ queryKey: ["identity", "driver", vars.id] });
    },
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      const res = await updateVehicleApi(id, data);
      return mapVehicleProfile(res);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["identity", "vehicles"] });
      qc.invalidateQueries({ queryKey: ["identity", "vehicle", vars.id] });
    },
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      const res = await updatePolicyApi(id, data);
      return mapAccessPolicy(res);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["identity", "policies"] });
      qc.invalidateQueries({ queryKey: ["identity", "policy", vars.id] });
    },
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDriverApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "drivers"] });
      qc.invalidateQueries({ queryKey: ["identity", "stats"] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicleApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "vehicles"] });
      qc.invalidateQueries({ queryKey: ["identity", "stats"] });
    },
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicyApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "policies"] });
    },
  });
}

export function useDuplicatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: duplicatePolicyApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity", "policies"] });
    },
  });
}
