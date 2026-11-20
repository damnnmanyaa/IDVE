import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  ShieldCheck,
  User,
  FileText,
  Upload,
  CheckCircle2,
  Clock3,
  XCircle,
  LogOut,
  Activity,
  FileCheck,
  AlertCircle,
  LayoutDashboard,
  FileSpreadsheet,
  Lock,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (file && !["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
      setSelectedFile(null);
      setUploadError("Choose a PDF, PNG, or JPEG document.");
      event.target.value = "";
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      setUploadError("The file must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
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

  const isBusy = isFetchingUser || isUploading;

  const renderStatusBadge = (statusVal) => {
    if (statusVal === "VERIFIED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
          VERIFIED
        </span>
      );
    }
    if (statusVal === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 font-medium">APPLICANT</span>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-cyan-50 text-cyan-900 font-medium text-sm border border-cyan-100">
              <LayoutDashboard className="h-4 w-4 text-slate-900" />
              <span>Overview</span>
            </button>
            <button onClick={() => document.getElementById("identity-profile")?.scrollIntoView({ behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition text-sm font-medium">
              <User className="h-4 w-4 text-slate-500" />
              <span>Identity Profile</span>
            </button>
            <button onClick={() => document.getElementById("verification")?.scrollIntoView({ behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span>Verification</span>
            </button>
            <Link to="/upload" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition text-sm font-medium">
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              <span>Documents Workspace</span>
            </Link>
            <button onClick={() => document.getElementById("audit-history")?.scrollIntoView({ behavior: "smooth" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition text-sm font-medium">
              <Activity className="h-4 w-4 text-slate-500" />
              <span>Audit History</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <button
            onClick={handleLogout}
            disabled={isBusy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-700 hover:text-rose-800 hover:bg-rose-50 transition text-sm font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3.5 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Overview</h1>
          </div>

          <div className="flex items-center gap-4">
            {renderStatusBadge(status)}

            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-900">
                {userInitials}
              </div>
              <div className="text-left text-xs leading-tight">
                <p className="font-medium text-slate-900">{currentUser?.name || "User"}</p>
                <p className="text-slate-500 max-w-[140px] truncate">{currentUser?.email || "-"}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isBusy}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium">
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </div>
            <Link to="/upload" className="flex items-center gap-3 p-2 rounded-lg text-slate-600 text-sm font-medium">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Documents Workspace</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-lg text-rose-700 text-sm font-medium w-full text-left">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Welcome Banner */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {currentUser?.name || "User"}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage your identity, verification status and account security.
            </p>
          </div>

          {/* Loading Indicator */}
          {isFetchingUser && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3 text-sm text-slate-600">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-200 border-t-[#F4F4F5] animate-spin" />
              <span>Fetching identity record...</span>
            </div>
          )}

          {/* Metric Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Verification Status */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500">
                <span>Identity Status</span>
                <ShieldCheck className="h-4 w-4 text-slate-600" />
              </div>
              <div className="pt-1">
                {renderStatusBadge(status)}
              </div>
              <p className="text-xs text-slate-500">
                {status === "VERIFIED" ? "Official verification granted" : status === "REJECTED" ? "Verification rejected by admin" : "Under review by admin"}
              </p>
            </div>

            {/* Metric 2: Document */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500">
                <span>Document State</span>
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {selectedFile ? selectedFile.name : "Document Submitted"}
              </p>
              <p className="text-xs text-slate-500">PDF / Image format</p>
            </div>

            {/* Metric 3: Account Email */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500">
                <span>Account Identity</span>
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {currentUser?.email || "-"}
              </p>
              <p className="text-xs text-slate-500">Primary email address</p>
            </div>

            {/* Metric 4: Access Level */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500">
                <span>Access Level</span>
                <Lock className="h-4 w-4 text-slate-600" />
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-xs font-semibold text-slate-900 border border-slate-200">
                  USER ROLE
                </span>
              </div>
              <p className="text-xs text-slate-500">Standard privileges</p>
            </div>

          </div>

          {/* Grid Layout: Main & Side Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Center Column (lg:col-span-2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Identity Verification Timeline */}
              <div id="identity-profile" className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 space-y-5 scroll-mt-24">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Identity verification</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Track your verification milestone status.</p>
                </div>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3.5 relative z-10">
                    <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Account Created</p>
                      <p className="text-xs text-slate-500">Registered on IDVE platform</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3.5 relative z-10">
                    <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Email / OTP Verified</p>
                      <p className="text-xs text-slate-500">Two-factor verification completed</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3.5 relative z-10">
                    <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center shrink-0 text-xs">
                      <FileCheck className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Document Submitted</p>
                      <p className="text-xs text-slate-500">Proof of identity uploaded</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3.5 relative z-10">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      status === "VERIFIED"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : status === "REJECTED"
                        ? "bg-rose-50 border border-rose-200 text-rose-700"
                        : "bg-amber-50 border border-amber-200 text-amber-700"
                    }`}>
                      {status === "VERIFIED" ? <CheckCircle2 className="h-4 w-4" /> : status === "REJECTED" ? <XCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Verification Decision</p>
                      <p className="text-xs text-slate-500">
                        {status === "VERIFIED" ? "Identity confirmed" : status === "REJECTED" ? "Verification rejected" : "Pending admin review"}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Document Upload Area */}
              <div id="verification" className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 space-y-4 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Identity document</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Upload passport, driver's license or official ID.</p>
                  </div>
                  <Link to="/upload" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition">
                    <span>Advanced Workspace</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Dropzone Box */}
                <label
                  htmlFor="identity-document-upload"
                  className="group block rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition p-6 cursor-pointer text-center"
                >
                  <input
                    id="identity-document-upload"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    disabled={isBusy}
                    className="sr-only"
                  />

                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center group-hover:scale-105 transition">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">PDF, JPG, or PNG · max 5 MB. Use a synthetic document.</p>
                  </div>
                </label>

                {/* Selected File Display */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-slate-600 shrink-0" />
                      <span className="truncate font-medium">{selectedFile.name}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}

                {/* Upload Action Button */}
                <button
                  onClick={handleUpload}
                  disabled={isBusy || !selectedFile}
                  className="w-full bg-cyan-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-cyan-900 active:bg-zinc-200 disabled:opacity-40 transition flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  {isUploading ? (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{isUploading ? "Uploading..." : "Upload Document"}</span>
                </button>

                {/* Upload Status Banners */}
                {uploadMessage && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{uploadMessage}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Right Side Column (lg:col-span-1) */}
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div id="audit-history" className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 space-y-4 scroll-mt-24">
                <h3 className="text-base font-semibold text-slate-900">Profile summary</h3>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.email || "-"}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Account Role</span>
                    <span className="font-semibold text-slate-900">USER</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Status</span>
                    {renderStatusBadge(status)}
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
                  <Activity className="h-4 w-4 text-slate-500" />
                </div>

                <ul className="space-y-3">
                  {recentActivities.length === 0 && (
                    <li className="text-xs text-slate-500 py-2">No recent activity yet.</li>
                  )}

                  {recentActivities.map((item) => (
                    <li key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{item.type}</span>
                        <span className="text-[10px] text-slate-500">{formatActivityTimestamp(item.timestamp)}</span>
                      </div>
                      <p className="text-slate-600">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* Floating Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-50 space-y-2 w-[min(92vw,22rem)] pointer-events-none">
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
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
