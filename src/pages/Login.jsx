import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, KeyRound, ArrowRight } from "lucide-react";

const GithubIcon = (props) => (
  <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("USER");
  const [oauthReady, setOauthReady] = useState({ google: false, github: false });
  const API_BASE = API_BASE_URL;

  const decodeRoleFromToken = (token) => {
    try {
      const claims = jwtDecode(token);
      const rawRole =
        claims?.role ||
        (Array.isArray(claims?.roles) && claims.roles[0]) ||
        (Array.isArray(claims?.authorities) && claims.authorities[0]) ||
        "";

      return String(rawRole).replace(/^ROLE_/i, "").toUpperCase();
    } catch {
      return "";
    }
  };

  const redirectByRole = (token) => {
    const role = decodeRoleFromToken(token);

    if (role === "ADMIN") {
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("token");
    const oauthError = params.get("error");

    if (oauthToken) {
      const isLoggedIn = login(oauthToken);
      if (isLoggedIn) {
        redirectByRole(oauthToken);
      } else {
        alert("Login failed: invalid token returned by OAuth provider.");
        navigate("/login", { replace: true });
      }
      return;
    }

    if (oauthError) {
      alert("OAuth login failed: provider did not return a usable email.");
      navigate("/login", { replace: true });
    }
  }, [login, navigate]);

  useEffect(() => {
    const loadOAuthConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/oauth-config`);
        if (!res.ok) return;
        const data = await res.json();
        setOauthReady({
          google: !!data.google,
          github: !!data.github,
        });
      } catch {
        // Keep buttons disabled if backend is unreachable or misconfigured.
      }
    };

    loadOAuthConfig();
  }, [API_BASE]);

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
    if (!oauthReady[provider]) {
      alert(`${provider} OAuth is not configured on backend yet. Add client ID/secret first.`);
      return;
    }
    window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter credentials");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res, "Login failed");

        if (
          res.status === 404 ||
          /not registered|not found|user does not exist/i.test(errorMessage)
        ) {
          alert("User is not registered. Please sign up first.");
          return;
        }

        alert(errorMessage);
        return;
      }

      const data = await res.json();

      if (data.token) {
        const isLoggedIn = login(data.token);
        if (!isLoggedIn) {
          alert("Login failed: invalid token returned by backend");
          return;
        }

        redirectByRole(data.token);
      } else {
        alert("Login failed: token missing in response");
      }
    } catch (error) {
      alert("Login failed: cannot reach backend. Check Spring Boot server/CORS.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5] flex flex-col lg:flex-row">
      
      {/* Left Branding Hero Section */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#27272A] bg-[#0D0D0F]">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-9 w-9 rounded-lg bg-[#F4F4F5] text-[#09090B] flex items-center justify-center font-bold shadow-md">
              <Shield className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#F4F4F5]">IDVE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] border border-[#27272A] font-mono">ENTERPRISE</span>
          </div>

          {/* Main Hero Copy */}
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#F4F4F5]">
              Secure identity.<br />
              <span className="text-[#A1A1AA]">Verified access.</span>
            </h1>
            <p className="text-[#A1A1AA] text-base leading-relaxed">
              Identity verification and access management built for secure digital environments.
            </p>
          </div>

          {/* Informational Security Concepts */}
          <div className="mt-12 space-y-4 max-w-sm">
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#151515] border border-[#27272A]">
              <CheckCircle2 className="h-5 w-5 text-[#22C55E] shrink-0" />
              <span className="text-sm font-medium text-[#F4F4F5]">Identity Verification</span>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#151515] border border-[#27272A]">
              <KeyRound className="h-5 w-5 text-[#A1A1AA] shrink-0" />
              <span className="text-sm font-medium text-[#F4F4F5]">Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#151515] border border-[#27272A]">
              <Lock className="h-5 w-5 text-[#A1A1AA] shrink-0" />
              <span className="text-sm font-medium text-[#F4F4F5]">Secure Token Authentication</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-[#27272A]/50 text-xs text-[#71717A]">
          IDVE Enterprise Identity System &bull; Version 2.0
        </div>
      </div>

      {/* Right Form Card Section */}
      <div className="lg:w-1/2 p-6 sm:p-12 flex items-center justify-center bg-[#09090B]">
        <div className="w-full max-w-md bg-[#111113] p-8 rounded-xl border border-[#27272A] shadow-xl">
          
          {/* Card Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[#F4F4F5]">
              Welcome back
            </h2>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Sign in to your IDVE account.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-[#71717A] focus:ring-1 focus:ring-[#71717A] transition"
                />
                <Mail className="h-4 w-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#A1A1AA] hover:text-[#F4F4F5] transition underline-offset-2 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3.5 py-2.5 text-sm pl-10 pr-10 outline-none focus:border-[#71717A] focus:ring-1 focus:ring-[#71717A] transition"
                />
                <Lock className="h-4 w-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F4F4F5] transition p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Toggle Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Login Role
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#18181B] rounded-lg border border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  className={`py-2 text-xs font-semibold rounded-md transition ${
                    role === "USER"
                      ? "bg-[#27272A] text-[#F4F4F5] shadow-sm"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  USER
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`py-2 text-xs font-semibold rounded-md transition ${
                    role === "ADMIN"
                      ? "bg-[#27272A] text-[#F4F4F5] shadow-sm"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  ADMIN
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-[#F4F4F5] text-[#09090B] font-semibold py-2.5 px-4 rounded-lg hover:bg-white active:bg-zinc-200 transition flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#27272A]"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">OR</span>
            <div className="flex-1 h-px bg-[#27272A]"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={!oauthReady.google}
              className="w-full bg-[#18181B] hover:bg-[#27272A] text-[#F4F4F5] disabled:opacity-50 disabled:cursor-not-allowed border border-[#27272A] py-2.5 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2.5"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{oauthReady.google ? "Continue with Google" : "Google OAuth not configured"}</span>
            </button>

            <button
              onClick={() => handleOAuthLogin("github")}
              disabled={!oauthReady.github}
              className="w-full bg-[#18181B] hover:bg-[#27272A] text-[#F4F4F5] disabled:opacity-50 disabled:cursor-not-allowed border border-[#27272A] py-2.5 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2.5"
            >
              <GithubIcon className="h-4 w-4 shrink-0" />
              <span>{oauthReady.github ? "Continue with GitHub" : "GitHub OAuth not configured"}</span>
            </button>
          </div>

          {/* Signup Redirect Link */}
          <p className="text-center text-sm text-[#A1A1AA] mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#F4F4F5] font-medium hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}