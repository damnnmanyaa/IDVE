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

  if (action.includes("approv")) return "APPROVED";
  if (action.includes("reject")) return "REJECTED";

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
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const hasLoggedLoginEvent = useRef(false);

  useEffect(() => {
    return () => {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    };
  }, [documentPreviewUrl]);

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
    setDocumentPreviewUrl("");
    setSelectedUser(userItem);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setDocumentPreviewUrl("");
  };

  const openDocumentPreview = async () => {
    if (!selectedUser?.id) return;
    setIsLoadingDocument(true);
    try {
      const response = await api.get(`/api/admin/users/${selectedUser.id}/document`, {
        responseType: "blob",
      });
      setDocumentPreviewUrl(URL.createObjectURL(response.data));
    } catch (err) {
      pushToast("error", err?.response?.data?.message || "Unable to open this document.");
    } finally {
      setIsLoadingDocument(false);
    }
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

  const resetDemoWorkspace = async () => {
    const confirmed = window.confirm("Clear all user accounts, uploaded demo documents, OTPs, and audit history? The admin account will stay available.");
    if (!confirmed || isResettingDemo) return;
    setIsResettingDemo(true);
    try {
      await api.delete("/api/admin/demo-data");
      setUsers([]);
      setAuditLogs([]);
      setSelectedUser(null);
      setDocumentPreviewUrl("");
      pushToast("success", "Demo workspace cleared. Visitors can start again.");
    } catch (resetError) {
      pushToast("error", resetError?.response?.data?.message || "Unable to reset the demo workspace.");
    } finally {
      setIsResettingDemo(false);
    }
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          VERIFIED
        </span>
      );
    }
    if (statusVal === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="h-3 w-3" />
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" />
        PENDING REVIEW
      </span>
    );
  };

  return (
    <div className="idve-app min-h-screen bg-slate-50 text-slate-900 flex">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-30 justify-between p-5">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-800 text-white flex items-center justify-center font-bold">
              <Shield className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">IDVE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 font-medium">ADMIN</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-cyan-50 text-cyan-900 font-medium text-sm border border-cyan-100">
              <LayoutDashboard className="h-4 w-4 text-slate-900" />
              <span>Admin Console</span>
            </button>
            <button onClick={() => document.getElementById("applicant-queue")?.scrollIntoView({ behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition text-sm font-medium">
              <Users className="h-4 w-4 text-slate-500" />
              <span>User Management</span>
            </button>
            <button onClick={() => document.getElementById("audit-log")?.scrollIntoView({ behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition text-sm font-medium">
              <Activity className="h-4 w-4 text-slate-500" />
              <span>Security Audit Logs</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-700 hover:text-rose-800 hover:bg-rose-50 transition text-sm font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3.5 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Admin Console</h1>

          <div className="flex items-center gap-4">
            {import.meta.env.VITE_DEMO_MODE === "true" && (
              <button
                type="button"
                onClick={resetDemoWorkspace}
                disabled={isResettingDemo}
                className="inline-flex rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-2 py-2 text-[10px] font-medium text-amber-800 transition hover:bg-amber-400/[0.12] disabled:opacity-50 sm:px-3 sm:text-[11px]"
              >
                {isResettingDemo ? "Resetting…" : "Reset demo data"}
              </button>
            )}
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-slate-900">{adminIdentity.name}</p>
              <p className="text-[11px] text-slate-500 max-w-[160px] truncate">{adminIdentity.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-slate-50 hover:bg-slate-200 border border-slate-200 text-slate-900 text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Identity & Access Review</h2>
            <p className="text-sm text-slate-600 mt-1">Review identity verification requests, approve users, and inspect security audit logs.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Total Identities</span>
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-[11px] text-slate-500">Registered accounts</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Pending Review</span>
                <Clock className="h-4 w-4 text-amber-700" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-[11px] text-slate-500">Awaiting admin decision</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Verified Users</span>
                <UserCheck className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{stats.verified}</p>
              <p className="text-[11px] text-slate-500">Approved access</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Rejected Requests</span>
                <UserX className="h-4 w-4 text-rose-700" />
              </div>
              <p className="text-2xl font-bold text-rose-700">{stats.rejected}</p>
              <p className="text-[11px] text-slate-500">Access denied</p>
            </div>
          </div>

          {/* Users Table Card */}
          <div id="applicant-queue" className="rounded-xl bg-white border border-slate-200 overflow-hidden scroll-mt-24">
            
            {/* Search & Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  aria-label="Search applicants by name or email"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 text-xs pl-9 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700"
                />
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-700"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <select
                  aria-label="Filter by verification status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-700"
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
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-900">
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-[#F4F4F5] animate-spin" />
                          <span>Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !hasUsers && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        <Users className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
                        <p>No user accounts registered.</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading && hasUsers && !hasFilteredUsers && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        <Search className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
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
                          className="hover:bg-slate-50/60 transition cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-medium text-slate-900">{userItem.name}</td>
                          <td className="px-4 py-3.5 text-slate-600">{userItem.email}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-50 text-[11px] font-semibold text-slate-900 border border-slate-200">
                              {normalizeRole(userItem.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 max-w-[14rem] truncate">
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
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-cyan-800 text-white hover:bg-cyan-900 active:bg-zinc-200 disabled:opacity-30 transition flex items-center gap-1 shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-700" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => confirmAndHandleAction(userItem.id, "reject", userItem.email)}
                                disabled={isRejectDisabled}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-rose-700 border border-rose-200 hover:bg-rose-50 disabled:opacity-30 transition flex items-center gap-1"
                              >
                                <X className="h-3.5 w-3.5 text-rose-700" />
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
          <div id="audit-log" className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Security Audit Log</h3>
                <p className="text-xs text-slate-600 mt-0.5">Real-time system events, authentication requests, and admin actions.</p>
              </div>
              <span className="text-xs text-slate-500">{auditLogs.length} events logged</span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">User Email</th>
                    <th className="px-4 py-2.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 text-slate-900">
                  {isAuditLoading && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-500">Loading logs...</td>
                    </tr>
                  )}

                  {!isAuditLoading && auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-500">No audit logs available.</td>
                    </tr>
                  )}

                  {!isAuditLoading &&
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition">
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.action === "LOGIN"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : log.action === "OTP"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{log.userEmail}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{formatTimestamp(log.timestamp)}</td>
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
            className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-slate-900" />
                <h3 className="text-base font-semibold text-slate-900">Verification Review Interface</h3>
              </div>
              <button
                onClick={closeUserDetails}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Left/Right Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-6 gap-6">
              
              {/* LEFT COLUMN: DOCUMENT */}
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">DOCUMENT</span>
                
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 break-all">
                      {formatDocumentLabel(selectedUserDocument)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Uploaded Identity Artifact</p>
                  </div>

                  {selectedUserDocument ? (
                    <button
                      type="button"
                      onClick={openDocumentPreview}
                      disabled={isLoadingDocument}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-xs font-medium text-slate-900 hover:bg-zinc-700 transition disabled:opacity-60"
                    >
                      <span>{isLoadingDocument ? "Loading document…" : "Open document preview"}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No document file attached</p>
                  )}
                  {documentPreviewUrl && (
                    <iframe
                      title={`Identity document for ${selectedUser.name || "applicant"}`}
                      src={documentPreviewUrl}
                      className="h-72 w-full rounded-lg border border-slate-200 bg-white"
                    />
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: APPLICANT & DECISION */}
              <div className="space-y-5">
                
                {/* APPLICANT SECTION */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">APPLICANT</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-500" /> Name</span>
                      <span className="font-semibold text-slate-900">{selectedUser.name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /> Email</span>
                      <span className="font-semibold text-slate-900 max-w-[180px] truncate">{selectedUser.email || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-slate-500" /> Role</span>
                      <span className="px-2 py-0.5 rounded bg-slate-50 font-semibold text-slate-900 border border-slate-200">
                        {normalizeRole(selectedUser.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VERIFICATION STATUS */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">VERIFICATION STATUS</span>
                  <div>
                    {renderStatusBadge(normalizeStatus(selectedUser.verificationStatus))}
                  </div>
                </div>

                {/* VERIFICATION DECISION BUTTONS */}
                <div className="space-y-2.5 pt-3 border-t border-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">VERIFICATION DECISION</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => confirmAndHandleAction(selectedUser.id, "approve", selectedUser.email)}
                      disabled={normalizeStatus(selectedUser.verificationStatus) === "VERIFIED"}
                      className="w-full bg-cyan-800 text-white font-semibold py-2 px-3 rounded-lg hover:bg-cyan-900 active:bg-zinc-200 disabled:opacity-30 transition flex items-center justify-center gap-1.5 text-xs shadow-md"
                    >
                      <Check className="h-4 w-4 text-emerald-700" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => confirmAndHandleAction(selectedUser.id, "reject", selectedUser.email)}
                      disabled={normalizeStatus(selectedUser.verificationStatus) === "REJECTED"}
                      className="w-full bg-slate-50 text-rose-700 border border-rose-200 hover:bg-rose-50 disabled:opacity-30 transition font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs"
                    >
                      <X className="h-4 w-4 text-rose-700" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3.5 border-t border-slate-200 bg-slate-50">
              <button
                onClick={closeUserDetails}
                className="px-4 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-medium transition"
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
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
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
