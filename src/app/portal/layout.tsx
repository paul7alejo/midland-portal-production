"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PortalSidebar from "@/components/layout/PortalSidebar";
import AccountMenu from "@/components/portal/AccountMenu";
import PortalUpdatesBell from "@/components/portal/PortalUpdatesBell";

const BOTTOM_NAV_ITEMS = [
  { href: "/portal/dashboard",   label: "Dashboard",   icon: "home" },
  { href: "/portal/equipment",   label: "Equipment",   icon: "equipment" },
  { href: "/portal/reorder",     label: "Request",     icon: "clipboard" },
  { href: "/portal/maintenance", label: "Maintenance", icon: "wrench" },
  { href: "/portal/profile",     label: "Profile",     icon: "user" },
] as const;

const BOTTOM_NAV_PATHS: Record<string, string> = {
  home:      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  equipment: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  wrench:    "M14.121 14.121L19 19m-7-7l7-7m-2.5 2.5L12 3m0 0L8.5 6.5M12 3l4.5 4.5M3 12l2-2m0 0l2.5-2.5M5 10l2.5 2.5",
  user:      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-navy border-t border-white/10 lg:hidden">
      <div className="grid grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-seafoam" : "text-slate-400 hover:text-white"
              )}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={BOTTOM_NAV_PATHS[item.icon]} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const PAGE_LABELS: Record<string, string> = {
  "/portal/dashboard":   "Dashboard",
  "/portal/equipment":   "My Equipment",
  "/portal/reorder":     "Request Supplies",
  "/portal/maintenance": "Maintenance",
  "/portal/contact":     "Contact",
  "/portal/profile":     "Profile",
  "/portal/notifications": "Notifications",
};

const AWARENESS_TEXT =
  "Care note · Clean your mask cushion weekly · Support hours Monday–Friday, 8:30am–5pm";

function TopBar() {
  const { patient } = useAuth();
  const pathname = usePathname();
  if (!patient) return null;

  const pageLabel = PAGE_LABELS[pathname] ?? "Portal";

  return (
    <div className="sticky top-0 z-40 hidden h-[72px] items-center gap-4 border-b border-white/10 bg-navy px-4 md:px-8 lg:flex">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className="shrink-0 text-sm font-semibold text-white">{pageLabel}</span>
        <span className="shrink-0 text-white/25" aria-hidden="true">·</span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="portal-awareness-track flex w-max items-center gap-8 text-xs text-white/35">
            <span className="portal-awareness-item">{AWARENESS_TEXT}</span>
            <span className="portal-awareness-item" aria-hidden="true">{AWARENESS_TEXT}</span>
            <span className="portal-awareness-item" aria-hidden="true">{AWARENESS_TEXT}</span>
            <span className="portal-awareness-item" aria-hidden="true">{AWARENESS_TEXT}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <PortalUpdatesBell
          className="[&>button]:border-white/20 [&>button]:bg-white/10 [&>button]:text-white [&>button]:shadow-none [&>button:hover]:bg-white/15"
        />
        <div className="[&>div>button:hover]:bg-white/10 [&>div>button_p]:text-white [&>div>button_p+p]:text-white/60 [&>div>button>svg]:text-white/40">
          <AccountMenu />
        </div>
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
    <div className="min-h-screen overflow-x-hidden portal-canvas">
      <div className="hidden lg:block">
        <PortalSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
      </div>

      {/* Narrow/mobile header — visible below lg (1024px) */}
      <div className="sticky top-0 z-50 lg:hidden bg-navy px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-deep-teal flex items-center justify-center text-white font-display text-sm font-bold shrink-0">
            M
          </div>
          <p className="text-white font-display text-sm font-semibold whitespace-nowrap">
            Midland Sleep
          </p>
        </div>
        {patient && (
          <div className="flex items-center gap-1.5">
            <PortalUpdatesBell className="[&>button]:border-white/20 [&>button]:bg-white/10 [&>button]:text-white [&>button]:shadow-none [&>button:hover]:bg-white/15" />
            <div className="[&>div>button:hover]:bg-white/10 [&>div>button_p]:text-white [&>div>button_p+p]:text-white/60 [&>div>button>svg]:text-white/40">
              <AccountMenu />
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />

      <main className={`relative min-h-screen overflow-x-hidden transition-all duration-200 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        <img
          src="/portal-assets/logo/midland-logo-mark-deep-teal.png"
          alt=""
          className="pointer-events-none absolute bottom-[72px] right-[-120px] z-0 hidden h-[600px] w-[600px] object-contain opacity-[0.028] md:block lg:opacity-[0.033]"
          aria-hidden="true"
        />
        <TopBar />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-20 md:px-8 md:pt-8 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalInner>{children}</PortalInner>;
}
