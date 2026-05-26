"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/aws/cognito";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  PackageSearch,
  Target,
  Gift,
  Mail,
  FileText,
  BarChart3,
  Settings,
  Upload,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
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
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "PATIENT OPERATIONS",
      items: [
        { href: "/admin/patients",  label: "Patients",  icon: Users },
        { href: "/admin/orders",    label: "Orders",    icon: ShoppingCart },
        { href: "/admin/outreach",  label: "Outreach",  icon: Mail },
        { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
      ],
    },
    {
      label: "DATA OPERATIONS",
      items: [
        { href: "/admin/import",   label: "Import",   icon: Upload },
        { href: "/admin/segments", label: "Segments", icon: Target },
      ],
    },
    {
      label: "FINANCE & FUNDING",
      items: [
        { href: "/admin/entitlement", label: "Entitlement", icon: Gift },
        { href: "/admin/reports",     label: "Reports",     icon: BarChart3 },
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

  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-screen bg-navy flex flex-col overflow-hidden transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo / brand */}
      <div className="flex items-center border-b border-white/10 shrink-0 h-[72px]">
        {collapsed ? (
          <div className="flex w-full flex-col items-center justify-center gap-1.5">
            <img
              src="/midland-logo.png"
              alt="Midland Sleep"
              className="h-8 w-8 rounded-md"
            />
            <button
              type="button"
              onClick={onToggle}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 w-full">
            <img
              src="/midland-logo.png"
              alt="Midland Sleep"
              className="h-10 w-10 rounded-md shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-semibold text-white whitespace-nowrap">
                Midland Sleep
              </span>
              <span className="text-xs text-amber-400 font-medium whitespace-nowrap">
                Admin console
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className={collapsed ? "space-y-1" : "space-y-6"}>
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
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
                        flex items-center rounded-lg py-2.5 text-base font-medium transition-colors
                        ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                        ${
                          isActive
                            ? "bg-deep-teal text-white shadow-sm"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }
                      `}
                    >
                      <span className="relative shrink-0">
                        <Icon className="h-5 w-5" />
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

      {/* Staff info + logout */}
      <div className="p-4 border-t border-white/10 shrink-0">
        {!collapsed && (
          <div className="text-white/70 text-sm mb-2">
            <p className="font-medium text-white text-base">Staff User</p>
            <p className="text-xs">admin@midlandsleep.co.nz</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={`flex items-center text-white/70 hover:text-white transition-colors ${
            collapsed ? "justify-center w-full" : "gap-2 text-base"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
