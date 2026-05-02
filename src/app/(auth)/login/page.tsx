"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type LoginMethod = "msid" | "email";

export default function LandingPage() {
  const [sleepId, setSleepId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("msid");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) router.push("/portal/dashboard");
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const identifier = loginMethod === "msid" ? sleepId : email;
      // login() returns null on success, or an error string on failure
      const errorMsg = await login(identifier, password);

      if (errorMsg === null) {
        // Success — AuthProvider sets isAuthenticated, useEffect redirects
        router.push("/portal/dashboard");
      } else {
        // Failed — show the error message from auth
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
          <a href="tel:078381234" className="landing-help-link">
            Need help?
          </a>
        </header>

        {/* Hero copy */}
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Manage your CPAP
            <br />
            supplies online
          </h1>
          <p className="landing-hero-subtitle">
            Check your equipment, request funded supplies, and keep your therapy
            on track.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <main className="landing-main">
        <div className="landing-card">
          {/* Tabs */}
          <div className="landing-tabs">
            <button
              className={`landing-tab ${loginMethod === "msid" ? "landing-tab--active" : ""}`}
              onClick={() => {
                setLoginMethod("msid");
                setError("");
              }}
              type="button"
            >
              Sleep ID
            </button>
            <button
              className={`landing-tab ${loginMethod === "email" ? "landing-tab--active" : ""}`}
              onClick={() => {
                setLoginMethod("email");
                setError("");
              }}
              type="button"
            >
              Email
            </button>
          </div>

          {/* Error message */}
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
                  The 6-digit number from your welcome letter
                </p>
              </div>
            ) : (
              <div className="landing-field">
                <label className="landing-label">Email address</label>
                <input
                  type="email"
                  className="landing-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="landing-spinner"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      fill="none"
                      opacity="0.3"
                    />
                    <path
                      d="M12 2a10 10 0 019.95 9"
                      stroke="white"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
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
            <Link href="/register" className="landing-card-link">
              Register
            </Link>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="landing-trust">
          <div className="landing-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secure &amp; encrypted
          </div>
          <div className="landing-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            ACC &amp; Health NZ funded
          </div>
          <div className="landing-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#74C0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            NZ hosted data
          </div>
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
