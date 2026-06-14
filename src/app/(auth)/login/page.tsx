"use client";
import "../../landing-styles.css";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getCurrentUser, configureCognito } from "@/lib/aws/cognito";
import { isAdminIdentity } from "@/lib/admin-identity";
import AnimatedLoginBackground from "@/components/auth/AnimatedLoginBackground";
import Image from "next/image";
import Link from "next/link";

type LoginStep = "login" | "new_password";

export default function LandingPage() {
  const [sleepId, setSleepId]                     = useState("");
  const [password, setPassword]                   = useState("");
  const [showPassword, setShowPassword]           = useState(false);
  const [isLoading, setIsLoading]                 = useState(false);
  const [error, setError]                         = useState("");
  const [step, setStep]                           = useState<LoginStep>("login");
  const [newPassword, setNewPassword]             = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");
  const [showNewPassword, setShowNewPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyOpen, setPrivacyOpen]               = useState(false);
  const privacyCloseRef                              = useRef<HTMLButtonElement>(null);
  const [forgotOpen, setForgotOpen]                 = useState(false);
  const [forgotEmail, setForgotEmail]               = useState("");
  const [forgotLoading, setForgotLoading]           = useState(false);
  const [forgotStep, setForgotStep]                 = useState<"email" | "code" | "done">("email");
  const [forgotCode, setForgotCode]                 = useState("");
  const [forgotNewPassword, setForgotNewPassword]   = useState("");
  const [forgotConfirmPwd, setForgotConfirmPwd]     = useState("");
  const [forgotShowNewPwd, setForgotShowNewPwd]     = useState(false);
  const [forgotShowConfPwd, setForgotShowConfPwd]   = useState(false);
  const [forgotError, setForgotError]               = useState("");
  const forgotEmailRef                              = useRef<HTMLInputElement>(null);
  const forgotCodeRef                               = useRef<HTMLInputElement>(null);

  const { login, completePasswordChallenge, isAuthenticated, patient } = useAuth();
  const router = useRouter();

  useEffect(() => {
    configureCognito();
    getCurrentUser().then((user) => {
      if (user) router.replace(isAdminIdentity(user) ? "/admin" : "/portal/dashboard");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated) router.replace(isAdminIdentity(patient ?? {}) ? "/admin" : "/portal/dashboard");
  }, [isAuthenticated, patient, router]);

  useEffect(() => {
    if (!privacyOpen) return;
    privacyCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPrivacyOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [privacyOpen]);

  useEffect(() => {
    if (!forgotOpen) return;
    forgotEmailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setForgotOpen(false); setForgotStep("email"); setForgotEmail("");
        setForgotCode(""); setForgotNewPassword(""); setForgotConfirmPwd("");
        setForgotShowNewPwd(false); setForgotShowConfPwd(false); setForgotError("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [forgotOpen]);

  useEffect(() => {
    if (forgotStep === "code") forgotCodeRef.current?.focus();
  }, [forgotStep]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const identifier = sleepId;
      const { error: errorMsg, redirectTo, nextStep } = await login(identifier, password);
      if (nextStep === "new_password_required") {
        setStep("new_password");
      } else if (errorMsg === null) {
        router.replace(redirectTo);
      } else {
        setError(errorMsg);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const { error: errorMsg, redirectTo } = await completePasswordChallenge(newPassword);
      if (errorMsg === null) {
        router.replace(redirectTo);
      } else {
        setError(errorMsg);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendResetCode = async () => {
    setForgotError("");
    setForgotLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), userType: "patient" }),
      });
      setForgotCode(""); setForgotNewPassword(""); setForgotConfirmPwd("");
      setForgotShowNewPwd(false); setForgotShowConfPwd(false);
      setForgotStep("code");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetCode();
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPwd) {
      setForgotError("Passwords do not match.");
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotError("Password must be at least 8 characters.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          userType: "patient",
          code: forgotCode.trim(),
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setForgotStep("done");
      } else {
        setForgotError("We couldn’t reset the password. Check the code and try again, or request a new code.");
      }
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSleepIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setSleepId(digits);
    if (error) setError("");
  };

  const isFormValid = sleepId.length === 6 && password.length > 0;

  /* ─── shared spinner SVG ───────────────────────────────────────────────────── */
  const SpinnerSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" className="landing-spinner">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.3" />
      <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );

  /* ─── error banner ─────────────────────────────────────────────────────────── */
  const ErrorBanner = () =>
    error ? (
      <div
        style={{
          marginBottom: "16px",
          padding: "12px 14px",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "10px",
        }}
      >
        <p style={{ fontSize: "14px", color: "#B91C1C", margin: 0 }}>{error}</p>
      </div>
    ) : null;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-[#0B2A3C]">
      <AnimatedLoginBackground />

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/midland-logo.png"
            alt="Midland Sleep"
            width={40}
            height={40}
            className="rounded-xl"
            style={{ width: "40px", height: "40px" }}
            priority
          />
          <div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700,
                fontSize: "20px",
                color: "#FDFCF5",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Midland Sleep
            </p>
            <p
              style={{
                fontSize: "10px",
                color: "#74C0A2",
                fontWeight: 500,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                margin: "2px 0 0",
              }}
            >
              Patient Portal
            </p>
          </div>
        </div>

        {/* Staff sign in */}
        <Link
          href="/admin/login"
          className="flex items-center text-sm font-semibold transition-colors hover:bg-white/15 hover:text-white"
          style={{
            color: "rgba(253,252,245,0.88)",
            background: "rgba(253,252,245,0.08)",
            border: "1px solid rgba(253,252,245,0.38)",
            borderRadius: "999px",
            padding: "10px 20px",
            minHeight: "44px",
            boxShadow: "0 10px 30px rgba(5,20,30,0.18)",
            backdropFilter: "blur(14px)",
            textDecoration: "none",
          }}
        >
          Staff sign in
        </Link>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 pb-14 pt-4 md:pt-8">

        {/* Hero text */}
        <div className="mb-8 text-center" style={{ maxWidth: "520px" }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontSize: "clamp(30px, 5vw, 46px)",
              color: "#FDFCF5",
              lineHeight: 1.22,
              margin: "0 0 14px",
            }}
          >
            Manage your{" "}
            <em style={{ color: "#74C0A2", fontStyle: "italic" }}>sleep care</em>
            {" "}online
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(253,252,245,0.7)",
              lineHeight: 1.65,
              margin: "0 auto",
              fontWeight: 300,
              maxWidth: "380px",
            }}
          >
            Check your CPAP equipment, request supplies, and view updates.
          </p>
        </div>

        {/* ── Login card ─────────────────────────────────────────────────────── */}
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#FDFCF5",
            borderRadius: "20px",
            padding: "36px 32px",
            boxShadow: "0 8px 40px rgba(11,42,60,0.32), 0 2px 8px rgba(11,42,60,0.14)",
            boxSizing: "border-box",
          }}
        >
          {step === "login" ? (
            <>
              {/* Card heading */}
              <div style={{ marginBottom: "24px" }}>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    fontSize: "28px",
                    color: "#0B2A3C",
                    margin: "0 0 8px",
                    lineHeight: 1.2,
                  }}
                >
                  Welcome back
                </h2>
                <p style={{ fontSize: "13px", color: "#888", margin: 0, lineHeight: 1.55 }}>
                  Your details are used only to verify your identity.{" "}
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#0B5C6C", fontWeight: 500, fontSize: "inherit", textDecoration: "none" }}
                  >
                    Privacy notice →
                  </button>
                </p>
              </div>

              <ErrorBanner />

              <form onSubmit={handleLogin}>
                {/* Sleep ID */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}
                  >
                    Your Sleep ID
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="landing-input landing-input--sleepid"
                    placeholder="000000"
                    value={sleepId}
                    onChange={handleSleepIdChange}
                    maxLength={6}
                    autoComplete="off"
                  />
                  <p style={{ fontSize: "13px", color: "#999", marginTop: "7px", textAlign: "center", lineHeight: 1.5 }}>
                    The 6-digit number on your welcome letter.
                  </p>
                </div>

                {/* Password */}
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <label style={{ fontSize: "14px", fontWeight: 600, color: "#444" }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "13px", color: "#0B5C6C", fontWeight: 500 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="landing-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="landing-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                    />
                    <button
                      type="button"
                      className="landing-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="landing-submit"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <span className="landing-spinner-wrap">
                      <SpinnerSvg />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* New password step */}
              <div style={{ marginBottom: "20px" }}>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    fontSize: "24px",
                    color: "#0B2A3C",
                    margin: "0 0 8px",
                    lineHeight: 1.2,
                  }}
                >
                  Create your new password
                </h2>
                <p style={{ fontSize: "13px", color: "#888", margin: 0, lineHeight: 1.55 }}>
                  Your temporary password has been accepted. Choose a permanent password to continue.
                </p>
              </div>

              <ErrorBanner />

              <form onSubmit={handlePasswordChallenge}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}
                  >
                    New password
                  </label>
                  <div className="landing-password-wrap">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="landing-input"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (error) setError(""); }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="landing-password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}
                  >
                    Confirm new password
                  </label>
                  <div className="landing-password-wrap">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="landing-input"
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="landing-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="landing-submit"
                  disabled={isLoading || newPassword.length === 0 || confirmPassword.length === 0}
                >
                  {isLoading ? (
                    <span className="landing-spinner-wrap">
                      <SpinnerSvg />
                      Setting password...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Trust row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            marginTop: "28px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(253,252,245,0.58)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secure sign-in
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(253,252,245,0.58)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            NZ hosted data
          </div>
        </div>

        {/* Help */}
        <div style={{ marginTop: "22px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "rgba(253,252,245,0.58)", margin: "0 0 4px", fontWeight: 500 }}>
            Need help signing in?
          </p>
          <p style={{ fontSize: "14px", color: "rgba(253,252,245,0.52)", margin: 0 }}>
            Call us on{" "}
            <a href="tel:078381234" style={{ color: "#74C0A2", fontWeight: 500, textDecoration: "none" }}>
              07 838 1234
            </a>
            {" "}or email{" "}
            <a href="mailto:support@midlandsleep.co.nz" style={{ color: "#74C0A2", fontWeight: 500, textDecoration: "none" }}>
              support@midlandsleep.co.nz
            </a>
            .
          </p>
        </div>
      </main>

      {/* ── Forgot password modal ────────────────────────────────────────────── */}
      {forgotOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          onClick={() => {
            setForgotOpen(false); setForgotStep("email"); setForgotEmail("");
            setForgotCode(""); setForgotNewPassword(""); setForgotConfirmPwd("");
            setForgotShowNewPwd(false); setForgotShowConfPwd(false); setForgotError("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(5,20,30,0.72)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FDFCF5",
              borderRadius: "20px",
              padding: "36px 32px",
              maxWidth: "420px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 40px rgba(11,42,60,0.38)",
              boxSizing: "border-box",
            }}
          >
            <h2
              id="forgot-modal-title"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: "26px",
                color: "#0B2A3C",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              Reset your password
            </h2>

            {forgotStep === "done" ? (
              <>
                <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.7, margin: "0 0 28px" }}>
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false); setForgotStep("email"); setForgotEmail("");
                    setForgotCode(""); setForgotNewPassword(""); setForgotConfirmPwd("");
                    setForgotShowNewPwd(false); setForgotShowConfPwd(false); setForgotError("");
                  }}
                  style={{
                    display: "block", width: "100%", padding: "14px",
                    background: "#0B2A3C", color: "#FDFCF5", border: "none",
                    borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </>
            ) : forgotStep === "code" ? (
              <>
                <p style={{ fontSize: "14px", color: "#888", margin: "0 0 4px", lineHeight: 1.55 }}>
                  Enter the reset code from your email and choose a new password.
                </p>
                <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 20px", lineHeight: 1.5 }}>
                  This code is time-limited. If it expires, request a new code.
                </p>

                {forgotError && (
                  <div style={{ marginBottom: "16px", padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px" }}>
                    <p style={{ fontSize: "14px", color: "#B91C1C", margin: 0 }}>{forgotError}</p>
                  </div>
                )}

                <form onSubmit={handleConfirmSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}>
                      Reset code
                    </label>
                    <input
                      ref={forgotCodeRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="landing-input"
                      placeholder="Enter the code from your email"
                      value={forgotCode}
                      onChange={(e) => { setForgotCode(e.target.value); if (forgotError) setForgotError(""); }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}>
                      New password
                    </label>
                    <div className="landing-password-wrap">
                      <input
                        type={forgotShowNewPwd ? "text" : "password"}
                        className="landing-input"
                        placeholder="At least 8 characters"
                        value={forgotNewPassword}
                        autoComplete="new-password"
                        onChange={(e) => { setForgotNewPassword(e.target.value); if (forgotError) setForgotError(""); }}
                        required
                      />
                      <button type="button" className="landing-password-toggle" onClick={() => setForgotShowNewPwd(!forgotShowNewPwd)}>
                        {forgotShowNewPwd ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}>
                      Confirm new password
                    </label>
                    <div className="landing-password-wrap">
                      <input
                        type={forgotShowConfPwd ? "text" : "password"}
                        className="landing-input"
                        placeholder="Repeat your new password"
                        value={forgotConfirmPwd}
                        autoComplete="new-password"
                        onChange={(e) => { setForgotConfirmPwd(e.target.value); if (forgotError) setForgotError(""); }}
                        required
                      />
                      <button type="button" className="landing-password-toggle" onClick={() => setForgotShowConfPwd(!forgotShowConfPwd)}>
                        {forgotShowConfPwd ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="landing-submit"
                    disabled={forgotLoading || !forgotCode.trim() || !forgotNewPassword || !forgotConfirmPwd}
                  >
                    {forgotLoading ? (
                      <span className="landing-spinner-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="landing-spinner">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.3" />
                          <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                        </svg>
                        Resetting...
                      </span>
                    ) : (
                      "Reset password"
                    )}
                  </button>
                </form>

                <p style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#888" }}>
                  Didn&rsquo;t receive a code?{" "}
                  <button
                    type="button"
                    onClick={sendResetCode}
                    disabled={forgotLoading}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#0B5C6C", fontWeight: 500, fontSize: "inherit" }}
                  >
                    Send a new code
                  </button>
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "14px", color: "#888", margin: "0 0 20px", lineHeight: 1.55 }}>
                  Enter your email address and we&rsquo;ll send you a reset code.
                </p>

                {forgotError && (
                  <div style={{ marginBottom: "16px", padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px" }}>
                    <p style={{ fontSize: "14px", color: "#B91C1C", margin: 0 }}>{forgotError}</p>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit}>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}>
                      Email address
                    </label>
                    <input
                      ref={forgotEmailRef}
                      type="email"
                      autoComplete="email"
                      className="landing-input"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); if (forgotError) setForgotError(""); }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="landing-submit"
                    disabled={forgotLoading || forgotEmail.trim().length === 0}
                  >
                    {forgotLoading ? (
                      <span className="landing-spinner-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="landing-spinner">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.3" />
                          <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Send reset code"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Privacy modal ────────────────────────────────────────────────────── */}
      {privacyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={() => setPrivacyOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(5,20,30,0.72)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FDFCF5",
              borderRadius: "20px",
              padding: "36px 32px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 8px 40px rgba(11,42,60,0.38)",
              boxSizing: "border-box",
            }}
          >
            <h2
              id="privacy-modal-title"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: "26px",
                color: "#0B2A3C",
                margin: "0 0 20px",
                lineHeight: 1.2,
              }}
            >
              Privacy notice
            </h2>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.7, margin: "0 0 14px" }}>
              Midland Sleep uses the details you enter here only to verify your identity and provide access to your sleep care portal.
            </p>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.7, margin: "0 0 14px" }}>
              Your portal may show information related to your CPAP equipment, supply requests, account access, and clinic updates.
            </p>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.7, margin: "0 0 14px" }}>
              Your information is handled in line with New Zealand privacy obligations and Midland Sleep&rsquo;s internal privacy processes.
            </p>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.7, margin: "0 0 28px" }}>
              If you have questions about your information, contact Midland Sleep at{" "}
              <a href="mailto:support@midlandsleep.co.nz" style={{ color: "#0B5C6C", fontWeight: 500, textDecoration: "none" }}>
                support@midlandsleep.co.nz
              </a>
              .
            </p>
            <button
              ref={privacyCloseRef}
              type="button"
              onClick={() => setPrivacyOpen(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                background: "#0B2A3C",
                color: "#FDFCF5",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.2px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
