import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  Search,
  MoreHorizontal,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import type { AdminUser, UserStatus, RoleId, DepartmentId } from "../types";
import { ROLE_CONFIG, STATUS_CONFIG, DEPARTMENT_CONFIG, timeAgo, initials, getInitialsColor } from "../utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label })),
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  ...Object.entries(ROLE_CONFIG).map(([v, c]) => ({ value: v, label: c.label })),
];

const DEPT_OPTIONS = [
  { value: "", label: "All Departments" },
  ...Object.entries(DEPARTMENT_CONFIG).map(([v, c]) => ({ value: v, label: c.label })),
];

type SortKey = "name" | "department" | "role" | "status" | "lastLogin" | "sessions";

interface UserTableProps {
  users: AdminUser[];
  selectedUser: AdminUser | null;
  onSelect: (u: AdminUser | null) => void;
  selectedUsers: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  roleFilter: string;
  onRoleFilterChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
}

function StatusPillForUser({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, "active" | "inactive" | "danger" | "warning" | "pending"> = {
    active: "active",
    inactive: "inactive",
    locked: "danger",
    suspended: "warning",
    pending: "pending",
  };
  return <StatusPill status={map[status]} label={STATUS_CONFIG[status].label} />;
}

export function UserTable({
  users,
  selectedUser,
  onSelect,
  selectedUsers,
  onToggleSelect,
  onSelectAll,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  deptFilter,
  onDeptFilterChange,
}: UserTableProps) {
  const reduced = useReducedMotion();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((u) => u.status === statusFilter);
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    if (deptFilter) result = result.filter((u) => u.department === deptFilter);
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "department") cmp = a.department.localeCompare(b.department);
      else if (sortKey === "role") cmp = a.role.localeCompare(b.role);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "lastLogin") cmp = new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime();
      else if (sortKey === "sessions") cmp = a.sessionCount - b.sessionCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [users, search, statusFilter, roleFilter, deptFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const allSelected = paged.length > 0 && paged.every((u) => selectedUsers.includes(u.id));

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 text-foreground" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-foreground" />
    );
  }

  return (
    <Card>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { onStatusFilterChange(e.target.value); setPage(0); }}
          className="w-[150px]"
        />
        <Select
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(e) => { onRoleFilterChange(e.target.value); setPage(0); }}
          className="w-[170px]"
        />
        <Select
          options={DEPT_OPTIONS}
          value={deptFilter}
          onChange={(e) => { onDeptFilterChange(e.target.value); setPage(0); }}
          className="w-[170px]"
        />
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {selectedUsers.length} selected
            </Badge>
            <Button variant="outline" size="sm">Bulk Actions</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                {(
                  [
                    ["name", "User"],
                    ["department", "Department"],
                    ["role", "Role"],
                    ["status", "Status"],
                    ["lastLogin", "Last Login"],
                    ["sessions", "Sessions"],
                  ] as const
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="cursor-pointer select-none px-4 py-3"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon col={key} />
                    </div>
                  </th>
                ))}
                <th className="w-12 px-4 py-3">MFA</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((user) => {
                const deptConf = DEPARTMENT_CONFIG[user.department];
                const roleConf = ROLE_CONFIG[user.role];
                const isSelected = selectedUsers.includes(user.id);
                const isActive = selectedUser?.id === user.id;
                return (
                  <motion.tr
                    key={user.id}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
                      isActive && "bg-primary/5",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => onSelect(isActive ? null : user)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(user.id)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            style={{ backgroundColor: getInitialsColor(user.id) }}
                            className="text-xs text-white"
                          >
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        style={{ backgroundColor: `${deptConf.color}20`, color: deptConf.color }}
                      >
                        {deptConf.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        style={{ backgroundColor: `${roleConf.color}20`, color: roleConf.color }}
                      >
                        {roleConf.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPillForUser status={user.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {timeAgo(user.lastLogin)}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {user.sessionCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.mfa ? (
                        <Check className="inline h-4 w-4 text-green-500" />
                      ) : (
                        <X className="inline h-4 w-4 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No users found</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i === page ? "default" : "ghost"}
                  size="icon-xs"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon-xs"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
