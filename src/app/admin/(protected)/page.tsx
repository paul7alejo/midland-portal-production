"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Clock, Users, Shield, AlertTriangle } from "lucide-react";

// ─── Local API shapes (only fields the dashboard uses) ────────────────────────

interface DashOrder {
  id: string;
  patient: string;
  msid: string;
  items: string;
  status: string;
  created_at: string;
  needsFundingReview: boolean;
}

interface DashPatient {
  patient_id: string;
  portal_id: string;
  name: string;
  review_status?: string;
  needs_outreach?: boolean;
  safety_check_required?: boolean;
}

interface DashAccount {
  id: string;
  name: string;
  msid: string;
  passwordStatus: "temp" | "changed";
  accountStatus: "active" | "locked";
  createdAt: string;
}

// ─── Urgency (relative to now) ────────────────────────────────────────────────

type Urgency = { dot: string; label: string };

function getUrgency(iso: string): Urgency {
  const diffH = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
  if (diffH < 24)     return { dot: "#74C0A2", label: "Low" };
  if (diffH < 7 * 24) return { dot: "#F59E0B", label: "Normal" };
  return                     { dot: "#C0392B", label: "Urgent" };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatArrived(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${date} · ${h}:${String(m).padStart(2, "0")}${ampm}`;
}

function formatWaiting(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const totalH = Math.floor(diffMs / (1000 * 60 * 60));
  const d = Math.floor(totalH / 24);
  const h = totalH % 24;
  return d === 0 ? `${h}h` : `${d}d ${String(h).padStart(2, "0")}h`;
}

// ─── Shared cell class fragments ──────────────────────────────────────────────

const TH = "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-left";
const TD = "px-3 py-2.5";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [ordersData,   setOrdersData]   = useState<DashOrder[]   | null>(null);
  const [patientsData, setPatientsData] = useState<DashPatient[] | null>(null);
  const [accountsData, setAccountsData] = useState<DashAccount[] | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetch("/api/admin/orders").then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch("/api/admin/patients").then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch("/api/admin/portal-accounts").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    ]).then(([ordersRes, patientsRes, accountsRes]) => {
      if (cancelled) return;
      if (ordersRes.status === "fulfilled")
        setOrdersData((ordersRes.value as { orders: DashOrder[] }).orders ?? []);
      if (patientsRes.status === "fulfilled")
        setPatientsData((patientsRes.value as { patients: DashPatient[] }).patients ?? []);
      if (accountsRes.status === "fulfilled")
        setAccountsData((accountsRes.value as { accounts: DashAccount[] }).accounts ?? []);
      const anyFailed = [ordersRes, patientsRes, accountsRes].some(r => r.status === "rejected");
      if (anyFailed) setApiError("Some data could not be loaded. Partial results shown.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ─── Derived counts ──────────────────────────────────────────────────────────
  const totalPatients = patientsData?.length ?? 0;
  const totalRequests = ordersData?.length ?? 0;
  const needsFunding  = ordersData?.filter(o => o.needsFundingReview).length ?? 0;
  const totalAccounts = accountsData?.length ?? 0;
  const tempPasswords = accountsData?.filter(a => a.passwordStatus === "temp").length ?? 0;
  const needsOutreach = patientsData?.filter(p => p.needs_outreach || p.safety_check_required).length ?? 0;
  const safetyChecks  = patientsData?.filter(p => p.safety_check_required).length ?? 0;

  // ─── Panel rows (newest 8 each) ───────────────────────────────────────────────
  const recentRequests = (ordersData ?? [])
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  const outreachPatients = (patientsData ?? [])
    .filter(p => p.needs_outreach || p.safety_check_required)
    .slice(0, 8);

  const tempAccounts = (accountsData ?? [])
    .filter(a => a.passwordStatus === "temp")
    .slice(0, 8);

  // ─── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">Admin overview</p>
          <h1 className="font-display text-3xl font-bold text-navy">Daily operations</h1>
          <p className="text-base leading-6 text-gray-700">
            Operational snapshot for patient review, supply requests, and staff follow-up.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-sand rounded-xl py-3 px-4 space-y-2 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400">Loading dashboard data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">Admin overview</p>
        <h1 className="font-display text-3xl font-bold text-navy">Daily operations</h1>
        <p className="text-base leading-6 text-gray-700">
          Operational snapshot for patient review, supply requests, and staff follow-up.
        </p>
      </div>

      {apiError && (
        <div className="rounded-xl border border-amber/40 bg-amber/5 px-5 py-3 text-sm text-amber-800">
          {apiError}
        </div>
      )}

      {/* SECTION 1 — KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          href="/admin/patients"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Total patients</h3>
            <Users className="h-4 w-4 text-deep-teal" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">
            {patientsData === null ? "—" : totalPatients}
          </p>
          <p className="text-xs text-gray-700">Imported patient register</p>
        </Link>

        <Link
          href="/admin/orders"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Patient requests</h3>
            <ShoppingBag className="h-4 w-4 text-deep-teal" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">
            {ordersData === null ? "—" : totalRequests}
          </p>
          <p className="text-xs text-gray-700">All supply requests</p>
        </Link>

        <Link
          href="/admin/orders"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Needs funding review</h3>
            <Clock className="h-4 w-4 text-amber" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">
            {ordersData === null ? "—" : needsFunding}
          </p>
          <p className="text-xs text-gray-700">Flagged for funding review</p>
          {needsFunding > 0 && (
            <p className="text-xs text-amber font-medium">Action required</p>
          )}
        </Link>

        <Link
          href="/admin/portal-accounts"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Portal accounts</h3>
            <Shield className="h-4 w-4 text-deep-teal" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">
            {accountsData === null ? "—" : totalAccounts}
          </p>
          <p className="text-xs text-gray-700">Active patient portal accounts</p>
        </Link>

        <Link
          href="/admin/portal-accounts"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Temp passwords</h3>
            <Clock className="h-4 w-4 text-amber" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">
            {accountsData === null ? "—" : tempPasswords}
          </p>
          <p className="text-xs text-gray-700">Password not yet changed</p>
          {tempPasswords > 0 && (
            <p className="text-xs text-amber font-medium">Invite not completed</p>
          )}
        </Link>

        <Link
          href="/admin/patients"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Needs outreach</h3>
            <AlertTriangle className="h-4 w-4 text-amber" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">
            {patientsData === null ? "—" : needsOutreach}
          </p>
          <p className="text-xs text-gray-700">Safety check or outreach flagged</p>
          {needsOutreach > 0 && (
            <p className="text-xs text-amber font-medium">Needs attention</p>
          )}
        </Link>
      </div>

      {/* SECTION 2 — Worklist panels */}
      <div className="space-y-4">

        {/* Panel 1 — Recent requests */}
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-sand px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-4 w-4 text-deep-teal shrink-0" />
              <h2 className="font-display text-base font-bold text-navy">Recent requests</h2>
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-navy tabular-nums">
                {ordersData === null ? "—" : totalRequests}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs text-gray-500">Newest patient supply requests</span>
              <a href="/admin/orders" className="text-xs font-medium text-deep-teal hover:underline whitespace-nowrap">View all</a>
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
            {recentRequests.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400">No current records to show.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-sand">
                    <th className={TH}>Urgency</th>
                    <th className={TH}>Patient</th>
                    <th className={TH}>Items</th>
                    <th className={TH}>Arrived · Waiting</th>
                    <th className={`${TH} sr-only`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {recentRequests.map((order) => {
                    const urg = getUrgency(order.created_at);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                            <span className="text-xs text-gray-600">{urg.label}</span>
                          </span>
                        </td>
                        <td className={`${TD} max-w-[140px]`}>
                          <span className="block truncate text-xs font-semibold text-navy">{order.patient}</span>
                        </td>
                        <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{order.items}</td>
                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="text-xs text-gray-500">{formatArrived(order.created_at)}</span>
                          <span className="mx-1 text-gray-300">·</span>
                          <span className="text-xs font-medium" style={{ color: urg.dot }}>{formatWaiting(order.created_at)}</span>
                        </td>
                        <td className={`${TD} whitespace-nowrap`}>
                          <a href="/admin/orders" className="text-xs font-medium text-deep-teal hover:underline">Open review</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel 2 — Needs outreach */}
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-sand px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber shrink-0" />
              <h2 className="font-display text-base font-bold text-navy">Needs outreach</h2>
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-navy tabular-nums">
                {patientsData === null ? "—" : needsOutreach}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs text-gray-500">Patients flagged for outreach or safety check</span>
              <a href="/admin/patients" className="text-xs font-medium text-deep-teal hover:underline whitespace-nowrap">View all</a>
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
            {outreachPatients.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400">No current records to show.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-sand">
                    <th className={TH}>Patient</th>
                    <th className={TH}>MSID</th>
                    <th className={TH}>Flag</th>
                    <th className={`${TH} sr-only`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {outreachPatients.map((p) => (
                    <tr key={p.patient_id} className="hover:bg-gray-50">
                      <td className={`${TD} max-w-[160px]`}>
                        <span className="block truncate text-xs font-semibold text-navy">{p.name}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-xs text-gray-500 tabular-nums`}>{p.portal_id}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        {p.safety_check_required && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 mr-1">
                            Safety check
                          </span>
                        )}
                        {p.needs_outreach && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700">
                            Outreach
                          </span>
                        )}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <a href="/admin/patients" className="text-xs font-medium text-deep-teal hover:underline">View patient</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel 3 — Temp passwords */}
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-sand px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-deep-teal shrink-0" />
              <h2 className="font-display text-base font-bold text-navy">Temp passwords</h2>
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-navy tabular-nums">
                {accountsData === null ? "—" : tempPasswords}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs text-gray-500">Accounts with password not yet changed</span>
              <a href="/admin/portal-accounts" className="text-xs font-medium text-deep-teal hover:underline whitespace-nowrap">View all</a>
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
            {tempAccounts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400">No current records to show.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-sand">
                    <th className={TH}>Name</th>
                    <th className={TH}>MSID</th>
                    <th className={TH}>Account created</th>
                    <th className={`${TH} sr-only`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {tempAccounts.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className={`${TD} max-w-[140px]`}>
                        <span className="block truncate text-xs font-semibold text-navy">{a.name}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-xs text-gray-500 tabular-nums`}>{a.msid}</td>
                      <td className={`${TD} whitespace-nowrap text-xs text-gray-500`}>
                        {new Date(a.createdAt).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <a href="/admin/portal-accounts" className="text-xs font-medium text-deep-teal hover:underline">View account</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 3 — Action required */}
      <div className="bg-white border border-sand rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-navy">Action required</h2>
        <div className="space-y-3">
          {safetyChecks > 0 && (
            <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex flex-col items-start justify-between gap-4 min-h-[72px] sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-base font-medium text-navy">
                  {safetyChecks} patient{safetyChecks !== 1 ? "s" : ""} need{safetyChecks === 1 ? "s" : ""} safety check follow-up
                </p>
                <p className="text-base leading-6 text-gray-700">Safety check flagged in patient register</p>
              </div>
              <Link
                href="/admin/patients"
                className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
              >
                Open patients
              </Link>
            </div>
          )}
          {needsFunding > 0 && (
            <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex flex-col items-start justify-between gap-4 min-h-[72px] sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-base font-medium text-navy">
                  {needsFunding} request{needsFunding !== 1 ? "s" : ""} flagged for funding review
                </p>
                <p className="text-base leading-6 text-gray-700">Requires staff review before processing</p>
              </div>
              <Link
                href="/admin/orders"
                className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
              >
                Open orders
              </Link>
            </div>
          )}
          {tempPasswords > 0 && (
            <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex flex-col items-start justify-between gap-4 min-h-[72px] sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-base font-medium text-navy">
                  {tempPasswords} portal account{tempPasswords !== 1 ? "s" : ""} with temporary password
                </p>
                <p className="text-base leading-6 text-gray-700">Patient has not yet completed portal account setup</p>
              </div>
              <Link
                href="/admin/portal-accounts"
                className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
              >
                Open portal accounts
              </Link>
            </div>
          )}
          {safetyChecks === 0 && needsFunding === 0 && tempPasswords === 0 && (
            <p className="text-sm text-gray-400 py-2">No action items at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
}
