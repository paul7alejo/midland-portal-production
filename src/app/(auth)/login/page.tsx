"use client";
import "../../landing-styles.css";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getCurrentUser, configureCognito } from "@/lib/aws/cognito";
import { isAdminIdentity } from "@/lib/admin-identity";
import Image from "next/image";
import Link from "next/link";

type LoginMethod = "msid" | "email";
type LoginStep = "login" | "new_password";

export default function LandingPage() {
  const [sleepId, setSleepId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("msid");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<LoginStep>("login");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, completePasswordChallenge, isAuthenticated, patient } = useAuth();
  const router = useRouter();

  useEffect(() => {
    configureCognito();
    getCurrentUser().then((user) => {
      if (user) router.replace(isAdminIdentity(user) ? '/admin' : '/portal/dashboard');
    });
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) router.replace(isAdminIdentity(patient ?? {}) ? '/admin' : '/portal/dashboard');
  }, [isAuthenticated, patient, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const identifier = loginMethod === "msid" ? sleepId : email;
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

  const handleSleepIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setSleepId(digits);
    if (error) setError("");
  };

  const isFormValid =
    loginMethod === "msid"
      ? sleepId.length === 6 && password.length > 0
      : email.length > 0 && password.length > 0;

  return (
    <div className="landing-page">
      {/* Hero / Brand Section */}
      <div className="landing-hero">
        {/* Decorative glows */}
        <div className="landing-glow landing-glow--top-right" />
        <div className="landing-glow landing-glow--bottom-left" />

        {/* Header */}
        <header className="landing-header">
          <div className="landing-logo-group">
            <Image
              src="/midland-logo.png"
              alt="Midland Sleep"
              width={48}
              height={48}
              className="landing-logo-img"
              style={{ width: "48px", height: "48px" }}
              priority
            />
            <div>
              <h2 className="landing-logo-text">Midland Sleep</h2>
              <span className="landing-logo-sub">Patient Portal</span>
            </div>
          </div>
          <Link href="/admin/login" className="landing-help-link">
            Staff sign in
          </Link>
        </header>

        {/* Hero copy */}
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Manage your{" "}
            <em style={{ color: "#74C0A2", fontStyle: "italic" }}>sleep care</em>
            {" "}online
          </h1>
          <p className="landing-hero-subtitle" style={{ maxWidth: "380px" }}>
            Check your CPAP equipment, request supplies, and view updates.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <main className="landing-main">
        <div className="landing-card">
          {step === "login" ? (
            <>
              {/* Card heading */}
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "26px", color: "#0B2A3C", margin: "0 0 6px", lineHeight: 1.2 }}>
                  Welcome back
                </h2>
                <p style={{ fontSize: "12px", color: "#999", margin: 0, lineHeight: 1.5 }}>
                  Your details are used only to verify your identity.{" "}
                  <a href="#" style={{ color: "#0B5C6C", fontWeight: 500, textDecoration: "none" }}>
                    Privacy notice →
                  </a>
                </p>
              </div>

              {/* Tabs */}
              <div className="landing-tabs">
                <button
                  className={`landing-tab ${loginMethod === "msid" ? "landing-tab--active" : ""}`}
                  onClick={() => { setLoginMethod("msid"); setError(""); }}
                  type="button"
                >
                  Sleep ID
                </button>
                <button
                  className={`landing-tab ${loginMethod === "email" ? "landing-tab--active" : ""}`}
                  onClick={() => { setLoginMethod("email"); setError(""); }}
                  type="button"
                >
                  Email
                </button>
              </div>

              {error && (
                <div className="landing-error">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin}>
                {loginMethod === "msid" ? (
                  <div className="landing-field">
                    <label className="landing-label">Your Sleep ID</label>
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
                    <p className="landing-hint">
                      The 6-digit number on your welcome letter.
                    </p>
                  </div>
                ) : (
                  <div className="landing-field">
                    <label className="landing-label">Email or staff username</label>
                    <input
                      type="text"
                      className="landing-input"
                      placeholder="e.g. johndoe@clinic.com or johndoe"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    />
                  </div>
                )}

                <div className="landing-field">
                  <label className="landing-label">Password</label>
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

                <button
                  type="submit"
                  className="landing-submit"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <span className="landing-spinner-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" className="landing-spinner">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.3" />
                        <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <div className="landing-card-footer">
                <Link href="#" className="landing-card-link">
                  Forgot password?
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="landing-field" style={{ marginBottom: "0.25rem" }}>
                <p className="landing-label" style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                  Create your new password
                </p>
                <p className="landing-hint">
                  Your temporary password has been accepted. Choose a permanent password to continue.
                </p>
              </div>

              {error && (
                <div className="landing-error">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChallenge}>
                <div className="landing-field">
                  <label className="landing-label">New password</label>
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

                <div className="landing-field">
                  <label className="landing-label">Confirm new password</label>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" className="landing-spinner">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.3" />
                        <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                      </svg>
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

        {/* Trust indicators */}
        <div className="landing-trust">
          <div className="landing-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secure sign-in
          </div>
          <div className="landing-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            NZ hosted data
          </div>
        </div>

        {/* Help */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#888", margin: "0 0 4px", fontWeight: 500 }}>
            Need help signing in?
          </p>
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>
            Call us on{" "}
            <a href="tel:078381234" style={{ color: "#0B5C6C", fontWeight: 500, textDecoration: "none" }}>
              07 838 1234
            </a>
            {" "}and we can help.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-divider" />
        <p className="landing-footer-text">
          Midland Sleep Ltd · Waikato, New Zealand
          <br />
          <span className="landing-footer-credit">
            Portal by OneOfZero Systems
          </span>
        </p>
      </footer>
    </div>
  );
}
