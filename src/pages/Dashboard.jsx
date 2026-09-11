import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const StatusStateIcon = ({ status }) => {
  if (status === "VERIFIED") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "REJECTED") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const formatActivityTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [recentActivities, setRecentActivities] = useState([]);
  const [toasts, setToasts] = useState([]);

  const userInitials = useMemo(() => {
    const name = String(currentUser?.name || "").trim();
    if (!name) {
      return "U";
    }

    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[1]?.[0] || "" : "";
    return `${first}${second}`.toUpperCase() || "U";
  }, [currentUser?.name]);

  const statusMeta = useMemo(
    () => ({
      PENDING: {
        cardClass: "ui-status-panel-pending",
        iconClass: "ui-status-icon-pending",
        statusTextClass: "text-amber-900",
        message: "Your document is under review",
      },
      VERIFIED: {
        cardClass: "ui-status-panel-verified",
        iconClass: "ui-status-icon-verified",
        statusTextClass: "text-emerald-900",
        message: "Your identity is verified",
      },
      REJECTED: {
        cardClass: "ui-status-panel-rejected",
        iconClass: "ui-status-icon-rejected",
        statusTextClass: "text-rose-900",
        message: "Please re-upload your document",
      },
    }),
    []
  );

  const activeStatus = statusMeta[status] || statusMeta.PENDING;
  const isBusy = isFetchingUser || isUploading;

  const normalizeStatus = (value) => {
    const next = String(value || "").toUpperCase();
    if (next === "VERIFIED" || next === "REJECTED" || next === "PENDING") {
      return next;
    }
    return "PENDING";
  };

  const handleLogout = () => {
    logout();
  };

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const addActivity = (type, description, timestamp = new Date().toISOString()) => {
    setRecentActivities((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        description,
        timestamp,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsFetchingUser(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await api.get("/api/user/me");
        const user = res.data || {};
        const nextStatus = normalizeStatus(user.verificationStatus);
        const now = new Date().toISOString();

        setCurrentUser({
          name: user.name || "User",
          email: user.email || "-",
        });
        setStatus(nextStatus);
        setRecentActivities([
          {
            id: `activity-login-${now}`,
            type: "Login event",
            description: "You signed in to your dashboard.",
            timestamp: now,
          },
          {
            id: `activity-otp-${now}`,
            type: "OTP verification",
            description: "OTP verification completed for your account.",
            timestamp: now,
          },
        ]);
      } catch {
        logout();
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchCurrentUser();
  }, [logout, navigate]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage("");
    setUploadError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post("/api/user/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const nextStatus =
        res?.data?.verificationStatus || res?.data?.status || "PENDING";
      setStatus(normalizeStatus(nextStatus));
      setUploadMessage("Document uploaded successfully.");
      setSelectedFile(null);
      pushToast("success", "Document uploaded successfully.");
      addActivity(
        "Document upload",
        "Identity document uploaded successfully."
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        setUploadError("Upload API is not available yet on backend.");
        pushToast("error", "Upload API is not available yet on backend.");
      } else {
        setUploadError("Upload failed. Please try again.");
        pushToast("error", "Upload failed. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="ui-app-shell min-h-screen">

      {/* Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="ui-brand-mark h-5 w-5 rounded-md"></div>
          <h1 className="text-lg font-semibold">IDVE</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
          )}

<button
             disabled={isBusy}
             className="ui-button-secondary"
           >
            Dashboard
          </button>

          <Link
            to="/upload"
            aria-disabled={isBusy}
            onClick={(event) => {
              if (isBusy) {
                event.preventDefault();
              }
            }}
            className={`ui-button-primary ${
              isBusy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            Upload
          </Link>

          <button
            onClick={handleLogout}
            disabled={isBusy}
            className="ui-button-primary"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-10">
        <div className="ui-card lg:col-span-2 p-5 sm:p-6">
          <div className="mb-8">
            <h2 className="ui-page-title mb-2 md:text-4xl">
              Welcome back, {currentUser?.name || "User"}
            </h2>
            <p className="ui-body-copy">Manage your acount</p>
          </div>

          {isFetchingUser && (
            <div className="ui-card mb-6 p-5 md:p-6">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
                <span className="text-sm">Loading your dashboard...</span>
              </div>
            </div>
          )}

          {!isFetchingUser && !currentUser && (
            <div className="ui-card mb-6 p-5 md:p-6">
              <p className="text-sm font-medium text-gray-800">No profile data available.</p>
              <p className="text-xs text-gray-500 mt-1">
                We could not load your dashboard details. Please try refreshing.
              </p>
            </div>
          )}

          <div className="ui-card mb-6 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-5">
              <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-lg font-semibold shrink-0">
                {userInitials}
              </div>

              <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="ui-section-label mb-1">Name</p>
                  <p className="text-gray-900 font-medium">{currentUser?.name || "-"}</p>
                </div>
                <div>
                  <p className="ui-section-label mb-1">Email</p>
                  <p className="text-gray-900 font-medium break-all">{currentUser?.email || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`ui-card mb-6 p-5 md:p-6 ${activeStatus.cardClass}`}>
            <div className="flex items-start gap-4">
              <div
                className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${activeStatus.iconClass}`}
              >
                <StatusStateIcon status={status} />
              </div>

              <div>
<p className="ui-section-label mb-1">
                   Identity verification status
                 </p>
                 <span className={`ui-badge ${status === "VERIFIED" ? "ui-status-verified" : status === "REJECTED" ? "ui-status-rejected" : "ui-status-pending"}`}>
                   {status}
                 </span>
                <p className="text-sm text-gray-700 mt-1">{activeStatus.message}</p>
              </div>
            </div>
          </div>

          <div className="ui-card p-5 md:p-6">
            <p className="text-sm font-medium text-gray-800 mb-3">Upload identity document</p>

            <label
              htmlFor="identity-document-upload"
              className="group block rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition p-6 cursor-pointer"
            >
              <input
                id="identity-document-upload"
                type="file"
                onChange={handleFileChange}
                disabled={isBusy}
                className="sr-only"
              />

              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="M10 13V5m0 0L7.5 7.5M10 5l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.5 13.5v.75A1.75 1.75 0 0 0 6.25 16h7.5a1.75 1.75 0 0 0 1.75-1.75v-.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Click to browse or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</p>
              </div>
            </label>

            <div className="mt-3 min-h-[1.5rem]">
              {selectedFile ? (
                <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M6.5 4.5h4.75L14.5 7.75V15a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11 4.5V8h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-medium break-all">{selectedFile.name}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No file selected</p>
              )}
            </div>

            <div className="mt-4">
<button
                 onClick={handleUpload}
                 disabled={isBusy}
                 className="ui-button-primary"
               >
                 {isUploading && (
                   <span className="ui-spinner border-white/40 border-t-white" />
                 )}
                <span>{isUploading ? "Uploading..." : "Upload Document"}</span>
              </button>
            </div>

            {uploadMessage && (
              <p className="mt-3 text-sm text-emerald-800">{uploadMessage}</p>
            )}
            {uploadError && <p className="mt-3 text-sm text-red-800">{uploadError}</p>}
          </div>

          <div className="mt-6 border rounded-xl p-5 md:p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Activity</h3>

            <ul className="divide-y divide-gray-200">
              {recentActivities.length === 0 && (
                <li className="py-3 text-xs text-gray-500">No recent activity yet.</li>
              )}

              {recentActivities.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-gray-600">
                    {formatActivityTimestamp(item.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4 h-fit lg:sticky lg:top-24">
<div className={`ui-card p-5 md:p-6 ${activeStatus.cardClass}`}>
             <p className="ui-section-label mb-3">Quick Status</p>

            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeStatus.iconClass}`}>
                <StatusStateIcon status={status} />
              </div>

              <div>
                <span className={`ui-badge ${status === "VERIFIED" ? "ui-status-verified" : status === "REJECTED" ? "ui-status-rejected" : "ui-status-pending"}`}>
                   {status}
                 </span>
                <p className="text-sm text-gray-700 mt-1">{activeStatus.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-50 space-y-2 w-[min(92vw,22rem)] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl border px-4 py-3 shadow-lg text-sm ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
              role="status"
              aria-live="polite"
            >
              <p className="font-medium">{toast.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}