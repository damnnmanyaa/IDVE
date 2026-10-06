import { useState } from "react";
import { Link } from "react-router-dom";
import InputOTPForm from "../components/InputOTPForm";
import { API_BASE_URL } from "../services/api";
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

const GENERIC_MESSAGE = "If an account exists, password reset instructions have been sent.";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
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

  if (step === "reset") {
    return (
      <InputOTPForm
        email={email}
        onVerify={async () => {}}
        verifyDisabled
        verifyDisabledMessage="Password reset is temporarily unavailable — please contact an admin."
        onResend={async () => {
          const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
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
        verifyLabel="Reset password"
        supportText="Need help resetting your password?"
        extraContent={(
          <div className="mt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5" htmlFor="new-password">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-[#71717A] focus:ring-1 focus:ring-[#71717A] transition"
              />
              <Lock className="h-4 w-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {message && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-[#22C55E]" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-[#EF4444]" role="alert">
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
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111113] p-8 rounded-xl border border-[#27272A] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-lg bg-[#F4F4F5] text-[#09090B] flex items-center justify-center font-bold">
            <Shield className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F4F4F5]">IDVE</span>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-[#F4F4F5] mb-2">Forgot your password?</h2>
        <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
          Enter your email address and we&apos;ll send you a verification code.
        </p>

        {/* Email Field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5" htmlFor="reset-email">
            Email Address
          </label>
          <div className="relative">
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-lg px-3.5 py-2.5 text-sm pl-10 outline-none focus:border-[#71717A] focus:ring-1 focus:ring-[#71717A] transition"
            />
            <Mail className="h-4 w-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleRequestReset}
          disabled={isRequesting}
          className="w-full bg-[#F4F4F5] text-[#09090B] font-semibold py-2.5 px-4 rounded-lg hover:bg-white active:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm shadow-md"
        >
          <span>{isRequesting ? "Sending code..." : "Send reset code"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Feedback Messages */}
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-[#22C55E]" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-[#EF4444]" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[#71717A]">
          Remembered your password?{" "}
          <Link to="/login" className="text-[#F4F4F5] font-medium hover:underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
