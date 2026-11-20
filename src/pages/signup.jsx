import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiUrl, API_BASE_CONFIGURED } from "../services/api";
import { Shield, Lock, Mail, User, Eye, EyeOff, CheckCircle2, KeyRound, ArrowRight } from "lucide-react";

const GithubIcon = (props) => (
  <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);


const PENDING_SIGNUP_KEY = "pendingSignup";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [oauthReady, setOauthReady] = useState({ google: false, github: false });

  useEffect(() => {
    const clearForm = () => {
      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
    };

    clearForm();
    const timer = setTimeout(clearForm, 120);
    window.addEventListener("pageshow", clearForm);

    sessionStorage.removeItem(PENDING_SIGNUP_KEY);

    const loadOAuthConfig = async () => {
      if (!API_BASE_CONFIGURED) return;

      try {
        const res = await fetch(apiUrl("/api/auth/oauth-config"));
        if (!res.ok) return;
        const data = await res.json();
        setOauthReady({
          google: !!data.google,
          github: !!data.github,
        });
      } catch {
        // Keep OAuth disabled when backend is unreachable.
      }
    };

    loadOAuthConfig();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pageshow", clearForm);
    };
  }, []);

  const getErrorMessage = async (res, fallback) => {
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        return data.message || data.error || fallback;
      }
      const text = await res.text();
      return text || fallback;
    } catch {
      return fallback;
    }
  };

  const handleOAuthLogin = (provider) => {
    if (!API_BASE_CONFIGURED) return;
    if (!oauthReady[provider]) {
      alert(`${provider} OAuth is not configured on backend yet. Add client ID/secret first.`);
      return;
    }
    window.location.href = apiUrl(`/oauth2/authorization/${provider}`);
  };

  const handleSignup = async () => {
    if (isSendingOtp) {
      return;
    }

    if (!name || !email || !password) {
      alert("Enter all signup details");
      return;
    }

    setIsSendingOtp(true);

    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        const pendingSignup = {
          name,
          email,
          password,
          role: "USER",
          devOtp: data?.otp || "",
          infoMessage: data?.message || "",
        };

        sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pendingSignup));

        navigate("/verify-otp", {
          state: {
            ...pendingSignup,
          },
        });
      } else {
        const errorMessage = await getErrorMessage(res, "Signup failed");
        alert(errorMessage);
      }
    } catch {
      alert("Signup failed: cannot reach backend. Check Spring Boot server/CORS.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="idve-app idve-auth min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      
      {/* Left Branding Hero Section */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-9 w-9 rounded-lg bg-cyan-800 text-white flex items-center justify-center font-bold shadow-md">
              <Shield className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">IDVE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 font-medium">Identity review</span>
          </div>

          {/* Main Hero Copy */}
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-slate-900">
              Submit once.<br />
              <span className="text-slate-600">Track every step.</span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Create an applicant account to submit a document and follow its review status.
            </p>
          </div>

          {/* Informational Security Concepts */}
          <div className="mt-12 space-y-4 max-w-sm">
            <div className="flex items-center gap-3 py-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
              <span className="text-sm font-medium text-slate-900">Identity Verification</span>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <KeyRound className="h-5 w-5 text-slate-600 shrink-0" />
              <span className="text-sm font-medium text-slate-900">Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <Lock className="h-5 w-5 text-slate-600 shrink-0" />
              <span className="text-sm font-medium text-slate-900">Secure Token Authentication</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-slate-200/50 text-xs text-slate-500">
          Applicant and administrator workspaces
        </div>
      </div>

      {/* Right Form Card Section */}
      <div className="lg:w-1/2 p-6 sm:p-12 flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-xl">
          
          {/* Card Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Create your IDVE account
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Set up your identity securely.
            </p>
          </div>

          {!API_BASE_CONFIGURED && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900" role="alert">
              Registration is unavailable because this deployment has no backend URL. Set VITE_API_BASE_URL in the frontend host and redeploy.
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  name="signup-full-name"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition"
                />
                <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  name="signup-email-address"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  name="signup-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm pl-10 pr-10 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              onClick={handleSignup}
              disabled={isSendingOtp}
              className="w-full bg-cyan-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-cyan-900 active:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm shadow-md mt-2"
            >
              <span>{isSendingOtp ? "Sending OTP..." : "Create account"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthLogin("github")}
              disabled={!oauthReady.github}
              className="w-full bg-slate-50 hover:bg-slate-200 text-slate-900 disabled:opacity-50 border border-slate-200 py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <GithubIcon className="h-4 w-4 shrink-0" />
              <span>GitHub</span>
            </button>

            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={!oauthReady.google}
              className="w-full bg-slate-50 hover:bg-slate-200 text-slate-900 disabled:opacity-50 border border-slate-200 py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Login Redirect Link */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-slate-900 font-medium hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
