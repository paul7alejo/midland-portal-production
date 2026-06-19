"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/aws/cognito";
import {
  LayoutDashboard,
  Inbox,
  Users,
  ShoppingCart,
  PackageSearch,
  Target,
  Gift,
  Mail,
  Bell,
  FileText,
  BarChart3,
  Settings,
  Upload,
  Shield,
  PanelLeftClose,
  LogOut,
} from "lucide-react";
import {
  getLockedCount,
  subscribeLockedCount,
} from "@/components/admin/portalAccountsStore";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [lockedCount, setLockedCount] = useState(getLockedCount);

  useEffect(() => subscribeLockedCount(() => setLockedCount(getLockedCount())), []);

  const navSections: NavSection[] = [
    {
      label: "MAIN",
      items: [
        { href: "/admin",          label: "Dashboard",     icon: LayoutDashboard },
        { href: "/admin/activity", label: "Activity Inbox", icon: Inbox },
      ],
    },
    {
      label: "PATIENT OPERATIONS",
      items: [
        { href: "/admin/patients", label: "Patients",        icon: Users },
        { href: "/admin/orders",   label: "Requests",        icon: ShoppingCart },
        { href: "/admin/notices",  label: "Patient Notices", icon: Bell },
        { href: "/admin/outreach", label: "Outreach",        icon: Mail },
      ],
    },
    {
      label: "SUPPLY OPERATIONS",
      items: [
        { href: "/admin/inventory",   label: "Inventory",   icon: PackageSearch },
        { href: "/admin/entitlement", label: "Entitlement", icon: Gift },
      ],
    },
    {
      label: "DATA OPERATIONS",
      items: [
        { href: "/admin/import",   label: "Import",   icon: Upload },
        { href: "/admin/segments", label: "Segments", icon: Target },
        { href: "/admin/reports",  label: "Reports",  icon: BarChart3 },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { href: "/admin/portal-accounts", label: "Portal Accounts", icon: Shield, badge: lockedCount },
        { href: "/admin/audit",           label: "Audit Log",       icon: FileText },
        { href: "/admin/config",          label: "Config",          icon: Settings },
      ],
    },
  ];

  async function handleLogout() {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut();
    } catch {
      // silent
    } finally {
      window.location.replace("/admin/login");
    }
  }

  function expandIfCollapsed() {
    if (collapsed) onToggle();
  }

  return (
    <aside
      aria-label={collapsed ? "Collapsed admin sidebar. Click to expand." : "Admin sidebar"}
      tabIndex={collapsed ? 0 : undefined}
      onClick={expandIfCollapsed}
      onKeyDown={(event) => {
        if (!collapsed || event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`fixed left-0 top-0 z-30 h-screen bg-navy flex flex-col overflow-hidden transition-all duration-200 ${
        collapsed ? "w-16 cursor-pointer" : "w-60"
      }`}
    >
      {/* Logo / brand */}
      <div className="flex items-center border-b border-white/10 shrink-0 h-16">
        {collapsed ? (
          <div className="flex w-full items-center justify-center">
            <img
              src="/midland-logo.png"
              alt="Midland Sleep"
              className="h-8 w-8 rounded-md"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 w-full">
            <img
              src="/midland-logo.png"
              alt="Midland Sleep"
              className="h-9 w-9 rounded-md shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white whitespace-nowrap">
                Midland Sleep
              </span>
              <span className="text-[10px] uppercase tracking-wide text-amber-400 font-bold whitespace-nowrap">
                Admin console
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/75 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-hidden py-2.5 px-2">
        <div className={collapsed ? "space-y-1" : "space-y-3"}>
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center rounded-lg py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-200/30
                        ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                        ${
                          isActive
                            ? "bg-gradient-to-r from-[#0B8A9A] to-[#0B5C6C] text-white shadow-sm"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }
                      `}
                    >
                      <span className="relative shrink-0">
                        <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-white/75"}`} />
                        {collapsed && item.badge != null && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 text-[8px] font-bold leading-none px-1 py-px rounded-full bg-orange-500 text-white">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge != null && item.badge > 0 && (
                            <span className="ml-auto text-[10px] font-bold tabular-nums leading-none px-1.5 py-0.5 rounded-full bg-orange-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="mb-2 flex items-center gap-2 text-white/80 text-xs">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B8A9A] text-[11px] font-bold text-white">
              SU
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm">Staff User</p>
              <p className="truncate text-[11px] text-white/70">admin@midlandsleep.co.nz</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
