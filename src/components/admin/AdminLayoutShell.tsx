"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const ml = collapsed ? "lg:ml-16" : "lg:ml-64";
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";

  return (
    <div className="min-h-screen bg-cream">
      <div className="hidden lg:block">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <div className={`bg-amber text-white font-medium py-2 px-4 text-sm leading-6 sm:text-base transition-all duration-200 ${ml}`}>
        Admin View — Staff Only | Midland Sleep
      </div>

      {isStaging && (
        <div className={`bg-purple-700 text-white font-semibold py-1.5 px-4 text-sm text-center transition-all duration-200 ${ml}`}>
          STAGING — Demo data only · Not connected to production
        </div>
      )}

      <main className={`min-h-screen transition-all duration-200 ${ml}`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
