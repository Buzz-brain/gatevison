import { useState, useCallback, useMemo } from "react";
import {
  useAdminDashboard, useAdminReviews, useAdminEvents,
  useAdminHealth, useAdminModels, useAdminPerformance,
  useApproveReviewMutation, useRejectReviewMutation,
} from "./use-admin-api";
import {
  STATIC_USERS, STATIC_ROLES, STATIC_RBAC_ENTRIES, STATIC_PERMISSION_TREE,
  STATIC_SESSIONS, STATIC_NOTIFICATIONS, STATIC_ORGANIZATION,
  STATIC_SECURITY_SCORE, STATIC_INSIGHTS, STATIC_ACTIVITY,
  STATIC_QUICK_ACTIONS,
} from "../constants";
import { mapCommandMatrix } from "../api/mapper";
import type { AdminUser, ManualReview, SecurityEvent } from "../types";

export function useAdmin() {
  const { data: dashboardData, isLoading: dashLoading, isError: dashError } = useAdminDashboard();
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError } = useAdminReviews();
  const { data: eventsData, isLoading: eventsLoading } = useAdminEvents();
  const { data: health, isLoading: healthLoading } = useAdminHealth();
  const { data: models, isLoading: modelsLoading } = useAdminModels();
  const { data: performance } = useAdminPerformance();
  const approveReview = useApproveReviewMutation();
  const rejectReview = useRejectReviewMutation();

  const isLoading = dashLoading || reviewsLoading || eventsLoading || healthLoading || modelsLoading;
  const isError = dashError || reviewsError;

  const events = useMemo(() => eventsData?.items ?? [], [eventsData]);

  const metrics = dashboardData?.metrics ?? null;

  const stats = useMemo(() => ({
    totalUsers: STATIC_USERS.length,
    onlineUsers: STATIC_USERS.filter((u) => u.status === "active").length,
    admins: STATIC_USERS.filter((u) => u.role === "admin").length,
    securityOfficers: STATIC_USERS.filter((u) => u.role === "security_officer").length,
    pendingReviews: reviews?.filter((r) => r.status === "pending").length ?? metrics?.manual_reviews ?? 0,
    securityEventsToday: events.length,
    failedLogins: 0,
    activeSessions: STATIC_SESSIONS.filter((s) => s.status === "active").length,
    permissionChanges: 0,
  }), [reviews, events, metrics]);

  const commandMatrix = useMemo(() =>
    mapCommandMatrix(metrics, health ?? null, models ?? null, reviews?.length ?? 0),
    [metrics, health, models, reviews],
  );

  const [users] = useState<AdminUser[]>(STATIC_USERS);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userDeptFilter, setUserDeptFilter] = useState<string>("all");

  const filteredUsers = users.filter((u) => {
    if (userStatusFilter !== "all" && u.status !== userStatusFilter) return false;
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (userDeptFilter !== "all" && u.department !== userDeptFilter) return false;
    if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase()) && !u.email.toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const toggleUserSelection = useCallback((id: string) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);
  const selectAllUsers = useCallback(() => {
    setSelectedUsers((prev) => prev.length === filteredUsers.length ? [] : filteredUsers.map((u) => u.id));
  }, [filteredUsers]);

  const [auditSearch, setAuditSearch] = useState("");
  const [auditModule, setAuditModule] = useState<string>("all");
  const [auditSeverity, setAuditSeverity] = useState<string>("all");

  const auditLogs = useMemo(() => {
    const logs = events.map((e) => ({
      id: e.id, user: e.user ?? "system", action: e.type, target: e.module,
      detail: e.description, timestamp: e.timestamp,
      result: (e.severity === "critical" ? "failure" : e.severity === "warning" ? "warning" : "success") as "success" | "failure" | "warning",
      ip: "", device: "", requestId: "", module: e.module, severity: e.severity,
    }));
    return logs.filter((a) => {
      if (auditModule !== "all" && a.module !== auditModule) return false;
      if (auditSeverity !== "all" && a.severity !== auditSeverity) return false;
      if (auditSearch && !a.user.toLowerCase().includes(auditSearch.toLowerCase()) && !a.action.toLowerCase().includes(auditSearch.toLowerCase())) return false;
      return true;
    });
  }, [events, auditModule, auditSeverity, auditSearch]);

  const [eventFilter, setEventFilter] = useState<string>("all");
  const filteredEvents = eventFilter === "all" ? events : events.filter((e) => e.severity === eventFilter);

  const acknowledgeEvent = useCallback((id: string) => {}, []);

  const updateReview = useCallback((id: string, status: ManualReview["status"], notes?: string) => {
    if (status === "approved") approveReview.mutate({ id, data: { status, reviewer: "admin", notes } });
    else if (status === "rejected") rejectReview.mutate({ id, data: { status, reviewer: "admin", notes } });
  }, [approveReview, rejectReview]);

  const [activeTab, setActiveTab] = useState("overview");
  const [sessionView, setSessionView] = useState("active");

  return {
    users, filteredUsers, selectedUser, setSelectedUser,
    userSearch, setUserSearch, userStatusFilter, setUserStatusFilter,
    userRoleFilter, setUserRoleFilter, userDeptFilter, setUserDeptFilter,
    selectedUsers, toggleUserSelection, selectAllUsers,
    roles: STATIC_ROLES, rbacEntries: STATIC_RBAC_ENTRIES, permissionTree: STATIC_PERMISSION_TREE,
    reviews: reviews ?? [], updateReview,
    auditLogs, auditSearch, setAuditSearch,
    auditModule, setAuditModule, auditSeverity, setAuditSeverity,
    events: filteredEvents, eventFilter, setEventFilter, acknowledgeEvent, allEvents: events,
    sessions: STATIC_SESSIONS, sessionView, setSessionView,
    notifications: STATIC_NOTIFICATIONS,
    organization: STATIC_ORGANIZATION,
    stats, securityScore: STATIC_SECURITY_SCORE,
    insights: STATIC_INSIGHTS, activity: STATIC_ACTIVITY,
    quickActions: STATIC_QUICK_ACTIONS, commandMatrix,
    activeTab, setActiveTab,
    isLoading, isError,
    health, models, performance, dashboardData,
  };
}

export type AdminApi = ReturnType<typeof useAdmin>;
