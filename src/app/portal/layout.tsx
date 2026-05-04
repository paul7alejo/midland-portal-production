"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import PortalSidebar from "@/components/layout/PortalSidebar";

function TopBar() {
  const { patient, logout } = useAuth();
  const router = useRouter();

  if (!patient) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="border-b border-sand bg-white px-4 py-2.5 md:px-8 flex items-center justify-end gap-5">
      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-deep-teal flex items-center justify-center text-white text-xs font-bold">
          {(patient.name ?? "Patient").split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-charcoal leading-tight">{patient.name}</p>
          <p className="text-xs text-charcoal/50 font-mono">{patient.msid}</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="text-xs text-charcoal/40 hover:text-deep-teal transition-colors"
      >
        Log out
      </button>
    </div>
  );
}

function PortalInner({ children }: { children: React.ReactNode }) {
  const { patient, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-charcoal/60">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="hidden md:block">
        <PortalSidebar />
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-navy px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-deep-teal flex items-center justify-center text-white font-display text-sm font-bold">
            M
          </div>
          <p className="text-white font-display text-base font-semibold">
            Midland Sleep
          </p>
        </div>
        {patient && (
          <button onClick={handleLogout} className="text-white/60 text-xs hover:text-white">
            Log out
          </button>
        )}
      </div>

      <main className="md:ml-64 min-h-screen">
        <TopBar />
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalInner>{children}</PortalInner>;
}
