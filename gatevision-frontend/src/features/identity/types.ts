// ─── Enrollment / Identity status enums (map to FastAPI IdentityStatus) ───
export type IdentityStatus =
  | "verified"
  | "pending"
  | "visitor"
  | "vip"
  | "expired"
  | "suspended"
  | "inactive";

export type VehicleStatus = "active" | "inactive" | "expired" | "flagged";

export type PolicyType =
  | "employee"
  | "visitor"
  | "contractor"
  | "vip"
  | "emergency";

export type DocumentType = "driver_id" | "license" | "insurance" | "registration";

// ─── Biometrics (maps to FastAPI VerificationService output) ───
export interface BiometricInfo {
  faceEnrolled: boolean;
  vehicleFingerprintEnrolled: boolean;
  quality: number;
  confidence: number;
  enrollmentDate: string;
  referenceImages: string[];
  confidenceTrend: number[];
}

export interface DocumentItem {
  id: string;
  type: DocumentType;
  name: string;
  uploadedAt: string;
  verified: boolean;
}

export interface ProfileTimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

// ─── Driver (maps to FastAPI DriverProfile) ───
export interface DriverProfile {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  status: IdentityStatus;
  registeredVehicles: string[];
  accessLevel: string;
  lastAccess: string;
  photoColor: string;
  enrollmentQuality: number;
  confidence: number;
  enrollmentDate: string;
  recognitionAccuracy: number;
  avgVisitsPerWeek: number;
  mostUsedGate: string;
  biometrics: BiometricInfo;
  timeline: ProfileTimelineEvent[];
  documents: DocumentItem[];
}

// ─── Vehicle (maps to FastAPI VehicleProfile) ───
export interface VehicleProfile {
  id: string;
  plate: string;
  ownerId: string;
  ownerName: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: VehicleStatus;
  registered: string;
  lastSeen: string;
  fingerprintPreviewColor: string;
  recognitionAccuracy: number;
  policies: string[];
  totalAccess: number;
}

// ─── Access Policy (maps to FastAPI AccessPolicy) ───
export interface TimeSlot {
  start: string;
  end: string;
}

export interface WeeklySchedule {
  mon: TimeSlot | null;
  tue: TimeSlot | null;
  wed: TimeSlot | null;
  thu: TimeSlot | null;
  fri: TimeSlot | null;
  sat: TimeSlot | null;
  sun: TimeSlot | null;
}

export interface PolicyPermission {
  id: string;
  label: string;
  enabled: boolean;
}

export interface AccessPolicy {
  id: string;
  name: string;
  type: PolicyType;
  allowedGates: string[];
  schedule: WeeklySchedule;
  priority: number;
  permissions: PolicyPermission[];
  driverIds: string[];
  vehicleIds: string[];
}

// ─── Relationship graph (maps to FastAPI graph services) ───
export type GraphNodeType = "driver" | "vehicle" | "policy" | "gate";

export interface RelationshipNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sublabel?: string;
}

export interface RelationshipEdge {
  from: string;
  to: string;
  label: string;
}

// ─── Activity feed ───
export type ActivityType =
  | "enrollment"
  | "vehicle_registered"
  | "policy_changed"
  | "identity_verified"
  | "link";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

// ─── Statistics ───
export interface IdentityStats {
  totalDrivers: number;
  totalVehicles: number;
  totalPolicies: number;
  enrollmentRate: number;
  verificationSuccess: number;
  recognitionQuality: number;
  driversByStatus: Record<IdentityStatus, number>;
}

// ─── Wizard form state ───
export interface DriverWizardData {
  name: string;
  employeeId: string;
  department: string;
  email: string;
  phone: string;
  role: string;
  faceCaptured: boolean;
  vehicleIds: string[];
  policyId: string;
  workingHours: string;
  allowedGates: string[];
  securityLevel: string;
  emergencyAccess: boolean;
}

export interface VehicleWizardData {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  ownerId: string;
  fingerprintCaptured: boolean;
  policyId: string;
}

export const GATES = ["Main Gate", "Gate B", "Service Gate", "Employee Gate", "North Gate", "South Gate"] as const;
export const DEPARTMENTS = [
  "Engineering", "Operations", "Security", "Logistics", "Executive", "Facilities", "Research",
] as const;
