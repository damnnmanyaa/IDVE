import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const STATUS_STYLES = {
  VERIFIED: "ui-status-verified",
  PENDING: "ui-status-pending",
  REJECTED: "ui-status-rejected",
};

const ROLE_STYLES = {
  USER: "ui-role-user",
  ADMIN: "ui-role-admin",
};

const StatusIcon = ({ status }) => {
  if (status === "VERIFIED") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
        <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "REJECTED") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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
    return "No document";
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

const getAuditActionStyle = (action) => {
  if (action === "LOGIN") {
    return "border-blue-200 bg-blue-100 text-blue-800";
  }

  if (action === "OTP") {
    return "border-indigo-200 bg-indigo-100 text-indigo-800";
  }

  return "border-gray-400 bg-gray-100 text-gray-800";
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

    return users.filter((user) => {
      const normalizedRole = normalizeRole(user.role);
      const normalizedStatus = normalizeStatus(user.verificationStatus);
      const name = String(user.name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();

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
          rows.map((user) => ({
            ...user,
            role: normalizeRole(user.role),
            verificationStatus: normalizeStatus(user.verificationStatus),
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

  const openUserDetails = (user) => {
    setSelectedUser(user);
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

  return (
    <div className="ui-app-shell min-h-screen">
      <aside className="ui-sidebar fixed left-0 top-0 hidden h-screen w-64 border-r p-6 lg:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="ui-brand-mark h-3.5 w-3.5 rounded" />
          <p className="text-xl font-semibold tracking-wide">IDVE</p>
        </div>

        <nav className="space-y-2">
          <button className="ui-sidebar-active w-full rounded-lg px-3 py-2 text-left">Dashboard</button>
          <button className="ui-sidebar-item w-full rounded-lg px-3 py-2 text-left">Users</button>
          <button className="ui-sidebar-item w-full rounded-lg px-3 py-2 text-left">Audit Logs</button>
          <button className="ui-sidebar-item w-full rounded-lg px-3 py-2 text-left">Settings</button>
        </nav>
      </aside>

      <div className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="ui-page-title">Admin Dashboard</h1>

            <div className="flex items-center gap-4">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-gray-900">{adminIdentity.name}</p>
                <p className="text-xs text-gray-500">{adminIdentity.email}</p>
              </div>
              <button
                onClick={logout}
                className="ui-button-primary"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="ui-card mb-6 p-5 md:p-6">
              <p className="text-sm text-gray-500">Manage users and verification decisions.</p>
            </div>

            {error && (
              <div className="ui-feedback ui-feedback-error mb-4">
                {error}
              </div>
            )}

            <div className="ui-card overflow-hidden">
              <div className="px-4 md:px-5 py-4 border-b border-gray-200 bg-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="w-full md:max-w-sm">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email"
                      className="ui-input px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:justify-end">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="ui-input rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="ui-input rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Document</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={6}>
                          <div className="flex items-center gap-3">
                            <span className="ui-spinner" />
                            <span>Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!isLoading && !hasUsers && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={6}>
                          No users found.
                        </td>
                      </tr>
                    )}

                    {!isLoading && hasUsers && !hasFilteredUsers && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={6}>
                          No matching users for current search/filters.
                        </td>
                      </tr>
                    )}

                    {!isLoading &&
                      filteredUsers.map((user) => {
                        const isBusy = !!busyByUserId[user.id];
                        const status = normalizeStatus(user.verificationStatus);
                        const isApproveDisabled = isBusy || isLoading || status === "VERIFIED";
                        const isRejectDisabled = isBusy || isLoading || status === "REJECTED";

                        return (
                          <tr
                            key={user.id}
                            onClick={() => openUserDetails(user)}
                            className="cursor-pointer border-t border-gray-200 transition-colors hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 text-gray-900 font-medium">{user.name}</td>
                            <td className="px-4 py-3 text-gray-700 break-all">{user.email}</td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className={`ui-badge ${ROLE_STYLES[normalizeRole(user.role)] || "ui-role-user"}`}>
                                {normalizeRole(user.role)}
                              </span>
                            </td>
                            <td className="max-w-[15rem] px-4 py-3 text-gray-700" title={user.documentPath || "No document"}>
                              <span className="block min-w-0 truncate">{formatDocumentLabel(user.documentPath)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`ui-badge ${STATUS_STYLES[status]}`} 
                              >
                                <StatusIcon status={status} />
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    confirmAndHandleAction(user.id, "approve", user.email);
                                  }}
                                  disabled={isApproveDisabled}
                                  title={status === "VERIFIED" ? "Already approved" : "Approve user"}
                                  className="ui-button-success px-3 py-1.5 text-xs"
                                >
                                  <span aria-hidden="true">✔</span>
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    confirmAndHandleAction(user.id, "reject", user.email);
                                  }}
                                  disabled={isRejectDisabled}
                                  title={status === "REJECTED" ? "Already rejected" : "Reject user"}
                                  className="ui-button-danger px-3 py-1.5 text-xs"
                                >
                                  <span aria-hidden="true">✖</span>
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

            <section className="ui-card mt-6 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">Audit Logs</h2>
                  <p className="text-sm text-gray-500">Track login, OTP, and admin actions.</p>
                </div>
                <span className="text-xs font-medium text-gray-500">{auditLogs.length} events</span>
              </div>

              <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Action</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">User Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-800">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isAuditLoading && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="ui-spinner" />
                            <span>Loading audit logs...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!isAuditLoading && auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-5 text-gray-500">
                          No audit logs available yet.
                        </td>
                      </tr>
                    )}

                    {!isAuditLoading && auditLogs.map((log) => (
                      <tr key={log.id} className="border-t border-gray-200 transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
<span
                             className={`ui-badge ${getAuditActionStyle(log.action)}`}
                           >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 break-all">{log.userEmail}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeUserDetails}
        >
          <div
            className="ui-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl md:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                <p className="text-sm text-gray-500 mt-1">Detailed information for the selected user.</p>
              </div>
              <button
                onClick={closeUserDetails}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                aria-label="Close user detail modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="ui-section-label mb-1">Name</p>
                <p className="text-sm font-medium text-gray-900">{selectedUser.name || "-"}</p>
              </div>

              <div>
                <p className="ui-section-label mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900 break-all">{selectedUser.email || "-"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="ui-section-label mb-1">Role</p>
                  <span className={`ui-badge ${ROLE_STYLES[normalizeRole(selectedUser.role)] || "ui-role-user"}`}>
                    {normalizeRole(selectedUser.role)}
                  </span>
                </div>

                <div>
                  <p className="ui-section-label mb-1">Status</p>
                  <span
                    className={`ui-badge ${STATUS_STYLES[normalizeStatus(selectedUser.verificationStatus)]}`}
                  >
                    <StatusIcon status={normalizeStatus(selectedUser.verificationStatus)} />
                    {normalizeStatus(selectedUser.verificationStatus)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Uploaded Document</p>

                {selectedUserDocument ? (
                  selectedUserDocument.startsWith("http://") ||
                  selectedUserDocument.startsWith("https://") ||
                  selectedUserDocument.startsWith("/") ? (
                    <a
                      href={selectedUserDocument}
                      target="_blank"
                      rel="noreferrer"
                      className="ui-link text-sm font-medium"
                    >
                      View uploaded document
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{selectedUserDocument}</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">No document uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeUserDetails}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[60] space-y-2 w-[min(92vw,22rem)] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm text-sm pointer-events-auto ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <span className="font-semibold">{toast.type === "success" ? "Success" : "Error"}</span>
                <span className="text-current/90">{toast.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
