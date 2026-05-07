"use client";

import "../../landing-styles.css";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { configureCognito, getCurrentUser, getIdToken } from "@/lib/aws/cognito";
import { isAdminIdentity } from "@/lib/admin-identity";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  // Fresh Cognito check only — do not read stale AuthProvider cache here,
  // as the cache may still hold the user who just logged out.
  // Must refresh the id_token cookie before navigating to /admin so the
  // server-side layout's getAdminUser() finds a valid cookie. Without this,
  // an expired cookie causes a redirect loop even when the Cognito session
  // is still alive (Amplify auto-refreshes via refresh token).
  useEffect(() => {
    configureCognito();
    getCurrentUser().then(async (user) => {
      if (!user || !isAdminIdentity(user)) return;
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        router.replace("/admin");
      } catch {
        // session refresh failed — stay on login page
      }
    });
  }, []);

  const isFormValid = email.length > 0 && password.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: errorMsg, redirectTo } = await login(email.trim(), password);
      if (errorMsg === null) {
        if (redirectTo === "/admin") {
          router.replace("/admin");
        } else {
          setError("This account does not have staff access.");
        }
      } else {
        setError(errorMsg);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-glow landing-glow--top-right" />
        <div className="landing-glow landing-glow--bottom-left" />

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
              <span className="landing-logo-sub">Staff Portal</span>
            </div>
          </div>
        </header>

        <div className="landing-hero-content">
          <h1 className="landing-hero-title">Staff sign in</h1>
          <p className="landing-hero-subtitle">
            Secure access for Midland Sleep clinical and admin staff.
          </p>
        </div>
      </div>

      {/* Login card */}
      <main className="landing-main">
        <div className="landing-card">
          {error && (
            <div className="landing-error">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="landing-field">
              <label className="landing-label">Email or staff username</label>
              <input
                type="text"
                autoComplete="username"
                className="landing-input"
                placeholder="e.g. johndoe@clinic.com or johndoe"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              />
            </div>

            <div className="landing-field">
              <label className="landing-label">Password</label>
              <div className="landing-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
            <a href="/login" className="landing-card-link">
              Patient portal
            </a>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-divider" />
        <p className="landing-footer-text">
          Midland Sleep Ltd · Waikato, New Zealand
          <br />
          <span className="landing-footer-credit">Portal by OneOfZero Systems</span>
        </p>
      </footer>
    </div>
  );
}
