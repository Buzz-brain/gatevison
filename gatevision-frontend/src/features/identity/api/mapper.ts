import type {
  DriverProfile, VehicleProfile, AccessPolicy, BiometricInfo,
  ProfileTimelineEvent, DocumentItem, ActivityItem, IdentityStats,
  RelationshipNode, RelationshipEdge, WeeklySchedule, TimeSlot,
  PolicyPermission,
} from "../types";
import type {
  ApiDriverProfile, ApiVehicleProfile, ApiAccessPolicy,
  ApiActivityItem, ApiIdentityStats, ApiRelationships,
  ApiRelationshipNode, ApiRelationshipEdge, ApiBiometricInfo,
  ApiProfileTimelineEvent, ApiDocumentItem, ApiWeeklySchedule,
  ApiTimeSlot, ApiPolicyPermission,
} from "../types/api";

function mapTimeSlot(s: ApiTimeSlot | null): TimeSlot | null {
  if (!s) return null;
  return { start: s.start, end: s.end };
}

function mapWeeklySchedule(s: ApiWeeklySchedule): WeeklySchedule {
  return {
    mon: mapTimeSlot(s.mon),
    tue: mapTimeSlot(s.tue),
    wed: mapTimeSlot(s.wed),
    thu: mapTimeSlot(s.thu),
    fri: mapTimeSlot(s.fri),
    sat: mapTimeSlot(s.sat),
    sun: mapTimeSlot(s.sun),
  };
}

function mapPermission(p: ApiPolicyPermission): PolicyPermission {
  return { id: p.id, label: p.label, enabled: p.enabled };
}

function mapBiometrics(b: ApiBiometricInfo): BiometricInfo {
  return {
    faceEnrolled: b.face_enrolled,
    vehicleFingerprintEnrolled: b.vehicle_fingerprint_enrolled,
    quality: b.quality,
    confidence: b.confidence,
    enrollmentDate: b.enrollment_date,
    referenceImages: b.reference_images,
    confidenceTrend: b.confidence_trend,
  };
}

function mapTimelineEvent(t: ApiProfileTimelineEvent): ProfileTimelineEvent {
  return { id: t.id, title: t.title, timestamp: t.timestamp, status: t.status };
}

function mapDocument(d: ApiDocumentItem): DocumentItem {
  return { id: d.id, type: d.type, name: d.name, uploadedAt: d.uploaded_at, verified: d.verified };
}

export function mapDriverProfile(d: ApiDriverProfile): DriverProfile {
  return {
    id: d.id,
    name: d.name,
    employeeId: d.employee_id,
    department: d.department,
    role: d.role,
    email: d.email,
    phone: d.phone,
    status: d.status,
    registeredVehicles: d.registered_vehicles,
    accessLevel: d.access_level,
    lastAccess: d.last_access,
    photoColor: d.photo_color,
    enrollmentQuality: d.enrollment_quality,
    confidence: d.confidence,
    enrollmentDate: d.enrollment_date,
    recognitionAccuracy: d.recognition_accuracy,
    avgVisitsPerWeek: d.avg_visits_per_week,
    mostUsedGate: d.most_used_gate,
    biometrics: mapBiometrics(d.biometrics),
    timeline: (d.timeline ?? []).map(mapTimelineEvent),
    documents: (d.documents ?? []).map(mapDocument),
  };
}

export function mapVehicleProfile(v: ApiVehicleProfile): VehicleProfile {
  return {
    id: v.id,
    plate: v.plate,
    ownerId: v.owner_id,
    ownerName: v.owner_name,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color,
    status: v.status,
    registered: v.registered,
    lastSeen: v.last_seen,
    fingerprintPreviewColor: v.fingerprint_preview_color,
    recognitionAccuracy: v.recognition_accuracy,
    policies: v.policies,
    totalAccess: v.total_access,
  };
}

export function mapAccessPolicy(p: ApiAccessPolicy): AccessPolicy {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    allowedGates: p.allowed_gates,
    schedule: mapWeeklySchedule(p.schedule),
    priority: p.priority,
    permissions: (p.permissions ?? []).map(mapPermission),
    driverIds: p.driver_ids,
    vehicleIds: p.vehicle_ids,
  };
}

export function mapActivityItem(a: ApiActivityItem): ActivityItem {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    timestamp: a.timestamp,
    actor: a.actor,
  };
}

export function mapIdentityStats(s: ApiIdentityStats): IdentityStats {
  return {
    totalDrivers: s.total_drivers,
    totalVehicles: s.total_vehicles,
    totalPolicies: s.total_policies,
    enrollmentRate: s.enrollment_rate,
    verificationSuccess: s.verification_success,
    recognitionQuality: s.recognition_quality,
    driversByStatus: s.drivers_by_status as IdentityStats["driversByStatus"],
  };
}

export function mapRelationshipNode(n: ApiRelationshipNode): RelationshipNode {
  return { id: n.id, type: n.type, label: n.label, sublabel: n.sublabel };
}

export function mapRelationshipEdge(e: ApiRelationshipEdge): RelationshipEdge {
  return { from: e.from, to: e.to, label: e.label };
}

export function mapRelationships(r: ApiRelationships): { nodes: RelationshipNode[]; edges: RelationshipEdge[] } {
  return {
    nodes: (r.nodes ?? []).map(mapRelationshipNode),
    edges: (r.edges ?? []).map(mapRelationshipEdge),
  };
}
