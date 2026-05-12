"use client";

import Link from "next/link";
import { ShoppingBag, Clock, AlertTriangle } from "lucide-react";

const DEMO_TODAY = new Date("2026-05-12");

function isOlderThan48h(submittedDate: string): boolean {
  return DEMO_TODAY.getTime() - new Date(submittedDate).getTime() > 48 * 60 * 60 * 1000;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

interface AwaitingItem {
  id: string;
  patientName: string;
  requestType: string;
  submittedDate: string;
}

interface OverdueItem {
  id: string;
  patientName: string;
  alertType: string;
  daysOverdue: number;
}

const awaitingApproval: AwaitingItem[] = [
  { id: "1", patientName: "Margaret Thornton", requestType: "Mask cushion",      submittedDate: "2026-05-12" },
  { id: "2", patientName: "David Chen",         requestType: "Headgear",          submittedDate: "2026-05-09" },
  { id: "3", patientName: "Susan Park",          requestType: "Complete mask kit", submittedDate: "2026-05-11" },
  { id: "4", patientName: "Robert Williams",     requestType: "Filters",           submittedDate: "2026-05-08" },
  { id: "5", patientName: "Patricia Moore",      requestType: "Mask cushion",      submittedDate: "2026-05-11" },
  { id: "6", patientName: "James Anderson",      requestType: "Headgear",          submittedDate: "2026-05-07" },
  { id: "7", patientName: "Linda Thompson",      requestType: "Mask cushion",      submittedDate: "2026-05-09" },
  { id: "8", patientName: "Kevin Harris",        requestType: "Complete mask kit", submittedDate: "2026-05-10" },
];

const overdueAlerts: OverdueItem[] = [
  { id: "1", patientName: "James Robertson",  alertType: "Safety check",  daysOverdue: 45 },
  { id: "2", patientName: "Helen Murray",      alertType: "Water chamber", daysOverdue: 18 },
  { id: "3", patientName: "Richard Clarke",    alertType: "Safety check",  daysOverdue: 62 },
  { id: "4", patientName: "Dorothy White",     alertType: "Mask check",    daysOverdue: 7  },
  { id: "5", patientName: "Thomas Brown",      alertType: "Safety check",  daysOverdue: 91 },
  { id: "6", patientName: "Catherine Lewis",   alertType: "Water chamber", daysOverdue: 24 },
  { id: "7", patientName: "Frank Walker",      alertType: "Safety check",  daysOverdue: 38 },
  { id: "8", patientName: "Anne Mitchell",     alertType: "Mask check",    daysOverdue: 14 },
];

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

      {/* SECTION 2 — List Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1 — Awaiting Approval */}
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-navy mb-4">Awaiting Approval</h2>
          {awaitingApproval.length === 0 ? (
            <p className="text-base text-gray-700">No pending approvals</p>
          ) : (
            <ul className="divide-y divide-sand">
              {awaitingApproval.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{item.patientName}</p>
                    <p className="text-sm text-charcoal/70">
                      {item.requestType} · {formatDate(item.submittedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOlderThan48h(item.submittedDate) && (
                      <span className="text-xs font-medium text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        &gt;48h
                      </span>
                    )}
                    <a
                      href="/admin/orders?filter=pending"
                      className="text-sm font-medium text-deep-teal hover:underline whitespace-nowrap"
                    >
                      Open review
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Panel 2 — Overdue Alerts */}
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-navy mb-4">Overdue Alerts</h2>
          {overdueAlerts.length === 0 ? (
            <p className="text-base text-gray-700">All clear</p>
          ) : (
            <ul className="divide-y divide-sand">
              {overdueAlerts.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{item.patientName}</p>
                    <p className="text-sm text-charcoal/70">{item.alertType}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-amber whitespace-nowrap">
                      {item.daysOverdue}d overdue
                    </span>
                    <a
                      href="/admin/patients?filter=overdue"
                      className="text-sm font-medium text-deep-teal hover:underline whitespace-nowrap"
                    >
                      View patient
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
