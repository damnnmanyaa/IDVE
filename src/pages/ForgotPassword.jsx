import { useState } from "react";
import { Link } from "react-router-dom";
import InputOTPForm from "../components/InputOTPForm";
import { apiUrl } from "../services/api";
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

const GENERIC_MESSAGE = "If an account exists, password reset instructions have been sent.";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      return data.message || data.error || fallback;
    } catch {
      return fallback;
    }
  };

  const handleRequestReset = async () => {
    if (!email) {
      setError("Enter your email address.");
      return;
    }

    setIsRequesting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError(await getErrorMessage(response, "Unable to request a password reset."));
        return;
      }

      setMessage(GENERIC_MESSAGE);
      setStep("reset");
    } catch {
      setError("Unable to reach the backend. Check Spring Boot server/CORS.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetPassword = async (otp) => {
    if (newPassword.length < 8) {
      throw new Error("Choose a password with at least 8 characters.");
    }

    setIsResetting(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to reset password."));
      }
      setMessage("Your password has been updated. You can now sign in.");
      setStep("complete");
    } catch (resetError) {
      setError(resetError?.message || "Unable to reset password.");
      throw resetError;
    } finally {
      setIsResetting(false);
    }
  };

  if (step === "complete") {
    return (
      <div className="idve-app idve-auth min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Password updated</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with your new password to continue.</p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white">
            Return to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <InputOTPForm
        email={email}
        onVerify={handleResetPassword}
        verifyLabel={isResetting ? "Updating password…" : "Reset password"}
        onResend={async () => {
          const response = await fetch(apiUrl("/api/auth/forgot-password"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Unable to resend reset code."));
          }
        }}
        title="Reset your password"
        description="Enter the verification code sent to your"
        supportText="Need help resetting your password?"
        extraContent={(
          <div className="mt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="new-password">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition"
              />
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {message && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      />
    );
  }

  return (
    <div className="idve-app idve-auth min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-lg bg-cyan-800 text-white flex items-center justify-center font-bold">
            <Shield className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">IDVE</span>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Forgot your password?</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Enter your email address and we&apos;ll send you a verification code.
        </p>

        {/* Email Field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="reset-email">
            Email Address
          </label>
          <div className="relative">
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition"
            />
            <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleRequestReset}
          disabled={isRequesting}
          className="w-full bg-cyan-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-cyan-900 active:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm shadow-md"
        >
          <span>{isRequesting ? "Sending code..." : "Send reset code"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Feedback Messages */}
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Remembered your password?{" "}
          <Link to="/login" className="text-slate-900 font-medium hover:underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
