"use client";

import "../../landing-styles.css";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { configureCognito, getCurrentUser, getIdToken } from "@/lib/aws/cognito";
import { isAdminIdentity } from "@/lib/admin-identity";
import AnimatedLoginBackground from "@/components/auth/AnimatedLoginBackground";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState("");

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
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        router.replace("/admin");
      } catch {
        // session refresh failed — stay on login page
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
              Staff Portal
            </p>
          </div>
        </div>

        {/* Patient portal link */}
        <Link
          href="/login"
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
          Patient portal
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
            Staff sign in
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
            Secure access for Midland Sleep clinical and admin staff.
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
          {/* Error banner */}
          {error && (
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
          )}

          <form onSubmit={handleLogin}>
            {/* Email / username */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}
              >
                Email or staff username
              </label>
              <input
                type="text"
                autoComplete="username"
                className="landing-input"
                placeholder="e.g. jane@midlandsleep.co.nz"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#444", marginBottom: "8px" }}
              >
                Password
              </label>
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

            {/* Submit */}
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
        </div>
      </main>
    </div>
  );
}
