import type { AdminUser, RoleInfo, RBACEntry, PermissionNode, SessionInfo, NotificationTemplate, NotificationRule, OrganizationNode, SecurityScoreBreakdown, AdminInsight, ActivityEntry, QuickAction } from "./types";

export const STATIC_USERS: AdminUser[] = [
  { id: "u1", name: "Alex Drake", email: "alex.drake@gatevision.com", department: "security", role: "admin", status: "active", lastLogin: new Date().toISOString(), mfa: true, sessionCount: 2, created: "2024-01-15", phone: "+1-555-0101", jobTitle: "Security Director", securityScore: 95, profileComplete: 100, badges: [{ label: "Admin", variant: "default" }, { label: "MFA", variant: "success" }] },
  { id: "u2", name: "Sarah Chen", email: "sarah.chen@gatevision.com", department: "security", role: "security_officer", status: "active", lastLogin: new Date().toISOString(), mfa: true, sessionCount: 1, created: "2024-03-01", phone: "+1-555-0102", jobTitle: "Security Officer", securityScore: 88, profileComplete: 90, badges: [{ label: "Officer", variant: "info" }] },
  { id: "u3", name: "Mike Park", email: "mike.park@gatevision.com", department: "operations", role: "supervisor", status: "active", lastLogin: new Date().toISOString(), mfa: false, sessionCount: 3, created: "2024-02-10", phone: "+1-555-0103", jobTitle: "Operations Supervisor", securityScore: 72, profileComplete: 85, badges: [{ label: "Supervisor", variant: "warning" }] },
  { id: "u4", name: "Lisa Wong", email: "lisa.wong@gatevision.com", department: "it", role: "admin", status: "active", lastLogin: new Date().toISOString(), mfa: true, sessionCount: 2, created: "2024-01-20", phone: "+1-555-0104", jobTitle: "IT Administrator", securityScore: 92, profileComplete: 95, badges: [{ label: "Admin", variant: "default" }, { label: "IT", variant: "info" }] },
  { id: "u5", name: "John Miller", email: "john.miller@gatevision.com", department: "facilities", role: "operator", status: "active", lastLogin: new Date().toISOString(), mfa: false, sessionCount: 1, created: "2024-04-05", phone: "+1-555-0105", jobTitle: "Gate Operator", securityScore: 65, profileComplete: 70, badges: [] },
  { id: "u6", name: "Emma Davis", email: "emma.davis@gatevision.com", department: "management", role: "auditor", status: "active", lastLogin: new Date(Date.now() - 3600000).toISOString(), mfa: true, sessionCount: 1, created: "2024-02-28", phone: "+1-555-0106", jobTitle: "Compliance Auditor", securityScore: 90, profileComplete: 100, badges: [{ label: "Auditor", variant: "info" }] },
  { id: "u7", name: "James Wilson", email: "james.wilson@gatevision.com", department: "security", role: "viewer", status: "inactive", lastLogin: new Date(Date.now() - 604800000).toISOString(), mfa: false, sessionCount: 0, created: "2024-05-20", jobTitle: "Trainee", securityScore: 45, profileComplete: 40, badges: [] },
  { id: "u8", name: "Maria Garcia", email: "maria.garcia@gatevision.com", department: "legal", role: "auditor", status: "active", lastLogin: new Date(Date.now() - 7200000).toISOString(), mfa: true, sessionCount: 1, created: "2024-03-15", phone: "+1-555-0108", jobTitle: "Legal Counsel", securityScore: 85, profileComplete: 90, badges: [{ label: "Legal", variant: "neutral" }] },
  { id: "u9", name: "Tom Bradley", email: "tom.bradley@gatevision.com", department: "operations", role: "operator", status: "locked", lastLogin: new Date(Date.now() - 86400000).toISOString(), mfa: false, sessionCount: 0, created: "2024-04-10", jobTitle: "Gate Operator", securityScore: 38, profileComplete: 55, badges: [] },
  { id: "u10", name: "Sophia Lee", email: "sophia.lee@gatevision.com", department: "hr", role: "viewer", status: "active", lastLogin: new Date(Date.now() - 14400000).toISOString(), mfa: false, sessionCount: 1, created: "2024-06-01", jobTitle: "HR Coordinator", securityScore: 55, profileComplete: 60, badges: [] },
  { id: "u11", name: "David Kim", email: "david.kim@gatevision.com", department: "it", role: "admin", status: "active", lastLogin: new Date().toISOString(), mfa: true, sessionCount: 3, created: "2024-01-10", phone: "+1-555-0111", jobTitle: "Systems Engineer", securityScore: 93, profileComplete: 100, badges: [{ label: "Admin", variant: "default" }] },
  { id: "u12", name: "Rachel Green", email: "rachel.green@gatevision.com", department: "parking", role: "operator", status: "suspended", lastLogin: new Date(Date.now() - 172800000).toISOString(), mfa: false, sessionCount: 0, created: "2024-05-05", securityScore: 25, profileComplete: 50, badges: [] },
  { id: "u13", name: "Frank Castle", email: "frank.castle@gatevision.com", department: "security", role: "security_officer", status: "active", lastLogin: new Date().toISOString(), mfa: true, sessionCount: 1, created: "2024-02-20", phone: "+1-555-0113", jobTitle: "Security Officer Lead", securityScore: 91, profileComplete: 95, badges: [{ label: "Officer", variant: "info" }] },
  { id: "u14", name: "Nina Patel", email: "nina.patel@gatevision.com", department: "management", role: "supervisor", status: "active", lastLogin: new Date(Date.now() - 1800000).toISOString(), mfa: true, sessionCount: 2, created: "2024-03-25", phone: "+1-555-0114", jobTitle: "Facility Manager", securityScore: 78, profileComplete: 85, badges: [{ label: "Manager", variant: "warning" }] },
  { id: "u15", name: "Oscar Torres", email: "oscar.torres@gatevision.com", department: "operations", role: "operator", status: "pending", lastLogin: "", mfa: false, sessionCount: 0, created: new Date().toISOString(), jobTitle: "Trainee Operator", securityScore: 20, profileComplete: 30, badges: [] },
];

export const STATIC_ROLES: RoleInfo[] = [
  { id: "admin", name: "Administrator", description: "Full system access and configuration", color: "#ef4444", riskLevel: "critical", userCount: 3, permissions: ["all"] },
  { id: "security_officer", name: "Security Officer", description: "Monitor events and manage reviews", color: "#f59e0b", riskLevel: "high", userCount: 2, permissions: ["read", "update", "approve"] },
  { id: "supervisor", name: "Supervisor", description: "Oversee operations and approve decisions", color: "#3b82f6", riskLevel: "medium", userCount: 2, permissions: ["read", "update", "approve", "audit"] },
  { id: "auditor", name: "Auditor", description: "View-only access for compliance auditing", color: "#8b5cf6", riskLevel: "low", userCount: 2, permissions: ["read", "audit"] },
  { id: "operator", name: "Operator", description: "Daily gate and system operations", color: "#22c55e", riskLevel: "low", userCount: 4, permissions: ["read", "update"] },
  { id: "viewer", name: "Viewer", description: "Read-only dashboard access", color: "#64748b", riskLevel: "low", userCount: 2, permissions: ["read"] },
];

export const STATIC_RBAC_ENTRIES: RBACEntry[] = [
  { permission: "Dashboard Access", roles: { admin: ["read"], security_officer: ["read"], supervisor: ["read"], auditor: ["read"], operator: ["read"], viewer: ["read"] } },
  { permission: "User Management", roles: { admin: ["create", "read", "update", "delete"], security_officer: ["read"], supervisor: ["read"] } },
  { permission: "Role Management", roles: { admin: ["create", "read", "update", "delete"] } },
  { permission: "Manual Reviews", roles: { admin: ["read", "approve"], security_officer: ["read", "approve", "update"], supervisor: ["read", "approve", "audit"], auditor: ["read", "audit"] } },
  { permission: "Security Events", roles: { admin: ["read", "update", "delete"], security_officer: ["read", "update"], supervisor: ["read", "audit"] } },
  { permission: "Audit Logs", roles: { admin: ["read", "audit"], supervisor: ["read", "audit"], auditor: ["read", "audit"] } },
  { permission: "System Config", roles: { admin: ["create", "read", "update", "delete"] } },
  { permission: "Reports", roles: { admin: ["create", "read", "update", "delete", "approve"], security_officer: ["read"], operator: ["read"], auditor: ["read", "audit"] } },
  { permission: "Notification Config", roles: { admin: ["create", "read", "update", "delete"], supervisor: ["read", "update"] } },
  { permission: "Session Management", roles: { admin: ["read", "update", "delete"], security_officer: ["read"], supervisor: ["read"] } },
];

export const STATIC_PERMISSION_TREE: PermissionNode[] = [
  { id: "dash", label: "Dashboard", icon: "layout-dashboard", children: [{ id: "dash-view", label: "View Dashboard", icon: "eye" }] },
  { id: "users", label: "Users", icon: "users", children: [{ id: "users-create", label: "Create Users", icon: "user-plus" }, { id: "users-edit", label: "Edit Users", icon: "user-check" }, { id: "users-delete", label: "Delete Users", icon: "user-x" }] },
  { id: "reviews", label: "Manual Reviews", icon: "check-circle", children: [{ id: "reviews-view", label: "View Reviews", icon: "eye" }, { id: "reviews-approve", label: "Approve/Reject", icon: "check" }] },
  { id: "events", label: "Security Events", icon: "alert-triangle", children: [{ id: "events-view", label: "View Events", icon: "eye" }, { id: "events-ack", label: "Acknowledge Events", icon: "check" }] },
  { id: "audit", label: "Audit Logs", icon: "file-search", children: [{ id: "audit-view", label: "View Audit Logs", icon: "eye" }] },
  { id: "system", label: "System Config", icon: "settings", children: [{ id: "sys-edit", label: "Modify Configuration", icon: "edit" }, { id: "sys-manage", label: "System Management", icon: "monitor" }] },
  { id: "reports", label: "Reports", icon: "bar-chart", children: [{ id: "reports-gen", label: "Generate Reports", icon: "file" }, { id: "reports-export", label: "Export Reports", icon: "download" }] },
  { id: "notifications", label: "Notifications", icon: "bell", children: [{ id: "notif-config", label: "Configure Alerts", icon: "settings" }] },
  { id: "sessions", label: "Sessions", icon: "monitor", children: [{ id: "sessions-view", label: "View Active Sessions", icon: "eye" }, { id: "sessions-term", label: "Terminate Sessions", icon: "x-circle" }] },
];

export const STATIC_SESSIONS: SessionInfo[] = [
  { id: "s1", user: "Alex Drake", email: "alex.drake@gatevision.com", browser: "Chrome 125", os: "Windows 11", device: "Desktop", location: "HQ, Building A", started: new Date(Date.now() - 3600000).toISOString(), expires: new Date(Date.now() + 3600000).toISOString(), status: "active" },
  { id: "s2", user: "Sarah Chen", email: "sarah.chen@gatevision.com", browser: "Firefox 128", os: "macOS 15", device: "Laptop", location: "HQ, Building B", started: new Date(Date.now() - 7200000).toISOString(), expires: new Date(Date.now() + 7200000).toISOString(), status: "active" },
  { id: "s3", user: "Mike Park", email: "mike.park@gatevision.com", browser: "Safari 18", os: "iOS 18", device: "iPad", location: "Gate North", started: new Date(Date.now() - 1800000).toISOString(), expires: new Date(Date.now() + 1800000).toISOString(), status: "active" },
  { id: "s4", user: "Lisa Wong", email: "lisa.wong@gatevision.com", browser: "Chrome 125", os: "Windows 11", device: "Desktop", location: "Server Room", started: new Date(Date.now() - 14400000).toISOString(), expires: new Date(Date.now() + 7200000).toISOString(), status: "active" },
  { id: "s5", user: "Emma Davis", email: "emma.davis@gatevision.com", browser: "Edge 126", os: "Windows 11", device: "Desktop", location: "HQ, Building A", started: new Date(Date.now() - 10800000).toISOString(), expires: new Date(Date.now() + 10800000).toISOString(), status: "active" },
  { id: "s6", user: "Tom Bradley", email: "tom.bradley@gatevision.com", browser: "Chrome Mobile", os: "Android 14", device: "Phone", location: "Remote", started: new Date(Date.now() - 604800000).toISOString(), expires: new Date(Date.now() - 432000000).toISOString(), status: "expired" },
  { id: "s7", user: "Nina Patel", email: "nina.patel@gatevision.com", browser: "Chrome 125", os: "Windows 11", device: "Desktop", location: "Management Office", started: new Date(Date.now() - 7200000).toISOString(), expires: new Date(Date.now() + 7200000).toISOString(), status: "active" },
  { id: "s8", user: "David Kim", email: "david.kim@gatevision.com", browser: "Terminal", os: "Linux", device: "Server", location: "Data Center", started: new Date(Date.now() - 86400000).toISOString(), expires: new Date(Date.now() + 86400000).toISOString(), status: "idle" },
];

export const STATIC_NOTIFICATIONS: { templates: NotificationTemplate[]; rules: NotificationRule[] } = {
  templates: [
    { id: "nt1", name: "Manual Review Required", channel: "email", subject: "Manual Review Required — {{plate}}", body: "A manual review for vehicle {{plate}} requires your attention.", variables: ["plate", "gate", "confidence"], enabled: true },
    { id: "nt2", name: "Security Alert", channel: "sms", subject: "⚠️ Security Alert: {{title}}", body: "Security event: {{description}}", variables: ["title", "description", "severity"], enabled: true },
    { id: "nt3", name: "Daily Summary", channel: "email", subject: "GateVision Daily Summary — {{date}}", body: "{{entries}} entries, {{exits}} exits, {{denied}} denied", variables: ["date", "entries", "exits", "denied"], enabled: true },
    { id: "nt4", name: "System Alert", channel: "in_app", subject: "System {{status}}", body: "{{component}} is {{status}}", variables: ["component", "status"], enabled: true },
    { id: "nt5", name: "Review Escalation", channel: "push", subject: "Review Escalated: {{plate}}", body: "Review for {{plate}} has been escalated (pending {{hours}}h)", variables: ["plate", "hours"], enabled: false },
  ],
  rules: [
    { id: "nr1", event: "manual_review", channels: ["email", "in_app"], escalation: [{ delay: 30, channel: "sms" }] },
    { id: "nr2", event: "security_event_critical", channels: ["sms", "push", "in_app"], escalation: [{ delay: 5, channel: "sms" }] },
    { id: "nr3", event: "gate_offline", channels: ["email", "in_app"], escalation: [{ delay: 15, channel: "sms" }] },
    { id: "nr4", event: "system_degraded", channels: ["email", "in_app"], escalation: [{ delay: 60, channel: "sms" }] },
    { id: "nr5", event: "daily_summary", channels: ["email"], escalation: [] },
  ],
};

export const STATIC_ORGANIZATION: OrganizationNode[] = [
  { id: "dept-security", label: "Security Department", type: "department", status: "active", users: 5, children: [
    { id: "bldg-hq", label: "HQ Security Office", type: "building", status: "active", users: 3 },
    { id: "zone-north", label: "North Perimeter", type: "zone", status: "active", children: [
      { id: "gate-n", label: "North Gate", type: "gate", status: "active" },
    ]},
    { id: "zone-south", label: "South Perimeter", type: "zone", status: "active", children: [
      { id: "gate-s", label: "South Gate", type: "gate", status: "warning" },
    ]},
    { id: "zone-visitor", label: "Visitor Area", type: "zone", status: "active", children: [
      { id: "gate-v", label: "Visitor Gate", type: "gate", status: "active" },
    ]},
  ]},
  { id: "dept-operations", label: "Operations", type: "department", status: "active", users: 4, children: [
    { id: "bldg-ops", label: "Operations Center", type: "building", status: "active", users: 3 },
    { id: "zone-loading", label: "Loading Bay", type: "zone", status: "active" },
  ]},
  { id: "dept-it", label: "IT & Infrastructure", type: "department", status: "active", users: 2, children: [
    { id: "bldg-dc", label: "Data Center", type: "building", status: "active", users: 1 },
    { id: "bldg-noc", label: "NOC", type: "building", status: "active", users: 1 },
  ]},
  { id: "dept-management", label: "Management", type: "department", status: "active", users: 2 },
  { id: "dept-facilities", label: "Facilities", type: "department", status: "active", users: 1 },
  { id: "dept-legal", label: "Legal & Compliance", type: "department", status: "active", users: 1 },
  { id: "dept-hr", label: "Human Resources", type: "department", status: "active", users: 1 },
];

export const STATIC_SECURITY_SCORE: SecurityScoreBreakdown = {
  mfaAdoption: 72,
  failedLoginsScore: 88,
  passwordStrength: 85,
  activeSessionsScore: 78,
  permissionHygiene: 82,
  auditCompliance: 90,
};

export const STATIC_INSIGHTS: AdminInsight[] = [
  { id: "ai-1", type: "critical", message: "3 high-severity security events require acknowledgment", recommendation: "Review and acknowledge events in the Security Events tab", timestamp: new Date().toISOString() },
  { id: "ai-2", type: "warning", message: "Manual review queue growing — 7 pending reviews", recommendation: "Assign reviewers to clear pending reviews", timestamp: new Date().toISOString() },
  { id: "ai-3", type: "warning", message: "2 user accounts have been inactive for over 30 days", recommendation: "Review inactive accounts and consider suspension", timestamp: new Date().toISOString() },
  { id: "ai-4", type: "info", message: "MFA adoption at 72% — below 90% target", recommendation: "Enforce MFA for all privileged accounts", timestamp: new Date().toISOString() },
  { id: "ai-5", type: "info", message: "Permission hygiene score 82 — 4 over-privileged accounts", recommendation: "Audit and adjust role assignments", timestamp: new Date().toISOString() },
  { id: "ai-6", type: "info", message: "System health: All services operational", recommendation: "Continue routine monitoring", timestamp: new Date().toISOString() },
];

export const STATIC_ACTIVITY: ActivityEntry[] = [
  { id: "act-1", time: new Date(Date.now() - 600000).toISOString(), action: "approved", detail: "Manual review approved — ABC-123X", user: "Sarah Chen", type: "approved" },
  { id: "act-2", time: new Date(Date.now() - 1200000).toISOString(), action: "login", detail: "Logged in from Chrome on Windows 11", user: "Alex Drake", type: "login" },
  { id: "act-3", time: new Date(Date.now() - 1800000).toISOString(), action: "updated", detail: "Updated permission for role 'operator'", user: "Lisa Wong", type: "updated" },
  { id: "act-4", time: new Date(Date.now() - 3600000).toISOString(), action: "created", detail: "Created new user account — Oscar Torres", user: "Alex Drake", type: "created" },
  { id: "act-5", time: new Date(Date.now() - 7200000).toISOString(), action: "rejected", detail: "Manual review rejected — PQR-556M", user: "Mike Park", type: "rejected" },
  { id: "act-6", time: new Date(Date.now() - 14400000).toISOString(), action: "deleted", detail: "Removed inactive session for Tom Bradley", user: "David Kim", type: "deleted" },
  { id: "act-7", time: new Date(Date.now() - 21600000).toISOString(), action: "warning", detail: "Failed login attempt detected for user Rachel Green", user: "System", type: "warning" },
  { id: "act-8", time: new Date(Date.now() - 28800000).toISOString(), action: "login", detail: "Logged in from Safari on macOS", user: "Emma Davis", type: "login" },
  { id: "act-9", time: new Date(Date.now() - 43200000).toISOString(), action: "updated", detail: "Changed password for account u9", user: "John Miller", type: "updated" },
  { id: "act-10", time: new Date(Date.now() - 86400000).toISOString(), action: "approved", detail: "Bulk approved 5 manual reviews", user: "Frank Castle", type: "approved" },
  { id: "act-11", time: new Date(Date.now() - 172800000).toISOString(), action: "created", detail: "Configured new notification rule for critical events", user: "Lisa Wong", type: "created" },
  { id: "act-12", time: new Date(Date.now() - 259200000).toISOString(), action: "logout", detail: "Session expired after inactivity", user: "Nina Patel", type: "logout" },
];

export const STATIC_QUICK_ACTIONS: QuickAction[] = [
  { id: "qa1", label: "Create User", description: "Add new operator or officer", icon: "user-plus", variant: "default", action: "create-user" },
  { id: "qa2", label: "Run Audit", description: "Generate compliance report", icon: "file-search", variant: "secondary", action: "run-audit" },
  { id: "qa3", label: "Clear Backlog", description: "Process pending reviews", icon: "check-circle", variant: "secondary", action: "clear-backlog" },
  { id: "qa4", label: "View Events", description: "Check security timeline", icon: "alert-triangle", variant: "outline", action: "view-events" },
  { id: "qa5", label: "Review Permissions", description: "Audit RBAC matrix", icon: "shield", variant: "outline", action: "review-permissions" },
  { id: "qa6", label: "Export Reports", description: "Download system reports", icon: "download", variant: "outline", action: "export-reports" },
  { id: "qa7", label: "Check Health", description: "System infrastructure status", icon: "monitor", variant: "outline", action: "check-health" },
  { id: "qa8", label: "Emergency Mode", description: "Lockdown all gates", icon: "lock", variant: "destructive", action: "emergency" },
];
