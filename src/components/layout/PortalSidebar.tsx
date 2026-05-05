"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: string; comingSoon?: boolean }[] = [
  { href: "/portal/dashboard",   label: "Dashboard",        icon: "home" },
  { href: "/portal/equipment",   label: "My Equipment",     icon: "settings" },
  { href: "/portal/reorder",     label: "Request Supplies",  icon: "clipboard" },
  { href: "/portal/maintenance", label: "Maintenance",       icon: "wrench" },
  { href: "/portal/contact",     label: "Contact",           icon: "message" },
  { href: "/portal/profile",     label: "Profile",           icon: "user" },
];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    wrench: "M14.121 14.121L19 19m-7-7l7-7m-2.5 2.5L12 3m0 0L8.5 6.5M12 3l4.5 4.5M3 12l2-2m0 0l2.5-2.5M5 10l2.5 2.5",
    message: "M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons.home} />
    </svg>
  );
}

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-navy flex flex-col">

      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <img
          src="/midland-logo.png"
          alt="Midland Sleep"
          className="h-10 w-10 object-contain rounded-lg bg-white shrink-0"
        />
        <div className="min-w-0">
          <div className="text-base font-semibold text-white whitespace-nowrap">
            Midland Sleep
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-300 whitespace-nowrap">
            Patient Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  if (item.comingSoon) {
    return (
      <div
        key={item.href}
        className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-500 cursor-not-allowed"
      >
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </div>
    );
  }
  return (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors",
        isActive
          ? "bg-[#0B5C6C]/15 text-white border-l-[3px] border-[#0B5C6C]"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <NavIcon name={item.icon} />
      {item.label}
    </Link>
  );
})}
      </nav>
    </aside>
  );
}
