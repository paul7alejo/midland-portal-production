"use client";

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
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/admin/segments", label: "Segments", icon: Target },
  { href: "/admin/entitlement", label: "Entitlement", icon: Gift },
  { href: "/admin/outreach", label: "Outreach", icon: Mail },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/config", label: "Config", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

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
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 py-3 px-4 text-base transition-colors
                ${
                  isActive
                    ? "bg-deep-teal text-white border-l-4 border-seafoam"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
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
