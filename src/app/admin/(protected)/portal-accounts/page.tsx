"use client";

import { useState, useMemo } from "react";
import { MOCK_ACCOUNTS, PortalAccountsTable } from "@/components/admin/PortalAccountsTable";

type FilterKey = "all" | "temp" | "locked" | "no2fa";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",    label: "All" },
  { key: "temp",   label: "Temp Password" },
  { key: "locked", label: "Locked" },
  { key: "no2fa",  label: "No 2FA" },
];

export default function PortalAccountsPage() {
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const totalAccounts   = MOCK_ACCOUNTS.length;
  const passwordChanged = MOCK_ACCOUNTS.filter((a) => a.passwordStatus === "changed").length;
  const tempPassword    = MOCK_ACCOUNTS.filter((a) => a.passwordStatus === "temp").length;
  const lockedAccounts  = MOCK_ACCOUNTS.filter((a) => a.accountStatus === "locked").length;

  const filtered = useMemo(() => {
    let list = MOCK_ACCOUNTS;
    if (activeFilter === "temp")   list = list.filter((a) => a.passwordStatus === "temp");
    if (activeFilter === "locked") list = list.filter((a) => a.accountStatus === "locked");
    if (activeFilter === "no2fa")  list = list.filter((a) => !a.twoFa);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) || a.msid.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeFilter]);

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
        <div className="bg-white border border-sand rounded-xl px-5 py-4 shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
          <p className="text-3xl font-bold tabular-nums text-navy">{totalAccounts}</p>
          <p className="text-xs text-charcoal/60 mt-1">Total Accounts</p>
        </div>
        <div className="bg-white border border-sand rounded-xl px-5 py-4 shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
          <p className="text-3xl font-bold tabular-nums text-[#0B5C6C]">{passwordChanged}</p>
          <p className="text-xs text-charcoal/60 mt-1">Password Changed</p>
        </div>
        <div className="bg-white border border-sand rounded-xl px-5 py-4 shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
          <p className="text-3xl font-bold tabular-nums text-amber-700">{tempPassword}</p>
          <p className="text-xs text-charcoal/60 mt-1">Temp Password</p>
        </div>
        <div className="bg-white border border-sand rounded-xl px-5 py-4 shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
          <p className="text-3xl font-bold tabular-nums text-red-600">{lockedAccounts}</p>
          <p className="text-xs text-charcoal/60 mt-1">Locked Accounts</p>
        </div>
      </div>

      {/* Search + filter chips */}
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
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap
                ${activeFilter === key
                  ? "bg-[#0B5C6C] text-white border-[#0B5C6C]"
                  : "bg-white text-charcoal/70 border-sand hover:border-[#0B5C6C]/40 hover:text-[#0B5C6C]"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts table */}
      <PortalAccountsTable accounts={filtered} />

    </div>
  );
}
