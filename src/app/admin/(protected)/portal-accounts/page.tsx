"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { PortalAccount } from "@/components/admin/PortalAccountsTable";
import { PortalAccountsTable } from "@/components/admin/PortalAccountsTable";
import { ResetPasswordModal } from "@/components/admin/ResetPasswordModal";
import { UnlockAccountModal } from "@/components/admin/UnlockAccountModal";
import { decrementLockedCount, setLockedCount } from "@/components/admin/portalAccountsStore";

type FilterKey = "all" | "changed" | "temp" | "locked";

// ── KPI card ─────────────────────────────────────────────────────────────────

type KpiTheme = "navy" | "seafoam" | "amber" | "red";

const KPI_THEMES: Record<
  KpiTheme,
  { normal: string; active: string; ring: string; num: string; label: string }
> = {
  navy: {
    normal: "bg-navy/[0.07] border-navy/15 hover:bg-navy/[0.11]",
    active: "bg-navy/[0.13] border-navy/40",
    ring:   "ring-2 ring-navy/15",
    num:    "text-navy",
    label:  "text-navy/65",
  },
  seafoam: {
    normal: "bg-[#74C0A2]/10 border-[#74C0A2]/25 hover:bg-[#74C0A2]/[0.16]",
    active: "bg-[#74C0A2]/[0.20] border-[#74C0A2]/50",
    ring:   "ring-2 ring-[#74C0A2]/20",
    num:    "text-[#0B5C6C]",
    label:  "text-[#0B5C6C]/65",
  },
  amber: {
    normal: "bg-amber-50 border-amber-200/70 hover:bg-amber-100/70",
    active: "bg-amber-100 border-amber-300/80",
    ring:   "ring-2 ring-amber-200",
    num:    "text-amber-700",
    label:  "text-amber-700/65",
  },
  red: {
    normal: "bg-red-50 border-red-200 hover:bg-red-100/70",
    active: "bg-red-100 border-red-300/80",
    ring:   "ring-2 ring-red-200",
    num:    "text-red-600",
    label:  "text-red-600/65",
  },
};

function KpiFilterCard({
  label,
  value,
  active,
  theme,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  theme: KpiTheme;
  onClick: () => void;
}) {
  const t = KPI_THEMES[theme];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left rounded-xl px-5 py-4 shadow-[0_18px_50px_rgba(11,42,60,0.08)] transition-all border
        ${active ? `${t.active} ${t.ring}` : t.normal}`}
    >
      <p className={`text-3xl font-bold tabular-nums ${t.num}`}>{value}</p>
      <p className={`text-xs mt-1 font-medium ${t.label}`}>{label}</p>
    </button>
  );
}

// ── Account detail drawer ─────────────────────────────────────────────────────

type ActivityLoadState = "loading" | "loaded" | "error";

interface ActivityEvent {
  timestamp:  string;
  label:      string;
  action:     string;
  adminEmail: string | null;
  result:     string | null;
}

function formatDrawerDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NZ", { day: "numeric", month: "long", year: "numeric" });
}

function formatActivityTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function PortalAccountDetailDrawer({
  account,
  onClose,
  onResetPassword,
  onUnlockAccount,
}: {
  account: PortalAccount;
  onClose: () => void;
  onResetPassword: (account: PortalAccount) => void;
  onUnlockAccount: (account: PortalAccount) => void;
}) {
  const loginUsername = account.msid.startsWith("MS-") ? account.msid.slice(3) : account.msid;

  const [activityState, setActivityState] = useState<ActivityLoadState>("loading");
  const [activity, setActivity]           = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setActivityState("loading");
    fetch(`/api/admin/portal-accounts/activity?msid=${encodeURIComponent(account.msid)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const payload = data as Record<string, unknown>;
        if (Array.isArray(payload.activity)) {
          setActivity(payload.activity as ActivityEvent[]);
          setActivityState("loaded");
        } else {
          setActivityState("error");
        }
      })
      .catch(() => setActivityState("error"));
  }, [account.msid]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Account support details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-sand-pale shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-sand px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-deep-teal">Account Support Details</p>
            <h2 className="text-base font-semibold text-navy mt-0.5 truncate">{account.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="shrink-0 rounded-lg p-2 text-charcoal/40 hover:text-charcoal/70 hover:bg-sand/60 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">

          {/* Identity */}
          <section className="bg-white border border-sand rounded-xl p-5 space-y-4 shadow-[0_4px_20px_rgba(11,42,60,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Patient identity</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">Full name</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal">{account.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">MSID</dt>
                <dd className="mt-0.5 font-mono text-sm text-charcoal/80">{account.msid || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">Login username</dt>
                <dd className="mt-0.5 font-mono text-sm text-charcoal/80">{loginUsername}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">NHI</dt>
                <dd className="mt-0.5 font-mono text-sm text-charcoal/55 select-none">{account.nhiMasked || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">Created</dt>
                <dd className="mt-0.5 text-sm text-charcoal/70">{formatDrawerDate(account.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {/* Status */}
          <section className="bg-white border border-sand rounded-xl p-5 space-y-4 shadow-[0_4px_20px_rgba(11,42,60,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Account status</p>
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45 mb-1.5">Status</dt>
                {account.accountStatus === "locked" ? (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                    Locked
                  </span>
                ) : (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35">
                    Active
                  </span>
                )}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45 mb-1.5">Password</dt>
                {account.passwordStatus === "changed" ? (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35">
                    Changed
                  </span>
                ) : (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Temp
                  </span>
                )}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45 mb-1.5">2FA</dt>
                {account.twoFa ? (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35">
                    Enabled
                  </span>
                ) : (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-charcoal/50 border border-sand">
                    Not enabled
                  </span>
                )}
              </div>
            </dl>
          </section>

          {/* Actions */}
          <section className="bg-white border border-sand rounded-xl p-5 space-y-3 shadow-[0_4px_20px_rgba(11,42,60,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Actions</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { onClose(); onResetPassword(account); }}
                className="text-sm font-medium text-[#0B5C6C] border border-[#0B5C6C]/40 rounded-lg px-4 py-2 hover:bg-[#0B5C6C]/5 transition-colors"
              >
                Reset Password
              </button>
              {account.accountStatus === "locked" && (
                <button
                  type="button"
                  onClick={() => { onClose(); onUnlockAccount(account); }}
                  className="text-sm font-medium text-red-700 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
                >
                  Unlock Account
                </button>
              )}
            </div>
          </section>

          {/* Linked Patient Record */}
          <section className="bg-white border border-sand rounded-xl p-5 space-y-3 shadow-[0_4px_20px_rgba(11,42,60,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Linked Patient Record</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">MSID</dt>
                <dd className="mt-0.5 font-mono text-sm text-charcoal/80">{account.msid}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/45">Name</dt>
                <dd className="mt-0.5 text-sm text-charcoal">{account.name}</dd>
              </div>
            </dl>
            <div className="pt-1">
              <a
                href={`/admin/patients?msid=${encodeURIComponent(account.msid)}`}
                className="inline-block text-sm font-medium text-[#0B5C6C] border border-[#0B5C6C]/40 rounded-lg px-4 py-2 hover:bg-[#0B5C6C]/5 transition-colors"
              >
                Open Patient Record
              </a>
            </div>
          </section>

          {/* Recent Account Activity */}
          <section className="bg-white border border-sand rounded-xl p-5 space-y-3 shadow-[0_4px_20px_rgba(11,42,60,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Recent Account Activity</p>

            {activityState === "loading" && (
              <p className="text-sm text-charcoal/45">Loading activity…</p>
            )}

            {activityState === "error" && (
              <p className="text-sm text-charcoal/45">Account activity temporarily unavailable.</p>
            )}

            {activityState === "loaded" && activity.length === 0 && (
              <div className="space-y-1">
                <p className="text-sm text-charcoal/50">No recent account activity found.</p>
                <p className="text-xs text-charcoal/40">Full audit-linked activity is available from Audit Log.</p>
              </div>
            )}

            {activityState === "loaded" && activity.length > 0 && (
              <ul className="divide-y divide-sand">
                {activity.map((event, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal">{event.label}</p>
                      <p className="text-xs text-charcoal/50 mt-0.5">
                        {formatActivityTime(event.timestamp)}
                        {event.adminEmail ? ` · ${event.adminEmail}` : ""}
                      </p>
                    </div>
                    {event.result && (
                      <span className="shrink-0 mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-sand text-charcoal/55 border border-sand/80">
                        {event.result}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-sand px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm font-medium text-charcoal/65 border border-sand rounded-lg py-2.5 hover:border-charcoal/30 hover:text-charcoal transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortalAccountsPage() {
  const [accounts, setAccounts]           = useState<PortalAccount[]>([]);
  const [loading, setLoading]             = useState(true);
  const autoOpenedRef                     = useRef(false);
  const [search, setSearch]               = useState("");
  const [activeFilter, setActiveFilter]   = useState<FilterKey>("all");
  const [resetTarget, setResetTarget]     = useState<PortalAccount | null>(null);
  const [unlockTarget, setUnlockTarget]   = useState<PortalAccount | null>(null);
  const [drawerAccount, setDrawerAccount] = useState<PortalAccount | null>(null);

  useEffect(() => {
    fetch("/api/admin/portal-accounts", { credentials: "include" })
      .then((r) => r.json())
      .then((data: unknown) => {
        const payload = data as Record<string, unknown>;
        if (Array.isArray(payload.accounts)) {
          const loaded = payload.accounts as PortalAccount[];
          setAccounts(loaded);
          setLockedCount(loaded.filter((a) => a.accountStatus === "locked").length);
        }
      })
      .catch(() => { /* leave empty — network error, table stays blank */ })
      .finally(() => setLoading(false));
  }, []);

  // Auto-open drawer when ?msid= is present in the URL (e.g. navigating from patient drawer)
  useEffect(() => {
    if (loading || accounts.length === 0 || autoOpenedRef.current) return;
    if (typeof window === 'undefined') return;
    const msidParam = new URLSearchParams(window.location.search).get('msid');
    if (!msidParam) return;
    const match = accounts.find((a) => a.msid === msidParam);
    if (match) {
      autoOpenedRef.current = true;
      setDrawerAccount(match);
    }
  }, [accounts, loading]);

  const totalAccounts   = accounts.length;
  const passwordChanged = accounts.filter((a) => a.passwordStatus === "changed").length;
  const tempPassword    = accounts.filter((a) => a.passwordStatus === "temp").length;
  const lockedAccounts  = accounts.filter((a) => a.accountStatus === "locked").length;

  const filtered = useMemo(() => {
    let list = accounts;
    if (activeFilter === "changed") list = list.filter((a) => a.passwordStatus === "changed");
    if (activeFilter === "temp")    list = list.filter((a) => a.passwordStatus === "temp");
    if (activeFilter === "locked")  list = list.filter((a) => a.accountStatus === "locked");
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
        <KpiFilterCard label="Total Accounts"   value={totalAccounts}   active={activeFilter === "all"}     theme="navy"    onClick={() => setActiveFilter("all")} />
        <KpiFilterCard label="Password Changed" value={passwordChanged} active={activeFilter === "changed"} theme="seafoam" onClick={() => setActiveFilter("changed")} />
        <KpiFilterCard label="Temp Password"    value={tempPassword}    active={activeFilter === "temp"}    theme="amber"   onClick={() => setActiveFilter("temp")} />
        <KpiFilterCard label="Locked Accounts"  value={lockedAccounts}  active={activeFilter === "locked"}  theme="red"     onClick={() => setActiveFilter("locked")} />
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
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

      {/* Accounts table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-charcoal/45">
          Loading accounts…
        </div>
      ) : (
        <PortalAccountsTable
          accounts={filtered}
          onResetPassword={(account) => setResetTarget(account)}
          onUnlockAccount={(account) => setUnlockTarget(account)}
          onViewDetails={(account) => setDrawerAccount(account)}
        />
      )}

      {/* Account detail drawer */}
      {drawerAccount && (
        <PortalAccountDetailDrawer
          key={drawerAccount.id}
          account={drawerAccount}
          onClose={() => setDrawerAccount(null)}
          onResetPassword={(a) => setResetTarget(a)}
          onUnlockAccount={(a) => setUnlockTarget(a)}
        />
      )}

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
