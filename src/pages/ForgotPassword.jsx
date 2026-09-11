import { useState } from "react";
import { Link } from "react-router-dom";
import InputOTPForm from "../components/InputOTPForm";
import { API_BASE_URL } from "../services/api";

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
        description="Enter the verification code we sent to your"
        verifyLabel="Reset password"
        supportText="Need help resetting your password?"
        extraContent={(
          <div className="mt-6">
            <label className="ui-section-label" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="ui-input mt-1"
            />
            {message && <p className="mt-3 text-sm text-emerald-800" role="status">{message}</p>}
            {error && <p className="mt-3 text-sm text-red-800" role="alert">{error}</p>}
          </div>
        )}
      />
    );
  }

  return (
    <div className="ui-page ui-page-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="ui-brand-mark h-4 w-4 rounded" />
          <h1 className="text-lg font-semibold">IDVE</h1>
        </div>

        <h2 className="ui-page-title mb-2 text-center">Forgot your password?</h2>
        <p className="ui-body-copy mb-6 text-center">
          Enter your email address and we&apos;ll send you a verification code.
        </p>

        <label className="ui-section-label" htmlFor="reset-email">Email</label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="ui-input mt-1"
        />

        <button
          type="button"
          onClick={handleRequestReset}
          disabled={isRequesting}
          className="ui-button-primary mt-6 w-full"
        >
          {isRequesting ? "Sending code..." : "Send reset code"}
        </button>

        {message && <p className="ui-feedback ui-feedback-success mt-4" role="status">{message}</p>}
        {error && <p className="ui-feedback ui-feedback-error mt-4" role="alert">{error}</p>}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remembered your password? <Link to="/login" className="ui-link font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
