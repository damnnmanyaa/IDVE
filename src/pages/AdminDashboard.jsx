import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import {
  Shield,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  LogOut,
  FileText,
  ExternalLink,
  X,
  Check,
  Activity,
  UserCheck,
  UserX,
  ShieldAlert,
  Settings,
  LayoutDashboard,
  User,
  Mail,
  Lock,
  FileCheck
} from "lucide-react";

const normalizeStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "VERIFIED" || normalized === "REJECTED") return normalized;
  return "PENDING";
};

const normalizeRole = (value) => {
  const normalized = String(value || "USER").toUpperCase();
  return normalized.replace(/^ROLE_/i, "");
};

const formatDocumentLabel = (value) => {
  const path = String(value || "").trim();
  if (!path) {
    return "No document uploaded";
  }

  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
};

const normalizeAuditAction = (value) => {
  const action = String(value || "").toLowerCase();

  if (action.includes("otp")) {
    return "OTP";
  }

  if (action.includes("login")) {
    return "LOGIN";
  }

  return "ADMIN ACTION";
};

const formatTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyByUserId, setBusyByUserId] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const hasLoggedLoginEvent = useRef(false);

  const hasUsers = useMemo(() => users.length > 0, [users]);
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((userItem) => {
      const normalizedRole = normalizeRole(userItem.role);
      const normalizedStatus = normalizeStatus(userItem.verificationStatus);
      const name = String(userItem.name || "").toLowerCase();
      const email = String(userItem.email || "").toLowerCase();

      const matchesQuery = !query || name.includes(query) || email.includes(query);
      const matchesRole = roleFilter === "ALL" || normalizedRole === roleFilter;
      const matchesStatus = statusFilter === "ALL" || normalizedStatus === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const hasFilteredUsers = useMemo(() => filteredUsers.length > 0, [filteredUsers]);

  const selectedUserDocument = useMemo(() => {
    if (!selectedUser) {
      return "";
    }

    const candidate =
      selectedUser.documentUrl ||
      selectedUser.uploadedDocumentUrl ||
      selectedUser.uploadedDocument ||
      selectedUser.documentName ||
      selectedUser.documentPath ||
      selectedUser.document ||
      "";

    return typeof candidate === "string" ? candidate : "";
  }, [selectedUser]);

  const stats = useMemo(() => {
    const total = users.length;
    const pending = users.filter((u) => normalizeStatus(u.verificationStatus) === "PENDING").length;
    const verified = users.filter((u) => normalizeStatus(u.verificationStatus) === "VERIFIED").length;
    const rejected = users.filter((u) => normalizeStatus(u.verificationStatus) === "REJECTED").length;

    return { total, pending, verified, rejected };
  }, [users]);

  const adminIdentity = useMemo(() => {
    let name = user?.name || "";
    let email = user?.email || "";

    if (!email) {
      try {
        const token = localStorage.getItem("token") || "";
        const claims = jwtDecode(token);
        email = claims?.email || claims?.sub || "";
      } catch {
        // Keep fallback values when token cannot be decoded.
      }
    }

    if (!name && email) {
      name = email.split("@")[0] || "Admin";
    }

    return {
      name: name || "Admin",
      email: email || "admin@idve.local",
    };
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const res = await api.get("/api/admin/users");
        const rows = Array.isArray(res.data) ? res.data : [];
        setUsers(
          rows.map((userItem) => ({
            ...userItem,
            role: normalizeRole(userItem.role),
            verificationStatus: normalizeStatus(userItem.verificationStatus),
          }))
        );
      } catch (err) {
        const message = err?.response?.data?.message || "Unable to load users.";
        setError(message);
        pushToast("error", message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAction = async (userId, action, userEmail = "") => {
    const endpoint = action === "approve" ? "approve" : "reject";

    setBusyByUserId((prev) => ({ ...prev, [userId]: true }));
    setError("");

    try {
      const res = await api.patch(`/api/admin/users/${userId}/${endpoint}`);
      const updated = res.data;

      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId
            ? {
                ...item,
                ...updated,
                role: normalizeRole(updated?.role || item.role),
                verificationStatus: normalizeStatus(
                  updated?.verificationStatus || item.verificationStatus
                ),
              }
            : item
        )
      );

      setSelectedUser((prev) => {
        if (!prev || prev.id !== userId) {
          return prev;
        }

        return {
          ...prev,
          ...updated,
          role: normalizeRole(updated?.role || prev.role),
          verificationStatus: normalizeStatus(
            updated?.verificationStatus || prev.verificationStatus
          ),
        };
      });

      appendAuditLog("admin action", userEmail || updated?.email || "-");
      pushToast(
        "success",
        `User ${action === "approve" ? "approved" : "rejected"} successfully.`
      );
    } catch (err) {
      const message = err?.response?.data?.message || "Action failed. Please try again.";
      setError(message);
      pushToast("error", message);
    } finally {
      setBusyByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const openUserDetails = (userItem) => {
    setSelectedUser(userItem);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const appendAuditLog = (action, userEmail, timestamp = new Date().toISOString()) => {
    setAuditLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action: normalizeAuditAction(action),
        userEmail: userEmail || "-",
        timestamp,
      },
      ...prev,
    ]);
  };

  const confirmAndHandleAction = (userId, action, userEmail) => {
    const actionLabel = action === "approve" ? "approve" : "reject";
    const isConfirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this user?`
    );

    if (!isConfirmed) {
      return;
    }

    handleAction(userId, action, userEmail);
  };

  useEffect(() => {
    if (hasLoggedLoginEvent.current || !adminIdentity.email) {
      return;
    }

    hasLoggedLoginEvent.current = true;
    appendAuditLog("login", adminIdentity.email);
  }, [adminIdentity.email]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsAuditLoading(true);

      try {
        const res = await api.get("/api/admin/audit-logs");
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!rows.length) {
          return;
        }

        const normalizedRows = rows.map((row, idx) => ({
          id: row.id || `api-log-${idx}`,
          action: normalizeAuditAction(row.action || row.event || row.type),
          userEmail: row.userEmail || row.email || row.user || "-",
          timestamp: row.timestamp || row.createdAt || row.time || new Date().toISOString(),
        }));

        setAuditLogs(normalizedRows);
      } catch {
        // Keep local audit events when backend endpoint is unavailable.
      } finally {
        setIsAuditLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const renderStatusBadge = (statusVal) => {
    if (statusVal === "VERIFIED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
          <CheckCircle2 className="h-3 w-3" />
          VERIFIED
        </span>
      );
    }
    if (statusVal === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
          <XCircle className="h-3 w-3" />
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
        <Clock className="h-3 w-3" />
        PENDING REVIEW
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5] flex">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 flex-col fixed inset-y-0 left-0 bg-[#111113] border-r border-[#27272A] z-30 justify-between p-5">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="h-8 w-8 rounded-lg bg-[#F4F4F5] text-[#09090B] flex items-center justify-center font-bold">
              <Shield className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#F4F4F5]">IDVE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] border border-[#27272A] font-mono">SOC ADMIN</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#18181B] text-[#F4F4F5] font-medium text-sm border border-[#27272A]">
              <LayoutDashboard className="h-4 w-4 text-[#F4F4F5]" />
              <span>Admin Console</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#18181B]/50 transition text-sm font-medium">
              <Users className="h-4 w-4 text-[#71717A]" />
              <span>User Management</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#18181B]/50 transition text-sm font-medium">
              <Activity className="h-4 w-4 text-[#71717A]" />
              <span>Security Audit Logs</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#27272A] space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#18181B]/50 transition text-sm font-medium">
            <Settings className="h-4 w-4 text-[#71717A]" />
            <span>Settings</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition text-sm font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#111113]/90 backdrop-blur border-b border-[#27272A] px-4 py-3.5 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#F4F4F5] tracking-tight">Admin Console</h1>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-[#F4F4F5]">{adminIdentity.name}</p>
              <p className="text-[11px] text-[#71717A] max-w-[160px] truncate">{adminIdentity.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#F4F4F5] text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          <div>
            <h2 className="text-2xl font-bold text-[#F4F4F5] tracking-tight">Identity & Access Review</h2>
            <p className="text-sm text-[#A1A1AA] mt-1">Review identity verification requests, approve users, and inspect security audit logs.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-[#EF4444] flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#111113] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#71717A] uppercase tracking-wider">
                <span>Total Identities</span>
                <Users className="h-4 w-4 text-[#A1A1AA]" />
              </div>
              <p className="text-2xl font-bold text-[#F4F4F5]">{stats.total}</p>
              <p className="text-[11px] text-[#71717A]">Registered accounts</p>
            </div>

            <div className="p-4 rounded-xl bg-[#111113] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#71717A] uppercase tracking-wider">
                <span>Pending Review</span>
                <Clock className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <p className="text-2xl font-bold text-[#F59E0B]">{stats.pending}</p>
              <p className="text-[11px] text-[#71717A]">Awaiting admin decision</p>
            </div>

            <div className="p-4 rounded-xl bg-[#111113] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#71717A] uppercase tracking-wider">
                <span>Verified Users</span>
                <UserCheck className="h-4 w-4 text-[#22C55E]" />
              </div>
              <p className="text-2xl font-bold text-[#22C55E]">{stats.verified}</p>
              <p className="text-[11px] text-[#71717A]">Approved access</p>
            </div>

            <div className="p-4 rounded-xl bg-[#111113] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#71717A] uppercase tracking-wider">
                <span>Rejected Requests</span>
                <UserX className="h-4 w-4 text-[#EF4444]" />
              </div>
              <p className="text-2xl font-bold text-[#EF4444]">{stats.rejected}</p>
              <p className="text-[11px] text-[#71717A]">Access denied</p>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="rounded-xl bg-[#111113] border border-[#27272A] overflow-hidden">
            
            {/* Search & Filter Toolbar */}
            <div className="p-4 border-b border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3.5 py-2 text-xs pl-9 outline-none focus:border-[#71717A] focus:ring-1 focus:ring-[#71717A]"
                />
                <Search className="h-3.5 w-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#71717A]"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#71717A]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151515] text-[#A1A1AA] font-semibold border-b border-[#27272A]">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/60 text-[#F4F4F5]">
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#71717A]">
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-[#27272A] border-t-[#F4F4F5] animate-spin" />
                          <span>Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !hasUsers && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#71717A]">
                        <Users className="h-5 w-5 text-[#71717A] mx-auto mb-1.5" />
                        <p>No user accounts registered.</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading && hasUsers && !hasFilteredUsers && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#71717A]">
                        <Search className="h-5 w-5 text-[#71717A] mx-auto mb-1.5" />
                        <p>No matching users for active filter criteria.</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    filteredUsers.map((userItem) => {
                      const isBusy = !!busyByUserId[userItem.id];
                      const status = normalizeStatus(userItem.verificationStatus);
                      const isApproveDisabled = isBusy || isLoading || status === "VERIFIED";
                      const isRejectDisabled = isBusy || isLoading || status === "REJECTED";

                      return (
                        <tr
                          key={userItem.id}
                          onClick={() => openUserDetails(userItem)}
                          className="hover:bg-[#18181B]/60 transition cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-medium text-[#F4F4F5]">{userItem.name}</td>
                          <td className="px-4 py-3.5 text-[#A1A1AA]">{userItem.email}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-[#18181B] text-[11px] font-semibold text-[#F4F4F5] border border-[#27272A]">
                              {normalizeRole(userItem.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[#A1A1AA] max-w-[14rem] truncate">
                            {formatDocumentLabel(userItem.documentPath)}
                          </td>
                          <td className="px-4 py-3.5">
                            {renderStatusBadge(status)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => confirmAndHandleAction(userItem.id, "approve", userItem.email)}
                                disabled={isApproveDisabled}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-[#F4F4F5] text-[#09090B] hover:bg-white active:bg-zinc-200 disabled:opacity-30 transition flex items-center gap-1 shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => confirmAndHandleAction(userItem.id, "reject", userItem.email)}
                                disabled={isRejectDisabled}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-[#18181B] text-rose-400 border border-rose-800/50 hover:bg-rose-950/40 disabled:opacity-30 transition flex items-center gap-1"
                              >
                                <X className="h-3.5 w-3.5 text-[#EF4444]" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="p-5 rounded-xl bg-[#111113] border border-[#27272A] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#F4F4F5]">Security Audit Log</h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Real-time system events, authentication requests, and admin actions.</p>
              </div>
              <span className="text-xs text-[#71717A]">{auditLogs.length} events logged</span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-[#27272A]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#151515] text-[#A1A1AA] font-semibold border-b border-[#27272A]">
                  <tr>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">User Email</th>
                    <th className="px-4 py-2.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/50 text-[#F4F4F5]">
                  {isAuditLoading && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-[#71717A]">Loading logs...</td>
                    </tr>
                  )}

                  {!isAuditLoading && auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-[#71717A]">No audit logs available.</td>
                    </tr>
                  )}

                  {!isAuditLoading &&
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#18181B]/40 transition">
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.action === "LOGIN"
                              ? "bg-blue-950/50 text-blue-400 border border-blue-800/50"
                              : log.action === "OTP"
                              ? "bg-indigo-950/50 text-indigo-400 border border-indigo-800/50"
                              : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#A1A1AA]">{log.userEmail}</td>
                        <td className="px-4 py-2.5 text-right text-[#71717A]">{formatTimestamp(log.timestamp)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Two-Column User Review Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closeUserDetails}
        >
          <div
            className="w-full max-w-3xl bg-[#111113] rounded-xl border border-[#27272A] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#151515]">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-[#F4F4F5]" />
                <h3 className="text-base font-semibold text-[#F4F4F5]">Verification Review Interface</h3>
              </div>
              <button
                onClick={closeUserDetails}
                className="p-1.5 rounded-lg bg-[#18181B] text-[#71717A] hover:text-[#F4F4F5] border border-[#27272A] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Left/Right Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#27272A] p-6 gap-6">
              
              {/* LEFT COLUMN: DOCUMENT */}
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] block">DOCUMENT</span>
                
                <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#27272A] text-[#F4F4F5] flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-[#A1A1AA]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F4F4F5] break-all">
                      {formatDocumentLabel(selectedUserDocument)}
                    </p>
                    <p className="text-xs text-[#71717A] mt-0.5">Uploaded Identity Artifact</p>
                  </div>

                  {selectedUserDocument ? (
                    selectedUserDocument.startsWith("http://") ||
                    selectedUserDocument.startsWith("https://") ||
                    selectedUserDocument.startsWith("/") ? (
                      <a
                        href={selectedUserDocument}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#27272A] text-xs font-medium text-[#F4F4F5] hover:bg-zinc-700 transition"
                      >
                        <span>Open document preview</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-xs font-mono text-[#A1A1AA] bg-[#111113] p-2 rounded border border-[#27272A] truncate">
                        {selectedUserDocument}
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-[#71717A] italic">No document file attached</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: APPLICANT & DECISION */}
              <div className="space-y-5">
                
                {/* APPLICANT SECTION */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] block">APPLICANT</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#A1A1AA]">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#71717A]" /> Name</span>
                      <span className="font-semibold text-[#F4F4F5]">{selectedUser.name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#A1A1AA]">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#71717A]" /> Email</span>
                      <span className="font-semibold text-[#F4F4F5] max-w-[180px] truncate">{selectedUser.email || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#A1A1AA]">
                      <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-[#71717A]" /> Role</span>
                      <span className="px-2 py-0.5 rounded bg-[#18181B] font-semibold text-[#F4F4F5] border border-[#27272A]">
                        {normalizeRole(selectedUser.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VERIFICATION STATUS */}
                <div className="space-y-2 pt-3 border-t border-[#27272A]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] block">VERIFICATION STATUS</span>
                  <div>
                    {renderStatusBadge(normalizeStatus(selectedUser.verificationStatus))}
                  </div>
                </div>

                {/* VERIFICATION DECISION BUTTONS */}
                <div className="space-y-2.5 pt-3 border-t border-[#27272A]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] block">VERIFICATION DECISION</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => confirmAndHandleAction(selectedUser.id, "approve", selectedUser.email)}
                      disabled={normalizeStatus(selectedUser.verificationStatus) === "VERIFIED"}
                      className="w-full bg-[#F4F4F5] text-[#09090B] font-semibold py-2 px-3 rounded-lg hover:bg-white active:bg-zinc-200 disabled:opacity-30 transition flex items-center justify-center gap-1.5 text-xs shadow-md"
                    >
                      <Check className="h-4 w-4 text-[#22C55E]" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => confirmAndHandleAction(selectedUser.id, "reject", selectedUser.email)}
                      disabled={normalizeStatus(selectedUser.verificationStatus) === "REJECTED"}
                      className="w-full bg-[#18181B] text-rose-400 border border-rose-800/50 hover:bg-rose-950/40 disabled:opacity-30 transition font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs"
                    >
                      <X className="h-4 w-4 text-[#EF4444]" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3.5 border-t border-[#27272A] bg-[#151515]">
              <button
                onClick={closeUserDetails}
                className="px-4 py-1.5 rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#F4F4F5] border border-[#27272A] text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[60] space-y-2 w-[min(92vw,22rem)] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl border shadow-xl text-xs font-medium pointer-events-auto flex items-center gap-2.5 ${
                toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-800/60 text-[#22C55E]"
                  : "bg-rose-950/90 border-rose-800/60 text-[#EF4444]"
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
