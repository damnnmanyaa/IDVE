import { useEffect, useMemo, useRef, useState } from "react";
import { Shield, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function InputOTPForm({
  email,
  onVerify,
  onResend,
  initialOtp = "",
  initialInfo = "",
  onOtpChange,
  title = "Verify your email",
  description = "Enter the verification code sent to your email address:",
  verifyLabel = "Verify identity",
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
      className="h-12 w-11 rounded-lg border border-[#27272A] bg-[#18181B] text-center text-xl font-semibold text-[#F4F4F5] outline-none transition focus:border-[#71717A] focus:ring-1 focus:ring-[#71717A] sm:h-14 sm:w-13 sm:text-2xl"
      aria-label={`OTP digit ${index + 1}`}
    />
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5] flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-[#111113] rounded-xl border border-[#27272A] shadow-2xl overflow-hidden">
        
        {/* Card Header */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-lg bg-[#F4F4F5] text-[#09090B] flex items-center justify-center font-bold">
              <Shield className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#F4F4F5]">IDVE</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-[#F4F4F5] mb-2">{title}</h2>
          <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
            {description}{" "}
            <span className="font-semibold text-[#F4F4F5]">{maskedEmail}</span>
          </p>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Verification code</span>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>{isResending ? "Resending..." : "Resend Code"}</span>
            </button>
          </div>

          {/* 6-Digit OTP Boxes */}
          <div className="mt-4 mb-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="flex gap-1.5">
                {renderOtpInput(0)}
                {renderOtpInput(1)}
                {renderOtpInput(2)}
              </div>
              <span className="text-xl font-medium text-[#71717A] sm:text-2xl">-</span>
              <div className="flex gap-1.5">
                {renderOtpInput(3)}
                {renderOtpInput(4)}
                {renderOtpInput(5)}
              </div>
            </div>
          </div>

          {extraContent}
        </div>

        {/* Card Footer Actions */}
        <div className="border-t border-[#27272A] bg-[#151515] p-6 sm:p-8">
          <button
            onClick={handleVerify}
            disabled={isVerifying || verifyDisabled}
            className="w-full bg-[#F4F4F5] text-[#09090B] font-semibold py-2.5 px-4 rounded-lg hover:bg-white active:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <span>{isVerifying ? "Verifying..." : verifyLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {verifyDisabledMessage && (
            <p className="mt-3 text-xs text-[#F59E0B] text-center" role="status">
              {verifyDisabledMessage}
            </p>
          )}

          <p className="mt-4 text-center text-xs text-[#71717A]">
            {supportText} <span className="text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer underline underline-offset-2">Contact support</span>
          </p>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-[#EF4444]" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-[#22C55E]" role="status">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{info}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
