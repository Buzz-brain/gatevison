import type {
  IdentityStatus, VehicleStatus, PolicyType, DocumentType,
} from "../types";

export interface ApiDriverProfile {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  status: IdentityStatus;
  registered_vehicles: string[];
  access_level: string;
  last_access: string;
  photo_color: string;
  enrollment_quality: number;
  confidence: number;
  enrollment_date: string;
  recognition_accuracy: number;
  avg_visits_per_week: number;
  most_used_gate: string;
  biometrics: ApiBiometricInfo;
  timeline: ApiProfileTimelineEvent[];
  documents: ApiDocumentItem[];
}

export interface ApiBiometricInfo {
  face_enrolled: boolean;
  vehicle_fingerprint_enrolled: boolean;
  quality: number;
  confidence: number;
  enrollment_date: string;
  reference_images: string[];
  confidence_trend: number[];
}

export interface ApiProfileTimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

export interface ApiDocumentItem {
  id: string;
  type: DocumentType;
  name: string;
  uploaded_at: string;
  verified: boolean;
}

export interface ApiVehicleProfile {
  id: string;
  plate: string;
  owner_id: string;
  owner_name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: VehicleStatus;
  registered: string;
  last_seen: string;
  fingerprint_preview_color: string;
  recognition_accuracy: number;
  policies: string[];
  total_access: number;
}

export interface ApiTimeSlot {
  start: string;
  end: string;
}

export interface ApiWeeklySchedule {
  mon: ApiTimeSlot | null;
  tue: ApiTimeSlot | null;
  wed: ApiTimeSlot | null;
  thu: ApiTimeSlot | null;
  fri: ApiTimeSlot | null;
  sat: ApiTimeSlot | null;
  sun: ApiTimeSlot | null;
}

export interface ApiPolicyPermission {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ApiAccessPolicy {
  id: string;
  name: string;
  type: PolicyType;
  allowed_gates: string[];
  schedule: ApiWeeklySchedule;
  priority: number;
  permissions: ApiPolicyPermission[];
  driver_ids: string[];
  vehicle_ids: string[];
}

export interface ApiRelationshipNode {
  id: string;
  type: "driver" | "vehicle" | "policy" | "gate";
  label: string;
  sublabel?: string;
}

export interface ApiRelationshipEdge {
  from: string;
  to: string;
  label: string;
}

export interface ApiRelationships {
  nodes: ApiRelationshipNode[];
  edges: ApiRelationshipEdge[];
}

export interface ApiActivityItem {
  id: string;
  type: "enrollment" | "vehicle_registered" | "policy_changed" | "identity_verified" | "link";
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface ApiIdentityStats {
  total_drivers: number;
  total_vehicles: number;
  total_policies: number;
  enrollment_rate: number;
  verification_success: number;
  recognition_quality: number;
  drivers_by_status: Record<string, number>;
}

export interface ApiDriverEnrollmentRequest {
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
}

export interface ApiVehicleEnrollmentRequest {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  owner_id: string;
  fingerprint_captured: boolean;
  policy_id: string;
}

export interface ApiEnrollmentResult {
  driver_id: string;
  status: string;
  enrolled: boolean;
  message: string;
}

export interface ApiIdentityVerification {
  verified: boolean;
  confidence: number;
  reason: string;
  status: "verified" | "rejected" | "pending";
}
