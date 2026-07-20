import type { LucideIcon } from "lucide-react";

export type RoleId = "admin" | "security_officer" | "supervisor" | "auditor" | "operator" | "viewer";

export type UserStatus = "active" | "inactive" | "locked" | "suspended" | "pending";

export type PermissionAction = "create" | "read" | "update" | "delete" | "approve" | "audit";

export type Severity = "critical" | "warning" | "info" | "resolved";

export type NotificationChannel = "email" | "sms" | "push" | "in_app";

export type ReviewDecision = "approved" | "rejected" | "escalated" | "pending";

export type DepartmentId = "security" | "operations" | "facilities" | "it" | "management" | "legal" | "hr" | "parking";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  department: DepartmentId;
  role: RoleId;
  status: UserStatus;
  avatar?: string;
  lastLogin: string;
  mfa: boolean;
  sessionCount: number;
  created: string;
  phone?: string;
  jobTitle?: string;
  securityScore: number;
  profileComplete: number;
  badges: { label: string; variant: string }[];
}

export interface RoleInfo {
  id: RoleId;
  name: string;
  description: string;
  color: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  userCount: number;
  permissions: string[];
}

export interface PermissionNode {
  id: string;
  label: string;
  icon: string;
  children?: PermissionNode[];
}

export interface RBACEntry {
  permission: string;
  roles: Partial<Record<RoleId, PermissionAction[]>>;
}

export interface ManualReview {
  id: string;
  plate: string;
  driverName: string;
  vehicle: string;
  reason: string;
  confidence: number;
  timestamp: string;
  status: ReviewDecision;
  image?: string;
  reviewer?: string;
  notes?: string;
  capturedImage: string;
  registeredImage: string;
  ocrConfidence: number;
  faceConfidence: number;
  vehicleConfidence: number;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  detail: string;
  timestamp: string;
  result: "success" | "failure" | "warning";
  ip: string;
  device: string;
  requestId: string;
  module: string;
  severity: Severity;
}

export interface SecurityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: Severity;
  timestamp: string;
  user?: string;
  module: string;
  acknowledged: boolean;
  assignee?: string;
}

export interface SessionInfo {
  id: string;
  user: string;
  email: string;
  browser: string;
  os: string;
  device: string;
  location: string;
  started: string;
  expires: string;
  status: "active" | "idle" | "expired";
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variables: string[];
  enabled: boolean;
}

export interface NotificationRule {
  id: string;
  event: string;
  channels: NotificationChannel[];
  quietHours?: { start: string; end: string };
  escalation: { delay: number; channel: NotificationChannel }[];
}

export interface OrganizationNode {
  id: string;
  label: string;
  type: "department" | "building" | "zone" | "gate" | "team";
  children?: OrganizationNode[];
  users?: number;
  status: "active" | "inactive" | "warning";
}

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  admins: number;
  securityOfficers: number;
  pendingReviews: number;
  securityEventsToday: number;
  failedLogins: number;
  activeSessions: number;
  permissionChanges: number;
}

export interface SecurityScoreBreakdown {
  mfaAdoption: number;
  failedLoginsScore: number;
  passwordStrength: number;
  activeSessionsScore: number;
  permissionHygiene: number;
  auditCompliance: number;
}

export interface AdminInsight {
  id: string;
  type: "warning" | "info" | "critical";
  message: string;
  recommendation: string;
  timestamp: string;
}

export interface ActivityEntry {
  id: string;
  time: string;
  action: string;
  detail: string;
  user: string;
  type: "created" | "updated" | "deleted" | "approved" | "rejected" | "login" | "logout" | "warning" | "error";
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  variant: string;
  action: string;
}

export interface CommandMatrixData {
  liveUsers: number;
  activeSessions: number;
  pendingReviews: number;
  criticalEvents: number;
  gatesOnline: number;
  gatesOffline: number;
  modelsHealthy: number;
  modelsDegraded: number;
  roleDistribution: { role: string; count: number; color: string }[];
  privilegedUsers: { userId: string; name: string; role: RoleId; riskScore: number }[];
  recentEvents: SecurityEvent[];
}
