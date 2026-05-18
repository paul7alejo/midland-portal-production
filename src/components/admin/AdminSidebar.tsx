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

export default function AdminSidebar() {
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
        { href: "/admin/patients", label: "Patients", icon: Users },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/outreach", label: "Outreach", icon: Mail },
        { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
      ],
    },
    {
      label: "DATA OPERATIONS",
      items: [
        { href: "/admin/import", label: "Import", icon: Upload },
        { href: "/admin/segments", label: "Segments", icon: Target },
      ],
    },
    {
      label: "FINANCE & FUNDING",
      items: [
        { href: "/admin/entitlement", label: "Entitlement", icon: Gift },
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { href: "/admin/portal-accounts", label: "Portal Accounts", icon: Shield, badge: lockedCount },
        { href: "/admin/audit", label: "Audit Log", icon: FileText },
        { href: "/admin/config", label: "Config", icon: Settings },
      ],
    },
  ];

  async function handleLogout() {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      await signOut();
    } catch {
      // silent
    } finally {
      window.location.replace('/admin/login');
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-navy flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <img
          src="/midland-logo.png"
          alt="Midland Sleep"
          className="h-10 w-10 rounded-md"
        />
        <div className="flex flex-col">
          <span className="text-base font-semibold text-white">
            Midland Sleep
          </span>
          <span className="text-xs text-amber-400 font-medium">
            Admin console
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {section.label}
              </p>
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
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors
                        ${
                          isActive
                            ? "bg-deep-teal text-white shadow-sm"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className="ml-auto text-[10px] font-bold tabular-nums leading-none px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom - Staff info */}
      <div className="p-4 border-t border-white/10">
        <div className="text-white/70 text-sm mb-2">
          <p className="font-medium text-white text-base">Staff User</p>
          <p className="text-xs">admin@midlandsleep.co.nz</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/70 hover:text-white text-base transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
