"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PortalSidebar from "@/components/layout/PortalSidebar";
import AccountMenu from "@/components/portal/AccountMenu";

function TopBar() {
  const { patient } = useAuth();
  if (!patient) return null;

  return (
    <div className="relative z-10 border-b border-sand bg-white px-4 py-2 md:px-8 hidden lg:flex items-center justify-end">
      <AccountMenu />
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

  const handleLogout = async () => {
    await logout();
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
    <div className="min-h-screen bg-cream overflow-x-hidden">
      <div className="hidden lg:block">
        <PortalSidebar />
      </div>

      {/* Narrow/mobile header — visible below lg (1024px) */}
      <div className="lg:hidden bg-navy px-4 py-3 flex items-center justify-between">
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

      <main className="relative lg:ml-64 min-h-screen overflow-x-hidden">
        <img
          src="/portal-assets/logo/midland-logo-mark-deep-teal.png"
          alt=""
          className="pointer-events-none absolute bottom-[72px] right-[-120px] z-0 hidden h-[600px] w-[600px] object-contain opacity-[0.028] md:block lg:opacity-[0.033]"
          aria-hidden="true"
        />
        <TopBar />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalInner>{children}</PortalInner>;
}
