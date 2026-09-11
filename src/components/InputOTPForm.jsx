import { useEffect, useMemo, useRef, useState } from "react";

export default function InputOTPForm({
  email,
  onVerify,
  onResend,
  initialOtp = "",
  initialInfo = "",
  onOtpChange,
  title = "Verify your login",
  description = "Enter the verification code we sent to your email address:",
  verifyLabel = "Verify",
  verifyDisabled = false,
  verifyDisabledMessage = "",
  supportText = "Having trouble signing in?",
  extraContent = null,
}) {
  const [otp, setOtp] = useState(initialOtp || "");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(initialInfo || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (initialOtp) {
      setOtp(initialOtp.slice(0, 6));
      setInfo(initialInfo || "Dev mode: OTP pre-filled from backend response");
    }
  }, [initialOtp, initialInfo]);

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes("@")) return "m@example.com";
    const [name, domain] = email.split("@");
    const first = name.slice(0, 1) || "m";
    return `${first}@${domain}`;
  }, [email]);

  const handleOtpChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    onOtpChange?.(digits);
    setError("");
  };

  const setOtpCharAt = (index, char) => {
    const chars = otp.padEnd(6, " ").split("");
    chars[index] = char || " ";
    const nextOtp = chars.join("").replace(/\s/g, "");
    setOtp(nextOtp);
    onOtpChange?.(nextOtp);
    setError("");
  };

  const handleBoxChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpCharAt(index, digit);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
      otpRefs.current[index + 1]?.select();
    }
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key !== "Backspace") {
      return;
    }

    const current = otp[index] || "";
    if (current) {
      setOtpCharAt(index, "");
      return;
    }

    if (index > 0) {
      setOtpCharAt(index - 1, "");
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleBoxPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    handleOtpChange(pasted);

    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setError("");
    setInfo("");
    try {
      await onVerify(otp);
    } catch (e) {
      setError(e?.message || "OTP verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    setInfo("");
    setOtp("");
    try {
      await onResend();
      setInfo("OTP sent successfully");
    } catch (e) {
      setError(e?.message || "Unable to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const renderOtpInput = (index) => (
    <input
      key={index}
      ref={(el) => {
        otpRefs.current[index] = el;
      }}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={otp[index] || ""}
      onChange={(e) => handleBoxChange(index, e.target.value)}
      onKeyDown={(e) => handleBoxKeyDown(index, e)}
      onPaste={handleBoxPaste}
      className="h-12 w-10 rounded-lg border border-slate-400 bg-white text-center text-xl text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 sm:h-14 sm:w-14 sm:text-2xl"
      aria-label={`OTP digit ${index + 1}`}
    />
  );

  return (
    <div className="ui-page ui-page-center">
      <div className="ui-card w-full max-w-[520px]">
        <div className="p-6 sm:p-8">
          <h2 className="ui-page-title mb-2">{title}</h2>
          <p className="ui-body-copy mb-6">
            {description}
            <br />
            email address: <span className="font-semibold">{maskedEmail}</span>.
          </p>

          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="ui-section-label">Verification code</p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="ui-button-secondary w-full sm:w-auto"
            >
              {isResending ? "Resending..." : "Resend Code"}
            </button>
          </div>

          <div className="mt-4 mb-6">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <div className="flex gap-0.5">
                {renderOtpInput(0)}
                {renderOtpInput(1)}
                {renderOtpInput(2)}
              </div>
              <span className="text-xl font-medium text-gray-500 sm:text-2xl">-</span>
              <div className="flex gap-0.5">
                {renderOtpInput(3)}
                {renderOtpInput(4)}
                {renderOtpInput(5)}
              </div>
            </div>
          </div>

          {extraContent}
        </div>

        <div className="border-t border-gray-200 p-6 sm:p-8">
          <button
            onClick={handleVerify}
            disabled={isVerifying || verifyDisabled}
            className="ui-button-primary w-full"
          >
            {isVerifying ? "Verifying..." : verifyLabel}
          </button>

          {verifyDisabledMessage && (
            <p className="mt-3 text-sm text-amber-800" role="status">
              {verifyDisabledMessage}
            </p>
          )}

<p className="mt-4 text-center text-sm leading-6 text-gray-600">
             {supportText} <span className="ui-link">Contact support</span>
           </p>

           {error && <p className="mt-4 text-sm text-red-800" role="alert">{error}</p>}
           {info && <p className="mt-4 text-sm text-emerald-800" role="status">{info}</p>}
        </div>
      </div>
    </div>
  );
}
