"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Clock, AlertTriangle } from "lucide-react";

const DEMO_TODAY = new Date("2026-05-12T12:00:00");

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterValue = "all" | "urgent" | "normal" | "low";
type SortDir = "asc" | "desc";

const FILTER_LABEL: Record<Exclude<FilterValue, "all">, string> = {
  urgent: "Urgent",
  normal: "Normal",
  low: "Low",
};

// ─── Urgency ──────────────────────────────────────────────────────────────────

type Urgency = { dot: string; label: string };

function getUrgency(iso: string): Urgency {
  const diffH = (DEMO_TODAY.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60);
  if (diffH < 24)     return { dot: "#74C0A2", label: "Low" };
  if (diffH < 7 * 24) return { dot: "#F59E0B", label: "Normal" };
  return                     { dot: "#C0392B", label: "Urgent" };
}

function urgencyWeight(label: string): number {
  if (label === "Urgent") return 2;
  if (label === "Normal") return 1;
  return 0;
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

const portalReorders: WorklistItem[] = [
  { id: "1", patientName: "Nora Baxter",        requestType: "Headgear",          submittedAt: "2026-05-12T10:15:00" },
  { id: "2", patientName: "William Grant",       requestType: "Filters",           submittedAt: "2026-05-11T15:00:00" },
  { id: "3", patientName: "Ethel Sinclair",      requestType: "Mask cushion",      submittedAt: "2026-05-09T11:30:00" },
  { id: "4", patientName: "Harold Pearce",       requestType: "Complete mask kit", submittedAt: "2026-05-07T14:00:00" },
  { id: "5", patientName: "Muriel Boyd",         requestType: "Filters",           submittedAt: "2026-05-05T09:00:00" },
  { id: "6", patientName: "Stanley Griffiths",   requestType: "Mask cushion",      submittedAt: "2026-05-03T16:30:00" },
  { id: "7", patientName: "Gladys Whittaker",    requestType: "Headgear",          submittedAt: "2026-04-29T11:00:00" },
  { id: "8", patientName: "Percy Holt",          requestType: "Mask cushion",      submittedAt: "2026-04-20T15:00:00" },
];

const awaitingApproval: WorklistItem[] = [
  { id: "1", patientName: "Margaret Thornton",   requestType: "Mask cushion",      submittedAt: "2026-05-12T09:30:00" },
  { id: "2", patientName: "David Chen",          requestType: "Headgear",          submittedAt: "2026-05-11T08:00:00" },
  { id: "3", patientName: "Susan Park",          requestType: "Complete mask kit", submittedAt: "2026-05-12T07:45:00" },
  { id: "4", patientName: "Robert Williams",     requestType: "Filters",           submittedAt: "2026-05-05T09:45:00" },
  { id: "5", patientName: "Patricia Moore",      requestType: "Mask cushion",      submittedAt: "2026-05-10T14:30:00" },
  { id: "6", patientName: "James Anderson",      requestType: "Headgear",          submittedAt: "2026-05-04T11:00:00" },
  { id: "7", patientName: "Linda Thompson",      requestType: "Mask cushion",      submittedAt: "2026-05-08T16:45:00" },
  { id: "8", patientName: "Kevin Harris",        requestType: "Complete mask kit", submittedAt: "2026-04-25T10:00:00" },
];

const overdueAlerts: OverdueItem[] = [
  { id: "1", patientName: "James Robertson",    alertType: "Safety check",        overdueSince: "2026-03-28T10:00:00" },
  { id: "2", patientName: "Helen Murray",       alertType: "Water chamber",       overdueSince: "2026-04-24T09:00:00" },
  { id: "3", patientName: "Richard Clarke",     alertType: "Safety check",        overdueSince: "2026-03-11T14:00:00" },
  { id: "4", patientName: "Dorothy White",      alertType: "Mask check",          overdueSince: "2026-05-05T11:00:00" },
  { id: "5", patientName: "Thomas Brown",       alertType: "Safety check",        overdueSince: "2026-02-10T09:00:00" },
  { id: "6", patientName: "Catherine Lewis",    alertType: "Water chamber",       overdueSince: "2026-04-18T15:00:00" },
  { id: "7", patientName: "Frank Walker",       alertType: "Safety check",        overdueSince: "2026-04-04T10:00:00" },
  { id: "8", patientName: "Anne Mitchell",      alertType: "Mask check",          overdueSince: "2026-05-09T08:30:00" },
];

// ─── Sort helpers ─────────────────────────────────────────────────────────────

function sortWorklist(items: WorklistItem[], key: string, dir: SortDir): WorklistItem[] {
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (key === "urgency") {
      cmp = urgencyWeight(getUrgency(a.submittedAt).label) - urgencyWeight(getUrgency(b.submittedAt).label);
    } else if (key === "patient") {
      cmp = a.patientName.localeCompare(b.patientName);
    } else if (key === "arrived") {
      cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function sortOverdue(items: OverdueItem[], key: string, dir: SortDir): OverdueItem[] {
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (key === "urgency") {
      cmp = urgencyWeight(getUrgency(a.overdueSince).label) - urgencyWeight(getUrgency(b.overdueSince).label);
    } else if (key === "patient") {
      cmp = a.patientName.localeCompare(b.patientName);
    } else if (key === "since") {
      cmp = new Date(a.overdueSince).getTime() - new Date(b.overdueSince).getTime();
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Legend (Urgent first) ────────────────────────────────────────────────────

const LEGEND = [
  { dot: "#C0392B", label: "Urgent" },
  { dot: "#F59E0B", label: "Normal" },
  { dot: "#74C0A2", label: "Low" },
] as const;

// ─── Shared cell class fragments ──────────────────────────────────────────────

const TH = "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-left";
const TD = "px-3 py-2.5";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  // Filter state — one per panel
  const [reordersFilter, setReordersFilter] = useState<FilterValue>("all");
  const [approvalFilter, setApprovalFilter] = useState<FilterValue>("all");
  const [alertsFilter,   setAlertsFilter]   = useState<FilterValue>("all");

  // Sort state — key + direction per panel, default urgency desc (Urgent first)
  const [reordersSortKey, setReordersSortKey] = useState("urgency");
  const [reordersSortDir, setReordersSortDir] = useState<SortDir>("desc");
  const [approvalSortKey, setApprovalSortKey] = useState("urgency");
  const [approvalSortDir, setApprovalSortDir] = useState<SortDir>("desc");
  const [alertsSortKey,   setAlertsSortKey]   = useState("urgency");
  const [alertsSortDir,   setAlertsSortDir]   = useState<SortDir>("desc");

  // Sort toggle helper
  function toggleSort(
    key: string,
    curKey: string, setKey: (k: string) => void,
    curDir: SortDir, setDir: (d: SortDir) => void,
  ) {
    if (curKey === key) {
      setDir(curDir === "asc" ? "desc" : "asc");
    } else {
      setKey(key);
      setDir("desc");
    }
  }

  // Derived: filter → sort
  const filteredReorders = sortWorklist(
    reordersFilter === "all" ? portalReorders  : portalReorders.filter(i => getUrgency(i.submittedAt).label === FILTER_LABEL[reordersFilter]),
    reordersSortKey, reordersSortDir,
  );
  const filteredApproval = sortWorklist(
    approvalFilter === "all" ? awaitingApproval : awaitingApproval.filter(i => getUrgency(i.submittedAt).label === FILTER_LABEL[approvalFilter]),
    approvalSortKey, approvalSortDir,
  );
  const filteredAlerts = sortOverdue(
    alertsFilter === "all" ? overdueAlerts : overdueAlerts.filter(i => getUrgency(i.overdueSince).label === FILTER_LABEL[alertsFilter]),
    alertsSortKey, alertsSortDir,
  );

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
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Portal Reorders</h3>
            <ShoppingBag className="h-4 w-4 text-deep-teal" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">47</p>
          <p className="text-xs text-gray-700">Requests this month</p>
          <p className="text-xs text-deep-teal font-medium">↑ 12% vs last month</p>
        </Link>

        <Link
          href="/admin/orders?filter=pending"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Awaiting Approval</h3>
            <Clock className="h-4 w-4 text-amber" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">8</p>
          <p className="text-xs text-gray-700">Entitlement requests</p>
          <p className="text-xs text-amber font-medium">Action required</p>
        </Link>

        <Link
          href="/admin/patients?filter=overdue"
          className="block bg-white border border-sand rounded-xl py-3 px-4 space-y-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">Overdue Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-amber" />
          </div>
          <p className="text-2xl font-bold text-navy tabular-nums">142</p>
          <p className="text-xs text-gray-700">Safety checks + water chambers</p>
          <p className="text-xs text-amber font-medium">Needs outreach</p>
        </Link>
      </div>

      {/* SECTION 2 — Worklist panels */}
      <div className="space-y-4">

        {/* Panel 1 — Portal Reorders */}
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-sand">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-4 w-4 text-deep-teal shrink-0" />
                <h2 className="font-display text-base font-bold text-navy">Portal Reorders</h2>
                <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-navy tabular-nums">
                  {reordersFilter === "all" ? portalReorders.length : `${filteredReorders.length} of ${portalReorders.length}`}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-xs text-gray-500">Supply requests from patients</span>
                <a href="/admin/orders" className="text-xs font-medium text-deep-teal hover:underline whitespace-nowrap">View all</a>
              </div>
            </div>
            <div className="flex items-center gap-1 px-4 pb-2.5">
              {LEGEND.map(({ dot, label }) => {
                const fv = label.toLowerCase() as FilterValue;
                const active = reordersFilter === fv;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setReordersFilter(active ? "all" : fv)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-600 transition-colors"
                    style={active
                      ? { backgroundColor: `oklch(from ${dot} l c h / 0.12)`, border: `1px solid ${dot}` }
                      : { border: "1px solid transparent" }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-sand">
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("urgency", reordersSortKey, setReordersSortKey, reordersSortDir, setReordersSortDir)}
                  >
                    <span className={reordersSortKey === "urgency" ? "text-deep-teal" : ""}>Urgency</span>
                    {" "}
                    <span className={reordersSortKey === "urgency" ? "text-deep-teal" : "text-gray-300"}>
                      {reordersSortKey === "urgency" ? (reordersSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("patient", reordersSortKey, setReordersSortKey, reordersSortDir, setReordersSortDir)}
                  >
                    <span className={reordersSortKey === "patient" ? "text-deep-teal" : ""}>Patient</span>
                    {" "}
                    <span className={reordersSortKey === "patient" ? "text-deep-teal" : "text-gray-300"}>
                      {reordersSortKey === "patient" ? (reordersSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th className={TH}>Item</th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("arrived", reordersSortKey, setReordersSortKey, reordersSortDir, setReordersSortDir)}
                  >
                    <span className={reordersSortKey === "arrived" ? "text-deep-teal" : ""}>Arrived · Waiting</span>
                    {" "}
                    <span className={reordersSortKey === "arrived" ? "text-deep-teal" : "text-gray-300"}>
                      {reordersSortKey === "arrived" ? (reordersSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th className={`${TH} sr-only`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {filteredReorders.map((item) => {
                  const urg = getUrgency(item.submittedAt);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                          <span className="text-xs text-gray-600">{urg.label}</span>
                        </span>
                      </td>
                      <td className={`${TD} max-w-[140px]`}>
                        <span className="block truncate text-xs font-semibold text-navy">{item.patientName}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{item.requestType}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="text-xs text-gray-500">{formatArrived(item.submittedAt)}</span>
                        <span className="mx-1 text-gray-300">·</span>
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
        </div>

        {/* Panel 2 — Awaiting Approval */}
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-sand">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-amber shrink-0" />
                <h2 className="font-display text-base font-bold text-navy">Awaiting Approval</h2>
                <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-navy tabular-nums">
                  {approvalFilter === "all" ? awaitingApproval.length : `${filteredApproval.length} of ${awaitingApproval.length}`}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-xs text-gray-500">Entitlement requests pending staff review</span>
                <a href="/admin/orders?filter=pending" className="text-xs font-medium text-deep-teal hover:underline whitespace-nowrap">View all</a>
              </div>
            </div>
            <div className="flex items-center gap-1 px-4 pb-2.5">
              {LEGEND.map(({ dot, label }) => {
                const fv = label.toLowerCase() as FilterValue;
                const active = approvalFilter === fv;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setApprovalFilter(active ? "all" : fv)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-600 transition-colors"
                    style={active
                      ? { backgroundColor: `oklch(from ${dot} l c h / 0.12)`, border: `1px solid ${dot}` }
                      : { border: "1px solid transparent" }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-sand">
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("urgency", approvalSortKey, setApprovalSortKey, approvalSortDir, setApprovalSortDir)}
                  >
                    <span className={approvalSortKey === "urgency" ? "text-deep-teal" : ""}>Urgency</span>
                    {" "}
                    <span className={approvalSortKey === "urgency" ? "text-deep-teal" : "text-gray-300"}>
                      {approvalSortKey === "urgency" ? (approvalSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("patient", approvalSortKey, setApprovalSortKey, approvalSortDir, setApprovalSortDir)}
                  >
                    <span className={approvalSortKey === "patient" ? "text-deep-teal" : ""}>Patient</span>
                    {" "}
                    <span className={approvalSortKey === "patient" ? "text-deep-teal" : "text-gray-300"}>
                      {approvalSortKey === "patient" ? (approvalSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th className={TH}>Request</th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("arrived", approvalSortKey, setApprovalSortKey, approvalSortDir, setApprovalSortDir)}
                  >
                    <span className={approvalSortKey === "arrived" ? "text-deep-teal" : ""}>Arrived · Waiting</span>
                    {" "}
                    <span className={approvalSortKey === "arrived" ? "text-deep-teal" : "text-gray-300"}>
                      {approvalSortKey === "arrived" ? (approvalSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th className={`${TH} sr-only`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {filteredApproval.map((item) => {
                  const urg = getUrgency(item.submittedAt);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                          <span className="text-xs text-gray-600">{urg.label}</span>
                        </span>
                      </td>
                      <td className={`${TD} max-w-[140px]`}>
                        <span className="block truncate text-xs font-semibold text-navy">{item.patientName}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{item.requestType}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="text-xs text-gray-500">{formatArrived(item.submittedAt)}</span>
                        <span className="mx-1 text-gray-300">·</span>
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
        </div>

        {/* Panel 3 — Overdue Alerts */}
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-sand">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber shrink-0" />
                <h2 className="font-display text-base font-bold text-navy">Overdue Alerts</h2>
                <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-navy tabular-nums">
                  {alertsFilter === "all" ? overdueAlerts.length : `${filteredAlerts.length} of ${overdueAlerts.length}`}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-xs text-gray-500">Safety checks and maintenance past due</span>
                <a href="/admin/patients?filter=overdue" className="text-xs font-medium text-deep-teal hover:underline whitespace-nowrap">View all</a>
              </div>
            </div>
            <div className="flex items-center gap-1 px-4 pb-2.5">
              {LEGEND.map(({ dot, label }) => {
                const fv = label.toLowerCase() as FilterValue;
                const active = alertsFilter === fv;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAlertsFilter(active ? "all" : fv)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-600 transition-colors"
                    style={active
                      ? { backgroundColor: `oklch(from ${dot} l c h / 0.12)`, border: `1px solid ${dot}` }
                      : { border: "1px solid transparent" }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-auto max-h-[320px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-sand">
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("urgency", alertsSortKey, setAlertsSortKey, alertsSortDir, setAlertsSortDir)}
                  >
                    <span className={alertsSortKey === "urgency" ? "text-deep-teal" : ""}>Urgency</span>
                    {" "}
                    <span className={alertsSortKey === "urgency" ? "text-deep-teal" : "text-gray-300"}>
                      {alertsSortKey === "urgency" ? (alertsSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("patient", alertsSortKey, setAlertsSortKey, alertsSortDir, setAlertsSortDir)}
                  >
                    <span className={alertsSortKey === "patient" ? "text-deep-teal" : ""}>Patient</span>
                    {" "}
                    <span className={alertsSortKey === "patient" ? "text-deep-teal" : "text-gray-300"}>
                      {alertsSortKey === "patient" ? (alertsSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th className={TH}>Type</th>
                  <th
                    className={`${TH} cursor-pointer select-none`}
                    onClick={() => toggleSort("since", alertsSortKey, setAlertsSortKey, alertsSortDir, setAlertsSortDir)}
                  >
                    <span className={alertsSortKey === "since" ? "text-deep-teal" : ""}>Overdue since · Days</span>
                    {" "}
                    <span className={alertsSortKey === "since" ? "text-deep-teal" : "text-gray-300"}>
                      {alertsSortKey === "since" ? (alertsSortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </th>
                  <th className={`${TH} sr-only`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {filteredAlerts.map((item) => {
                  const urg = getUrgency(item.overdueSince);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: urg.dot }} />
                          <span className="text-xs text-gray-600">{urg.label}</span>
                        </span>
                      </td>
                      <td className={`${TD} max-w-[140px]`}>
                        <span className="block truncate text-xs font-semibold text-navy">{item.patientName}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-xs text-gray-600`}>{item.alertType}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="text-xs text-gray-500">{formatArrived(item.overdueSince)}</span>
                        <span className="mx-1 text-gray-300">·</span>
                        <span className="text-xs font-medium" style={{ color: urg.dot }}>{formatDaysOverdue(item.overdueSince)}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <a href="/admin/patients" className="text-xs font-medium text-deep-teal hover:underline">View patient</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
