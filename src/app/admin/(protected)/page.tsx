"use client";

import Link from "next/link";
import { ShoppingBag, Clock, AlertTriangle } from "lucide-react";

const DEMO_TODAY = new Date("2026-05-12T12:00:00");

// ─── Urgency ──────────────────────────────────────────────────────────────────

type Urgency = { dot: string; label: string };

function getWaitingUrgency(iso: string): Urgency {
  const diffH = (DEMO_TODAY.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60);
  if (diffH < 24)       return { dot: "#74C0A2", label: "Fresh" };
  if (diffH < 7 * 24)   return { dot: "#F59E0B", label: "Aging" };
  if (diffH < 14 * 24)  return { dot: "#0B5C6C", label: "Urgent" };
  return                       { dot: "#0B2A3C", label: "Critical" };
}

function getOverdueUrgency(iso: string): Urgency {
  const diffD = (DEMO_TODAY.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  if (diffD <= 7)   return { dot: "#F59E0B", label: "Recently overdue" };
  if (diffD <= 14)  return { dot: "#0B5C6C", label: "Aging overdue" };
  return                  { dot: "#0B2A3C", label: "Critical overdue" };
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
  const diffMs = DEMO_TODAY.getTime() - new Date(iso).getTime();
  const totalH = Math.floor(diffMs / (1000 * 60 * 60));
  const d = Math.floor(totalH / 24);
  const h = totalH % 24;
  return d === 0 ? `${h}h` : `${d}d ${String(h).padStart(2, "0")}h`;
}

function formatDaysOverdue(iso: string): string {
  const d = Math.floor((DEMO_TODAY.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  return `${d}d`;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface WorklistItem {
  id: string;
  patientName: string;
  requestType: string;
  submittedAt: string;
}

interface OverdueItem {
  id: string;
  patientName: string;
  alertType: string;
  overdueSince: string;
}

const awaitingApproval: WorklistItem[] = [
  { id: "1", patientName: "Margaret Thornton", requestType: "Mask cushion",      submittedAt: "2026-05-12T09:30:00" },
  { id: "2", patientName: "David Chen",         requestType: "Headgear",          submittedAt: "2026-05-11T08:00:00" },
  { id: "3", patientName: "Susan Park",          requestType: "Complete mask kit", submittedAt: "2026-05-12T07:45:00" },
  { id: "4", patientName: "Robert Williams",     requestType: "Filters",           submittedAt: "2026-05-05T09:45:00" },
  { id: "5", patientName: "Patricia Moore",      requestType: "Mask cushion",      submittedAt: "2026-05-10T14:30:00" },
  { id: "6", patientName: "James Anderson",      requestType: "Headgear",          submittedAt: "2026-05-04T11:00:00" },
  { id: "7", patientName: "Linda Thompson",      requestType: "Mask cushion",      submittedAt: "2026-05-08T16:45:00" },
  { id: "8", patientName: "Kevin Harris",        requestType: "Complete mask kit", submittedAt: "2026-04-25T10:00:00" },
];

const portalReorders: WorklistItem[] = [
  { id: "1", patientName: "Nora Baxter",       requestType: "Headgear",          submittedAt: "2026-05-12T10:15:00" },
  { id: "2", patientName: "William Grant",      requestType: "Filters",           submittedAt: "2026-05-11T15:00:00" },
  { id: "3", patientName: "Ethel Sinclair",     requestType: "Mask cushion",      submittedAt: "2026-05-09T11:30:00" },
  { id: "4", patientName: "Harold Pearce",      requestType: "Complete mask kit", submittedAt: "2026-05-07T14:00:00" },
  { id: "5", patientName: "Muriel Boyd",        requestType: "Filters",           submittedAt: "2026-05-05T09:00:00" },
  { id: "6", patientName: "Stanley Griffiths",  requestType: "Mask cushion",      submittedAt: "2026-05-03T16:30:00" },
  { id: "7", patientName: "Gladys Whittaker",   requestType: "Headgear",          submittedAt: "2026-04-29T11:00:00" },
  { id: "8", patientName: "Percy Holt",         requestType: "Mask cushion",      submittedAt: "2026-04-20T15:00:00" },
];

const overdueAlerts: OverdueItem[] = [
  { id: "1", patientName: "James Robertson",  alertType: "Safety check",  overdueSince: "2026-03-28T10:00:00" },
  { id: "2", patientName: "Helen Murray",      alertType: "Water chamber", overdueSince: "2026-04-24T09:00:00" },
  { id: "3", patientName: "Richard Clarke",    alertType: "Safety check",  overdueSince: "2026-03-11T14:00:00" },
  { id: "4", patientName: "Dorothy White",     alertType: "Mask check",    overdueSince: "2026-05-05T11:00:00" },
  { id: "5", patientName: "Thomas Brown",      alertType: "Safety check",  overdueSince: "2026-02-10T09:00:00" },
  { id: "6", patientName: "Catherine Lewis",   alertType: "Water chamber", overdueSince: "2026-04-18T15:00:00" },
  { id: "7", patientName: "Frank Walker",      alertType: "Safety check",  overdueSince: "2026-04-04T10:00:00" },
  { id: "8", patientName: "Anne Mitchell",     alertType: "Mask check",    overdueSince: "2026-05-09T08:30:00" },
];

// ─── Legend data ──────────────────────────────────────────────────────────────

const WAITING_LEGEND = [
  { dot: "#74C0A2", label: "Fresh" },
  { dot: "#F59E0B", label: "Aging" },
  { dot: "#0B5C6C", label: "Urgent" },
  { dot: "#0B2A3C", label: "Critical" },
] as const;

const OVERDUE_LEGEND = [
  { dot: "#F59E0B", label: "Recently overdue" },
  { dot: "#0B5C6C", label: "Aging overdue" },
  { dot: "#0B2A3C", label: "Critical overdue" },
] as const;

// ─── Shared cell class fragments ──────────────────────────────────────────────

const TH = "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-left";
const TD = "px-3 py-2.5";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
          Admin overview
        </p>
        <h1 className="font-display text-3xl font-bold text-navy">
          Daily operations
        </h1>
        <p className="text-base leading-6 text-gray-700">
          Operational snapshot for patient review, supply requests, and staff follow-up.
        </p>
      </div>

      {/* SECTION 1 — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/orders"
          className="block bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Portal Reorders</h3>
            <ShoppingBag className="h-6 w-6 text-deep-teal" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">47</p>
          <p className="text-base text-gray-700">Requests this month</p>
          <p className="text-base text-deep-teal font-medium">↑ 12% vs last month</p>
        </Link>

        <Link
          href="/admin/orders?filter=pending"
          className="block bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Awaiting Approval</h3>
            <Clock className="h-6 w-6 text-amber" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">8</p>
          <p className="text-base text-gray-700">Entitlement requests</p>
          <p className="text-base text-amber font-medium">Action required</p>
        </Link>

        <Link
          href="/admin/patients?filter=overdue"
          className="block bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Overdue Alerts</h3>
            <AlertTriangle className="h-6 w-6 text-amber" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">142</p>
          <p className="text-base text-gray-700">Safety checks + water chambers</p>
          <p className="text-base text-amber font-medium">Needs outreach</p>
        </Link>
      </div>

      {/* SECTION 2 — Worklist panels */}
      <div className="space-y-3">

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-gray-600">
          <span className="flex items-center gap-3">
            <span className="font-semibold text-gray-700 whitespace-nowrap">Approval &amp; Reorders</span>
            {WAITING_LEGEND.map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1 whitespace-nowrap">
                <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                {label}
              </span>
            ))}
          </span>
          <span className="flex items-center gap-3">
            <span className="font-semibold text-gray-700 whitespace-nowrap">Overdue</span>
            {OVERDUE_LEGEND.map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1 whitespace-nowrap">
                <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                {label}
              </span>
            ))}
          </span>
        </div>

        {/* 3-panel grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Panel 1 — Awaiting Approval */}
          <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sand">
              <h2 className="font-display text-base font-bold text-navy">Awaiting Approval</h2>
              <a href="/admin/orders?filter=pending" className="text-xs text-deep-teal hover:underline">View all</a>
            </div>
            {awaitingApproval.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No pending approvals</p>
            ) : (
              <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-sand">
                      <th className={TH}>Urgency</th>
                      <th className={TH}>Patient</th>
                      <th className={TH}>Request</th>
                      <th className={TH}>Arrived</th>
                      <th className={TH}>Waiting</th>
                      <th className={`${TH} sr-only`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {awaitingApproval.map((item) => {
                      const urg = getWaitingUrgency(item.submittedAt);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                              <span className="text-xs text-gray-600">{urg.label}</span>
                            </span>
                          </td>
                          <td className={`${TD} max-w-[120px] overflow-hidden`}>
                            <span className="block truncate text-xs font-semibold text-navy">{item.patientName}</span>
                          </td>
                          <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{item.requestType}</td>
                          <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{formatArrived(item.submittedAt)}</td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="text-xs font-medium" style={{ color: urg.dot }}>{formatWaiting(item.submittedAt)}</span>
                          </td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <a href="/admin/orders?filter=pending" className="text-xs font-medium text-deep-teal hover:underline">Open review</a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel 2 — Portal Reorders */}
          <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sand">
              <h2 className="font-display text-base font-bold text-navy">Portal Reorders</h2>
              <a href="/admin/orders" className="text-xs text-deep-teal hover:underline">View all</a>
            </div>
            {portalReorders.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No pending reorders</p>
            ) : (
              <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-sand">
                      <th className={TH}>Urgency</th>
                      <th className={TH}>Patient</th>
                      <th className={TH}>Request</th>
                      <th className={TH}>Arrived</th>
                      <th className={TH}>Waiting</th>
                      <th className={`${TH} sr-only`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {portalReorders.map((item) => {
                      const urg = getWaitingUrgency(item.submittedAt);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                              <span className="text-xs text-gray-600">{urg.label}</span>
                            </span>
                          </td>
                          <td className={`${TD} max-w-[120px] overflow-hidden`}>
                            <span className="block truncate text-xs font-semibold text-navy">{item.patientName}</span>
                          </td>
                          <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{item.requestType}</td>
                          <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{formatArrived(item.submittedAt)}</td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="text-xs font-medium" style={{ color: urg.dot }}>{formatWaiting(item.submittedAt)}</span>
                          </td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <a href="/admin/orders" className="text-xs font-medium text-deep-teal hover:underline">Open review</a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel 3 — Overdue Alerts */}
          <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sand">
              <h2 className="font-display text-base font-bold text-navy">Overdue Alerts</h2>
              <a href="/admin/patients?filter=overdue" className="text-xs text-deep-teal hover:underline">View all</a>
            </div>
            {overdueAlerts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">All clear</p>
            ) : (
              <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-sand">
                      <th className={TH}>Urgency</th>
                      <th className={TH}>Patient</th>
                      <th className={TH}>Alert type</th>
                      <th className={TH}>Overdue since</th>
                      <th className={TH}>Overdue</th>
                      <th className={`${TH} sr-only`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {overdueAlerts.map((item) => {
                      const urg = getOverdueUrgency(item.overdueSince);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                              <span className="text-xs text-gray-600">{urg.label}</span>
                            </span>
                          </td>
                          <td className={`${TD} max-w-[120px] overflow-hidden`}>
                            <span className="block truncate text-xs font-semibold text-navy">{item.patientName}</span>
                          </td>
                          <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{item.alertType}</td>
                          <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{formatArrived(item.overdueSince)}</td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="text-xs font-medium" style={{ color: urg.dot }}>{formatDaysOverdue(item.overdueSince)}</span>
                          </td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <a href="/admin/patients?filter=overdue" className="text-xs font-medium text-deep-teal hover:underline">View patient</a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECTION 3 — Alerts Panel */}
      <div className="bg-white border border-sand rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-navy">
          Action required
        </h2>

        <div className="space-y-3">
          <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex flex-col items-start justify-between gap-4 min-h-[72px] sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-base font-medium text-navy">
                142 patients have overdue safety checks
              </p>
              <p className="text-base leading-6 text-gray-700">
                Last check &gt;12 months ago
              </p>
            </div>
            <Link
              href="/admin/outreach"
              className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Open outreach
            </Link>
          </div>

          <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex flex-col items-start justify-between gap-4 min-h-[72px] sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-base font-medium text-navy">
                89 patients eligible but not ordered in 30+ days
              </p>
              <p className="text-base leading-6 text-gray-700">
                Eligible for supplies, haven't reordered
              </p>
            </div>
            <Link
              href="/admin/segments"
              className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Open segments
            </Link>
          </div>

          <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex flex-col items-start justify-between gap-4 min-h-[72px] sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-base font-medium text-navy">
                23 patients due for mask check
              </p>
              <p className="text-base leading-6 text-gray-700">
                Mask fitted &gt;6 months ago
              </p>
            </div>
            <Link
              href="/admin/outreach"
              className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Open outreach
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 4 — Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <p className="text-base text-gray-700 mb-2">Total Active Patients</p>
          <p className="text-4xl font-bold text-navy">4,847</p>
        </div>

        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <p className="text-base text-gray-700 mb-2">Portal Adoption</p>
          <p className="text-4xl font-bold text-navy">52%</p>
          <p className="text-base text-gray-700 mt-1">2,520 patients</p>
        </div>

        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <p className="text-base text-gray-700 mb-2">Avg Response Time</p>
          <p className="text-4xl font-bold text-navy">1.2 days</p>
        </div>
      </div>
    </div>
  );
}
