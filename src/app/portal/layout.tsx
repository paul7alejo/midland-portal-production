"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PortalSidebar from "@/components/layout/PortalSidebar";
import AccountMenu from "@/components/portal/AccountMenu";
import PortalUpdatesBell from "@/components/portal/PortalUpdatesBell";

function TopBar() {
  const { patient } = useAuth();
  if (!patient) return null;

  return (
    <div className="sticky top-0 z-40 hidden h-[72px] items-center justify-end gap-3 border-b border-white/10 bg-navy px-4 md:px-8 lg:flex">
      <PortalUpdatesBell
        className="[&>button]:border-white/20 [&>button]:bg-white/10 [&>button]:text-white [&>button]:shadow-none [&>button:hover]:bg-white/15"
      />
      <div className="[&>button:hover]:bg-white/10 [&>button_p]:text-white [&>button_p+p]:text-white/60 [&>button>svg]:text-white/40">
        <AccountMenu />
      </div>
    </div>
  );
}

function PortalInner({ children }: { children: React.ReactNode }) {
  const { patient, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

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
        <PortalSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
      </div>

      {/* Narrow/mobile header — visible below lg (1024px) */}
      <div className="sticky top-0 z-50 lg:hidden bg-navy px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-deep-teal flex items-center justify-center text-white font-display text-sm font-bold">
            M
          </div>
          <p className="text-white font-display text-base font-semibold">
            Midland Sleep
          </p>
        </div>
        {patient && (
          <div className="flex items-center gap-2">
            <PortalUpdatesBell className="[&_button]:border-white/20 [&_button]:bg-white/10 [&_button]:text-white [&_button]:shadow-none [&_button:hover]:bg-white/15" />
            <div className="[&_button:hover]:bg-white/10 [&_p]:text-white [&_p+ p]:text-white/60 [&_svg]:text-white/60">
              <AccountMenu />
            </div>
          </div>
        )}
      </div>

      <main className={`relative min-h-screen overflow-x-hidden transition-all duration-200 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
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
