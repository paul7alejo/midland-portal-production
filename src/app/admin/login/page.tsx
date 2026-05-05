"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { configureCognito, getCurrentUser } from "@/lib/aws/cognito";
import { isAdminIdentity } from "@/lib/admin-identity";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, patient } = useAuth();
  const router = useRouter();

  // Redirect already-authenticated admins straight to /admin
  useEffect(() => {
    configureCognito();
    getCurrentUser().then((user) => {
      if (user && isAdminIdentity(user)) router.replace("/admin");
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdminIdentity(patient ?? {})) {
      router.replace("/admin");
    }
  }, [isAuthenticated, patient, router]);

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
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center">
          <Image
            src="/midland-logo.png"
            alt="Midland Sleep"
            width={40}
            height={40}
            className="rounded-md"
          />
          <div>
            <p className="text-white text-lg font-semibold leading-tight">Midland Sleep</p>
            <p className="text-amber-400 text-xs font-medium uppercase tracking-wider">Staff Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-5">
          <h1 className="text-2xl font-bold text-navy">Staff sign in</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
              <p className="text-base text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Email or username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                placeholder="e.g. johndoe@clinic.com or johndoe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
                           focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
                             focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                             placeholder:text-gray-400 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-[#0B5C6C] text-white text-base font-medium
                         py-3 rounded-lg min-h-[48px] transition-colors
                         hover:bg-[#0B5C6C]/90
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm">
          Patient portal?{" "}
          <a href="/login" className="text-white/60 underline hover:text-white">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
