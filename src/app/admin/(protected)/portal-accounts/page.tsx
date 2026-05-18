"use client";

import { useState, useMemo } from "react";
import type { PortalAccount } from "@/components/admin/PortalAccountsTable";
import { MOCK_ACCOUNTS, PortalAccountsTable } from "@/components/admin/PortalAccountsTable";
import { ResetPasswordModal } from "@/components/admin/ResetPasswordModal";
import { UnlockAccountModal } from "@/components/admin/UnlockAccountModal";
import { decrementLockedCount } from "@/components/admin/portalAccountsStore";

type FilterKey = "all" | "changed" | "temp" | "locked";

function KpiFilterCard({
  label,
  value,
  active,
  valueClassName,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  valueClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left bg-white border rounded-xl px-5 py-4 shadow-[0_18px_50px_rgba(11,42,60,0.08)] transition-colors
        ${active
          ? "border-[#0B5C6C] ring-2 ring-[#0B5C6C]/20 bg-[#0B5C6C]/5"
          : "border-sand hover:border-[#0B5C6C]/45"
        }`}
    >
      <p className={`text-3xl font-bold tabular-nums ${valueClassName}`}>{value}</p>
      <p className="text-xs text-charcoal/60 mt-1">{label}</p>
    </button>
  );
}

export default function PortalAccountsPage() {
  const [accounts, setAccounts]         = useState<PortalAccount[]>(MOCK_ACCOUNTS);
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [resetTarget, setResetTarget]   = useState<PortalAccount | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<PortalAccount | null>(null);

  const totalAccounts   = accounts.length;
  const passwordChanged = accounts.filter((a) => a.passwordStatus === "changed").length;
  const tempPassword    = accounts.filter((a) => a.passwordStatus === "temp").length;
  const lockedAccounts  = accounts.filter((a) => a.accountStatus === "locked").length;

  const filtered = useMemo(() => {
    let list = accounts;
    if (activeFilter === "changed") list = list.filter((a) => a.passwordStatus === "changed");
    if (activeFilter === "temp")   list = list.filter((a) => a.passwordStatus === "temp");
    if (activeFilter === "locked") list = list.filter((a) => a.accountStatus === "locked");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) || a.msid.toLowerCase().includes(q)
      );
    }
    return list;
  }, [accounts, search, activeFilter]);

  function handleUnlockSuccess(msid: string) {
    setAccounts((prev) =>
      prev.map((a) => a.msid === msid ? { ...a, accountStatus: "active" as const } : a)
    );
    decrementLockedCount();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">System</p>
          <h1 className="text-3xl font-display font-bold text-navy">Portal Accounts</h1>
          <p className="text-sm text-charcoal/65">Monitor patient login status and credential support.</p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg cursor-not-allowed select-none"
        >
          Export CSV
          <span className="text-xs font-normal">(Coming soon)</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiFilterCard
          label="Total Accounts"
          value={totalAccounts}
          active={activeFilter === "all"}
          valueClassName="text-navy"
          onClick={() => setActiveFilter("all")}
        />
        <KpiFilterCard
          label="Password Changed"
          value={passwordChanged}
          active={activeFilter === "changed"}
          valueClassName="text-[#0B5C6C]"
          onClick={() => setActiveFilter("changed")}
        />
        <KpiFilterCard
          label="Temp Password"
          value={tempPassword}
          active={activeFilter === "temp"}
          valueClassName="text-amber-700"
          onClick={() => setActiveFilter("temp")}
        />
        <KpiFilterCard
          label="Locked Accounts"
          value={lockedAccounts}
          active={activeFilter === "locked"}
          valueClassName="text-red-600"
          onClick={() => setActiveFilter("locked")}
        />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or MSID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 bg-white border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/20 focus:border-[#0B5C6C]/50 transition-colors"
          />
        </div>
      </div>

      {/* Accounts table */}
      <PortalAccountsTable
        accounts={filtered}
        onResetPassword={(account) => setResetTarget(account)}
        onUnlockAccount={(account) => setUnlockTarget(account)}
      />

      {/* Reset password modal — key forces fresh mount per account */}
      {resetTarget && (
        <ResetPasswordModal
          key={resetTarget.id}
          account={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

      {/* Unlock account modal — key forces fresh mount per account */}
      {unlockTarget && (
        <UnlockAccountModal
          key={unlockTarget.id}
          account={unlockTarget}
          onClose={() => setUnlockTarget(null)}
          onSuccess={handleUnlockSuccess}
        />
      )}

    </div>
  );
}
