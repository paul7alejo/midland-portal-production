"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { PortalAccount } from "@/components/admin/PortalAccountsTable";
import { PortalAccountsTable } from "@/components/admin/PortalAccountsTable";
import { ResetPasswordModal } from "@/components/admin/ResetPasswordModal";
import { UnlockAccountModal } from "@/components/admin/UnlockAccountModal";
import { decrementLockedCount, setLockedCount } from "@/components/admin/portalAccountsStore";

type FilterKey = "all" | "changed" | "temp" | "locked";

interface BinEntry {
  msid:            string;
  name:            string;
  archivedAt:      string;
  archivedByEmail: string | null;
  purgeAfter:      string;
}

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

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteConfirmModal({
  account,
  onClose,
  onSuccess,
}: {
  account: PortalAccount;
  onClose: () => void;
  onSuccess: (msid: string) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const confirmed = confirmText === "DELETE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portal-accounts/delete", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ msid: account.msid, confirmationToken: "DELETE" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        setError((data.error as string | undefined) ?? "Delete failed. Please try again.");
        return;
      }
      onSuccess(account.msid);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Move to Bin</p>
            <h2 id="delete-modal-title" className="text-lg font-bold text-navy">
              {account.name}
            </h2>
            <p className="text-xs font-mono text-charcoal/60">{account.msid}</p>
          </div>

          <p className="text-sm text-charcoal/80 leading-relaxed">
            You are moving this portal account and linked patient record to the Bin. They will be
            hidden from normal admin views and can be restored within{" "}
            <span className="font-semibold">30 days</span>. Type{" "}
            <span className="font-mono font-semibold text-red-700">DELETE</span> to confirm.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400
                         font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
            />

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm font-medium text-charcoal/65 border border-sand rounded-lg py-2.5 hover:border-charcoal/30 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!confirmed || submitting}
                className="flex-1 text-sm font-semibold rounded-lg py-2.5 transition-colors
                           bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Moving to Bin…" : "Move to Bin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
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
  onDelete,
}: {
  account: PortalAccount;
  onClose: () => void;
  onResetPassword: (account: PortalAccount) => void;
  onUnlockAccount: (account: PortalAccount) => void;
  onDelete: (account: PortalAccount) => void;
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
          setActivity((payload.activity as ActivityEvent[]).slice(0, 20));
          setActivityState("loaded");
        } else {
          setActivityState("error");
        }
      })
      .catch(() => setActivityState("error"));
  }, [account.msid]);

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} aria-hidden="true" />
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
              <button
                type="button"
                onClick={() => { onClose(); onDelete(account); }}
                className="text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Move to Bin
              </button>
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
              <div className="space-y-2">
                <ul className="divide-y divide-sand max-h-72 overflow-y-auto">
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
                <p className="text-xs text-charcoal/40">
                  Showing latest 20 events · Full audit log available from{" "}
                  <a href="/admin/audit" className="underline hover:text-charcoal/60 transition-colors">Audit Log</a>.
                </p>
              </div>
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

// ── Bin view ──────────────────────────────────────────────────────────────────

function formatBinDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

function BinView({
  entries,
  loading,
  onRestore,
  restoringMsid,
}: {
  entries: BinEntry[];
  loading: boolean;
  onRestore: (entry: BinEntry) => void;
  restoringMsid: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-charcoal/45">
        Loading bin…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-sand rounded-xl px-6 py-12 text-center shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
        <p className="text-sm text-charcoal/60">No deleted portal accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
        Deleted accounts can be restored within 30 days. Restoring a portal account also
        restores the linked patient record to the active Patients list.
      </div>
      <div className="bg-white border border-sand rounded-xl overflow-hidden shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="bg-sand-pale/70 border-b border-sand">
                {["Patient", "MSID", "Deleted", "Restore before", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/70">
              {entries.map((entry) => {
                const isRestoring = restoringMsid === entry.msid;
                const purge = new Date(entry.purgeAfter);
                const daysLeft = Math.max(0, Math.ceil((purge.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                const urgent = daysLeft <= 7;
                return (
                  <tr key={entry.msid} className="hover:bg-sand-pale/45 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-charcoal">
                      {entry.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-charcoal/80">
                      {entry.msid}
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal/70 whitespace-nowrap">
                      {formatBinDate(entry.archivedAt)}
                      {entry.archivedByEmail && (
                        <span className="block text-charcoal/40">{entry.archivedByEmail}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={urgent ? "font-semibold text-red-600" : "text-charcoal/70"}>
                        {formatBinDate(entry.purgeAfter)}
                      </span>
                      {urgent && (
                        <span className="block text-red-500">{daysLeft}d remaining</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onRestore(entry)}
                        disabled={isRestoring}
                        className="text-xs font-medium text-[#0B5C6C] border border-[#0B5C6C]/40 rounded-md px-3 py-1.5 hover:bg-[#0B5C6C]/5 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isRestoring ? "Restoring…" : "Restore"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-charcoal/40 px-1">
        Permanent purge after 30 days is a separate gated admin operation and does not run automatically.
      </p>
    </div>
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

  // Bin
  const [viewBin,       setViewBin]       = useState(false);
  const [binEntries,    setBinEntries]    = useState<BinEntry[]>([]);
  const [binLoading,    setBinLoading]    = useState(false);
  const [binError,      setBinError]      = useState<string | null>(null);
  const [restoringMsid, setRestoringMsid] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<PortalAccount | null>(null);

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
      .catch(() => { /* leave empty */ })
      .finally(() => setLoading(false));
  }, []);

  // Auto-open drawer when ?msid= is present in the URL
  useEffect(() => {
    if (loading || accounts.length === 0 || autoOpenedRef.current) return;
    if (typeof window === "undefined") return;
    const msidParam = new URLSearchParams(window.location.search).get("msid");
    if (!msidParam) return;
    const match = accounts.find((a) => a.msid === msidParam);
    if (match) {
      autoOpenedRef.current = true;
      setDrawerAccount(match);
    }
  }, [accounts, loading]);

  // Load bin on first view
  useEffect(() => {
    if (!viewBin) return;
    setBinLoading(true);
    setBinError(null);
    fetch("/api/admin/portal-accounts/bin", { credentials: "include" })
      .then((r) => r.json())
      .then((data: unknown) => {
        const payload = data as Record<string, unknown>;
        if (Array.isArray(payload.bin)) {
          setBinEntries(payload.bin as BinEntry[]);
        } else {
          setBinError("Failed to load bin.");
        }
      })
      .catch(() => setBinError("Network error loading bin."))
      .finally(() => setBinLoading(false));
  }, [viewBin]);

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

  function handleDeleteSuccess(msid: string) {
    setAccounts((prev) => prev.filter((a) => a.msid !== msid));
    setDeleteTarget(null);
  }

  async function handleRestore(entry: BinEntry) {
    if (restoringMsid) return;
    setRestoringMsid(entry.msid);
    try {
      const res = await fetch("/api/admin/portal-accounts/restore", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ msid: entry.msid, confirmationToken: "RESTORE" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        alert((data.error as string | undefined) ?? "Restore failed. Please try again.");
        return;
      }
      // Remove from bin list
      setBinEntries((prev) => prev.filter((e) => e.msid !== entry.msid));
      // Reload active accounts so restored account appears
      const accountsRes = await fetch("/api/admin/portal-accounts", { credentials: "include" });
      if (accountsRes.ok) {
        const data = await accountsRes.json() as Record<string, unknown>;
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts as PortalAccount[]);
        }
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setRestoringMsid(null);
    }
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
        <div className="flex items-center gap-3">
          {/* Active / Bin tabs */}
          <div className="flex items-center rounded-lg border border-sand overflow-hidden bg-white text-sm font-medium">
            <button
              type="button"
              onClick={() => setViewBin(false)}
              className={`px-4 py-2 transition-colors ${!viewBin ? "bg-navy text-white" : "text-charcoal/60 hover:bg-sand/60"}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setViewBin(true)}
              className={`px-4 py-2 transition-colors ${viewBin ? "bg-navy text-white" : "text-charcoal/60 hover:bg-sand/60"}`}
            >
              Bin
              {binEntries.length > 0 && !viewBin && (
                <span className="ml-1.5 text-xs bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">
                  {binEntries.length}
                </span>
              )}
            </button>
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
      </div>

      {viewBin ? (
        <>
          {binError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
              {binError}
            </div>
          ) : (
            <BinView
              entries={binEntries}
              loading={binLoading}
              onRestore={handleRestore}
              restoringMsid={restoringMsid}
            />
          )}
        </>
      ) : (
        <>
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
              onDelete={(account) => setDeleteTarget(account)}
            />
          )}
        </>
      )}

      {/* Account detail drawer */}
      {drawerAccount && (
        <PortalAccountDetailDrawer
          key={drawerAccount.id}
          account={drawerAccount}
          onClose={() => setDrawerAccount(null)}
          onResetPassword={(a) => setResetTarget(a)}
          onUnlockAccount={(a) => setUnlockTarget(a)}
          onDelete={(a) => setDeleteTarget(a)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          key={deleteTarget.id}
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <ResetPasswordModal
          key={resetTarget.id}
          account={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

      {/* Unlock account modal */}
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
