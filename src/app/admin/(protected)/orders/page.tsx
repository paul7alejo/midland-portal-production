"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { PatientDrawer } from "@/components/admin/PatientDrawer";
import { cn } from "@/lib/utils";

type OrderStatus   = "New" | "Reviewing" | "Approved" | "Sent" | "Delivered" | "Declined" | "Needs Follow-Up";
type StatusTab     = OrderStatus | "Needs Funding Review" | "all";
type OrderType     = "ENTITLEMENT" | "PRIVATE" | "MIXED";
type DateRange     = "week" | "month" | "older" | "custom";
type OrderSortOpt  = "newest" | "oldest" | "name_az" | "status";
type RequestCategory = "Mask" | "Headgear" | "Filters" | "Tubing" | "Cleaning supplies" | "Support request";
type ReportWindow    = "7d" | "30d" | "90d" | "all";
type ReportSource    = "patient_portal" | "support_request" | "admin_created" | "other";
type ReviewTab       = "request" | "funding" | "patient" | "history";
type KpiActiveFilter = "requestsThisMonth" | "newRequests" | "needsFundingReview" | "deliveredThisMonth" | "declinedThisMonth";

interface Order {
  id: string;
  requestId: string;
  referenceNumber?: string;
  patient: string;
  msid: string;
  date: string;
  updatedDate: string;
  items: string;
  itemDescription?: string;
  category: RequestCategory;
  type: OrderType;
  status: OrderStatus;
  source?: string;
  needsFundingReview?: boolean;
  reviewReason?: string;
  estimatedItemAmount: number | null;
  estimatedFundedAmount: number | null;
  estimatedPatientCopay: number | null;
  estimatedRemainingAfter: number | null;
  estimatedCost?: number | null;
  estimatedFunded?: number | null;
  estimatedCopay?: number | null;
  estimatedRemaining?: number | null;
  contactPreference?: string | null;
  adminNote?: string;
  isDemo?: boolean;
  localOnly?: boolean;
  portalAccountStatus?: "linked" | "no_account" | "unknown";
}

interface TestRequestForm {
  msid: string;
  patient: string;
  category: RequestCategory;
  item: string;
  amount: string;
  note: string;
}

function isAdminRow(order: Order): boolean {
  return Boolean(order.isDemo || order.localOnly || order.source === "admin_created");
}

function isReportableOrder(order: Order): boolean {
  return !order.isDemo && !order.localOnly;
}

const DEFAULT_ANNUAL_ALLOWANCE = 250;

const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDateForSort(s: string): number {
  const [d, m, y] = s.split(" ");
  return parseInt(y) * 10000 + (MONTH_NUM[m] ?? 0) * 100 + parseInt(d);
}

function parseToDate(s: string): Date | null {
  const [d, m, y] = s.split(" ");
  const mo = MONTH_NUM[m];
  if (!mo) return null;
  return new Date(parseInt(y), mo - 1, parseInt(d));
}

function parseInputDate(s: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatChartDate(date: Date, includeYear = true): string {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}${includeYear ? ` ${date.getFullYear()}` : ""}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEstimate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return formatCurrency(value);
}


function SourceBadge({ source }: { source: string | undefined }) {
  if (!source) return <span className="text-gray-400 text-xs">—</span>;
  if (source === "patient_portal") {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 whitespace-nowrap">
        Portal
      </span>
    );
  }
  if (source === "support_request") {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0B5C6C]/10 text-[#0B5C6C] border border-[#0B5C6C]/20 whitespace-nowrap">
        Support
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
      Admin
    </span>
  );
}

function formatToday(): string {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  }).format(new Date());
}

function calculateEstimate(itemAmount: number, remainingAllowance = DEFAULT_ANNUAL_ALLOWANCE) {
  const fundedAmount = Math.min(itemAmount, remainingAllowance);
  return {
    estimatedFundedAmount: fundedAmount,
    estimatedPatientCopay: Math.max(0, itemAmount - fundedAmount),
    estimatedRemainingAfter: Math.max(0, remainingAllowance - fundedAmount),
  };
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadReportCsv(params: {
  windowLabel: string;
  generatedAt: string;
  includedStatuses: string;
  includedSources: string;
  stats: ReportStats;
}) {
  const { windowLabel, generatedAt, includedStatuses, includedSources, stats } = params;
  const rows: [string, string, string | number, string][] = [
    ["Report",  "Title",            "Midland Sleep Request Report", "Operational request summary"],
    ["Report",  "Generated At",     generatedAt,                     "Generated by admin portal"],
    ["Report",  "Reporting Window", windowLabel,                     "Selected drawer reporting window"],
    ["Report",  "Included Statuses",includedStatuses,                "Statuses selected in drawer"],
    ["Report",  "Included Sources", includedSources,                 "Sources selected in drawer"],
    ["Summary", "Total Requests",   stats.total,                     "Matching requests in selected report scope"],
    ["Status",  "New",              stats.byStatus["New"],           "Requests not yet reviewed"],
    ["Status",  "Reviewing",        stats.byStatus["Reviewing"],     "Requests currently under review"],
    ["Status",  "Approved",         stats.byStatus["Approved"],      "Approved but not yet sent"],
    ["Status",  "Sent",             stats.byStatus["Sent"],          "Dispatched/sent requests"],
    ["Status",  "Delivered",        stats.byStatus["Delivered"],     "Completed delivered requests"],
    ["Status",  "Declined",         stats.byStatus["Declined"],      "Requests not approved"],
    ["Status",  "Needs Follow-Up",  stats.byStatus["Needs Follow-Up"], "Requests requiring staff follow-up"],
    ["Funding", "Needs Funding Review", stats.needsFundingReview,    "Requests flagged for funding review"],
    ["Source",  "Portal",           stats.portal,                    "Patient portal requests"],
    ["Source",  "Support",          stats.support,                   "Support-created requests"],
    ["Source",  "Admin created",    stats.adminCreated,              "Admin-created requests"],
    ["Source",  "Other",            stats.otherSource,               "Other/unknown source"],
  ];
  const csv = [
    "Section,Metric,Value,Description",
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `request-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(rows: Order[], notifStates: Map<string, { ok: boolean } | null>) {
  const headers = [
    "Reference", "Patient", "MSID", "Items", "Status", "Source", "Date",
    "Needs Funding Review", "Notification Queued",
  ];
  const lines = rows.map((o) =>
    [
      o.requestId,
      o.patient,
      o.msid,
      o.items || o.itemDescription || "",
      o.status,
      o.source ?? "",
      o.date,
      o.needsFundingReview ? "Yes" : "No",
      notifStates.get(o.id)?.ok === true ? "Yes" : "No",
    ]
      .map(csvEscape)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadReportRequestListCsv(rows: Order[]) {
  const headers = [
    "Reference",
    "Patient",
    "Midland Sleep ID",
    "Items",
    "Status",
    "Source",
    "Created Date",
    "Last Updated",
    "Needs Funding Review",
    "Est. Item Amount",
    "Est. Funded Amount",
    "Est. Co-pay",
  ];
  const lines = rows.map((o) => [
    o.requestId,
    o.patient,
    o.msid,
    o.items || o.itemDescription || "",
    o.status,
    getSourceLabel(o.source),
    o.date,
    o.updatedDate && o.updatedDate !== o.date ? o.updatedDate : "",
    o.needsFundingReview ? "Yes" : "No",
    o.estimatedItemAmount !== null ? formatEstimate(o.estimatedItemAmount) : "",
    o.estimatedFundedAmount !== null ? formatEstimate(o.estimatedFundedAmount) : "",
    o.estimatedPatientCopay !== null && o.estimatedPatientCopay > 0 ? formatEstimate(o.estimatedPatientCopay) : "",
  ].map(csvEscape).join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `request-list-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeStatus(value?: string): OrderStatus {
  if (
    value === "Approved" || value === "Reviewing" || value === "Sent" ||
    value === "New" || value === "Declined" || value === "Delivered" ||
    value === "Needs Follow-Up"
  ) {
    return value;
  }
  if (value === "pending_review" || value === "new") return "New";
  if (value === "cancelled" || value === "declined") return "Declined";
  if (value === "reviewing") return "Reviewing";
  if (value === "approved") return "Approved";
  if (value === "sent") return "Sent";
  if (value === "delivered") return "Delivered";
  if (value === "needs_followup") return "Needs Follow-Up";
  if (value === "Dispatched" || value === "Completed") return "Sent";
  return "New";
}

function normalizeOrder(order: Partial<Order> & Pick<Order, "id" | "requestId" | "patient" | "msid" | "date" | "items" | "type"> & { status?: string }): Order {
  // Keep null for estimate fields from real API orders; only calculate for demo rows
  const apiAmount = order.estimatedCost ?? order.estimatedItemAmount;
  const isRealApiRow = !order.isDemo && !order.localOnly;
  const displayAmount = isRealApiRow ? (apiAmount ?? null) : (apiAmount ?? 0);
  const estimate = calculateEstimate(typeof displayAmount === "number" ? displayAmount : 0);
  return {
    ...order,
    requestId: order.referenceNumber ?? order.requestId,
    updatedDate: order.updatedDate ?? order.date,
    category: order.category ?? "Support request",
    estimatedItemAmount: displayAmount,
    estimatedFundedAmount: isRealApiRow
      ? (order.estimatedFunded ?? order.estimatedFundedAmount ?? null)
      : (order.estimatedFundedAmount ?? estimate.estimatedFundedAmount),
    estimatedPatientCopay: isRealApiRow
      ? (order.estimatedCopay ?? order.estimatedPatientCopay ?? null)
      : (order.estimatedPatientCopay ?? estimate.estimatedPatientCopay),
    estimatedRemainingAfter: isRealApiRow
      ? (order.estimatedRemaining ?? order.estimatedRemainingAfter ?? null)
      : (order.estimatedRemainingAfter ?? estimate.estimatedRemainingAfter),
    status: normalizeStatus(order.status),
  };
}

const STATUS_OPTIONS: OrderStatus[] = ["New", "Reviewing", "Approved", "Sent", "Delivered", "Declined", "Needs Follow-Up"];
const TYPE_OPTIONS:   OrderType[]   = ["ENTITLEMENT", "PRIVATE", "MIXED"];
const REQUEST_CATEGORIES: RequestCategory[] = ["Mask", "Headgear", "Filters", "Tubing", "Cleaning supplies", "Support request"];
const TYPE_LABEL: Record<OrderType, string> = {
  ENTITLEMENT: "Entitlement",
  PRIVATE:     "Private",
  MIXED:       "Mixed",
};
const STATUS_BADGE: Record<OrderStatus, string> = {
  New:              "bg-amber-100 text-amber-800 border border-amber-200",
  Reviewing:        "bg-blue-100 text-blue-800 border border-blue-200",
  Approved:         "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Sent:             "bg-purple-100 text-purple-800 border border-purple-200",
  Delivered:        "bg-teal-100 text-teal-800 border border-teal-200",
  Declined:         "bg-red-100 text-red-700 border border-red-200",
  "Needs Follow-Up": "bg-orange-100 text-orange-700 border border-orange-200",
};
const TYPE_BADGE: Record<OrderType, string> = {
  ENTITLEMENT: "bg-[#0B5C6C]/10 text-[#0B5C6C]",
  PRIVATE:     "bg-purple-100 text-purple-700",
  MIXED:       "bg-orange-100 text-orange-700",
};
const STATUS_BAR_COLOR: Record<OrderStatus, string> = {
  New:               "bg-amber-400",
  Reviewing:         "bg-blue-400",
  Approved:          "bg-emerald-500",
  Sent:              "bg-purple-500",
  Delivered:         "bg-teal-500",
  Declined:          "bg-red-400",
  "Needs Follow-Up": "bg-orange-400",
};
const STATUS_LIFECYCLE_COPY: Record<OrderStatus, string> = {
  New:               "Patient request has been received and is waiting for staff review.",
  Reviewing:         "Staff are checking the request, entitlement, and next action.",
  Approved:          "Request has been approved and can be prepared for fulfilment.",
  Sent:              "Supplies have been sent or are being dispatched to the patient.",
  Delivered:         "Request is complete. Patient can submit a future request when appropriate.",
  Declined:          "Request was not approved. Staff should ensure the patient has clear next steps.",
  "Needs Follow-Up": "Staff need to contact or review the patient before the request can progress.",
};
const STATUS_QUEUE_COPY: Record<OrderStatus, string> = {
  New:               "Awaiting staff review",
  Reviewing:         "Under review",
  Approved:          "Ready to prepare",
  Sent:              "Dispatched",
  Delivered:         "Completed",
  Declined:          "Not proceeding",
  "Needs Follow-Up": "Follow-up required",
};
const REPORT_SOURCE_OPTIONS: ReportSource[] = ["patient_portal", "support_request", "admin_created", "other"];
const REPORT_SOURCE_LABEL: Record<ReportSource, string> = {
  patient_portal:  "Portal",
  support_request: "Support",
  admin_created:   "Admin created",
  other:           "Other",
};

function getSourceKey(source: string | undefined): ReportSource {
  if (source === "patient_portal" || source === "support_request" || source === "admin_created") {
    return source;
  }
  return "other";
}

function getSourceLabel(source: string | undefined): string {
  return REPORT_SOURCE_LABEL[getSourceKey(source)];
}

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all",                  label: "All" },
  { key: "New",                  label: "New" },
  { key: "Reviewing",            label: "Reviewing" },
  { key: "Approved",             label: "Approved" },
  { key: "Sent",                 label: "Sent" },
  { key: "Delivered",            label: "Delivered" },
  { key: "Declined",             label: "Declined" },
  { key: "Needs Follow-Up",      label: "Needs Follow-Up" },
  { key: "Needs Funding Review", label: "Funding Check" },
];

const DEMO_REQUESTS: Order[] = [
  {
    id: "demo-1",
    requestId: "REQ-900001-A",
    patient: "Demo Patient A",
    msid: "MS-900001",
    date: "26 May 2026",
    updatedDate: "26 May 2026",
    items: "Mask replacement (AirFit F30i)",
    category: "Mask",
    type: "ENTITLEMENT",
    status: "New",
    source: "patient_portal",
    estimatedItemAmount: 85,
    estimatedFundedAmount: 85,
    estimatedPatientCopay: 0,
    estimatedRemainingAfter: 165,
    isDemo: true,
    localOnly: true,
  },
  {
    id: "demo-2",
    requestId: "REQ-900002-A",
    patient: "Demo Patient B",
    msid: "MS-900002",
    date: "24 May 2026",
    updatedDate: "24 May 2026",
    items: "Filters × 2 + Replacement tubing",
    category: "Filters",
    type: "ENTITLEMENT",
    status: "Reviewing",
    source: "patient_portal",
    estimatedItemAmount: 45,
    estimatedFundedAmount: 45,
    estimatedPatientCopay: 0,
    estimatedRemainingAfter: 205,
    isDemo: true,
    localOnly: true,
  },
  {
    id: "demo-3",
    requestId: "REQ-900003-A",
    patient: "Demo Patient C",
    msid: "MS-900003",
    date: "20 May 2026",
    updatedDate: "20 May 2026",
    items: "Headgear replacement",
    category: "Headgear",
    type: "ENTITLEMENT",
    status: "Approved",
    source: "patient_portal",
    estimatedItemAmount: 65,
    estimatedFundedAmount: 65,
    estimatedPatientCopay: 0,
    estimatedRemainingAfter: 185,
    isDemo: true,
    localOnly: true,
  },
  {
    id: "demo-4",
    requestId: "REQ-900004-A",
    patient: "Demo Patient D",
    msid: "MS-900004",
    date: "18 May 2026",
    updatedDate: "18 May 2026",
    items: "General CPAP support enquiry",
    itemDescription: "General CPAP support enquiry",
    category: "Support request",
    type: "PRIVATE",
    status: "New",
    source: "support_request",
    estimatedItemAmount: null,
    estimatedFundedAmount: null,
    estimatedPatientCopay: null,
    estimatedRemainingAfter: null,
    isDemo: true,
    localOnly: true,
  },
];

// ─── FilterPanel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilters: Set<OrderStatus>;
  setStatusFilters: (s: Set<OrderStatus>) => void;
  typeFilters: Set<OrderType>;
  setTypeFilters: (s: Set<OrderType>) => void;
  dateRange: DateRange | null;
  setDateRange: (r: DateRange | null) => void;
  customDateFrom: string;
  setCustomDateFrom: (v: string) => void;
  customDateTo: string;
  setCustomDateTo: (v: string) => void;
  sortOpt: OrderSortOpt | null;
  setSortOpt: (s: OrderSortOpt | null) => void;
  resultCount: number;
  onClearAll: () => void;
}

function FilterPanel({
  isOpen, onClose,
  statusFilters, setStatusFilters,
  typeFilters, setTypeFilters,
  dateRange, setDateRange,
  customDateFrom, setCustomDateFrom,
  customDateTo, setCustomDateTo,
  sortOpt, setSortOpt,
  resultCount, onClearAll,
}: FilterPanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  function toggleStatus(v: OrderStatus) {
    const next = new Set(statusFilters);
    next.has(v) ? next.delete(v) : next.add(v);
    setStatusFilters(next);
  }
  function toggleType(v: OrderType) {
    const next = new Set(typeFilters);
    next.has(v) ? next.delete(v) : next.add(v);
    setTypeFilters(next);
  }

  const sectionCls = "space-y-1 pb-5 border-b border-gray-100 last:border-0 last:pb-0";
  const legendCls  = "block text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3";
  const rowCls     = "flex items-center gap-3 min-h-[44px] cursor-pointer select-none";
  const inputCls   = "h-5 w-5 rounded accent-[#0B5C6C] cursor-pointer shrink-0";
  const labelCls   = "text-base text-gray-700";

  const DATE_OPTIONS: { value: DateRange; label: string }[] = [
    { value: "week",  label: "This week" },
    { value: "month", label: "This month" },
    { value: "older", label: "Older" },
    { value: "custom", label: "Custom range" },
  ];
  const SORT_OPTIONS: { value: OrderSortOpt; label: string }[] = [
    { value: "newest",  label: "Newest first" },
    { value: "oldest",  label: "Oldest first" },
    { value: "name_az", label: "Patient name A–Z" },
    { value: "status",  label: "Status" },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter & Sort"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy">Filter &amp; Sort</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClearAll}
              className="text-base text-[#0B5C6C] hover:underline font-medium min-h-[44px] px-3"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className={sectionCls}>
            <span className={legendCls}>Status</span>
            {STATUS_OPTIONS.map((s) => (
              <label key={s} className={rowCls}>
                <input type="checkbox" checked={statusFilters.has(s)} onChange={() => toggleStatus(s)} className={inputCls} />
                <span className={labelCls}>{s}</span>
              </label>
            ))}
          </div>

          <div className={sectionCls}>
            <span className={legendCls}>Type</span>
            {TYPE_OPTIONS.map((t) => (
              <label key={t} className={rowCls}>
                <input type="checkbox" checked={typeFilters.has(t)} onChange={() => toggleType(t)} className={inputCls} />
                <span className={labelCls}>{TYPE_LABEL[t]}</span>
              </label>
            ))}
          </div>

          <div className={sectionCls}>
            <span className={legendCls}>Date</span>
            {DATE_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="radio"
                  name="dateRange"
                  checked={dateRange === opt.value}
                  onChange={() => setDateRange(opt.value)}
                  onClick={() => { if (dateRange === opt.value) setDateRange(null); }}
                  className={inputCls}
                />
                <span className={labelCls}>{opt.label}</span>
              </label>
            ))}
            {dateRange === "custom" && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From</span>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/25"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/25"
                  />
                </label>
              </div>
            )}
          </div>

          <div className={sectionCls}>
            <span className={legendCls}>Sort</span>
            {SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="radio"
                  name="sortOpt"
                  checked={sortOpt === opt.value}
                  onChange={() => setSortOpt(opt.value)}
                  onClick={() => { if (sortOpt === opt.value) setSortOpt(null); }}
                  className={inputCls}
                />
                <span className={labelCls}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4 bg-white">
          <p className="text-base font-medium text-gray-600">{resultCount} requests found</p>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0B5C6C] text-white text-base font-medium px-6 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
          >
            Show requests
          </button>
        </div>
      </div>
    </>
  );
}

// ─── ReportDrawer ─────────────────────────────────────────────────────────────

interface ReportStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  portal: number;
  support: number;
  adminCreated: number;
  otherSource: number;
  needsFundingReview: number;
}

interface ReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reportWindow: ReportWindow;
  setReportWindow: (w: ReportWindow) => void;
  selectedStatuses: Set<OrderStatus>;
  setSelectedStatuses: (s: Set<OrderStatus>) => void;
  selectedSources: Set<ReportSource>;
  setSelectedSources: (s: Set<ReportSource>) => void;
  stats: ReportStats;
  windowLabel: string;
  windowDescription: string;
  includedStatuses: string;
  includedSources: string;
  onGenerateReport: () => void;
  onDownloadList: () => void;
  matchingCount: number;
}

function ReportDrawer({
  isOpen, onClose,
  reportWindow, setReportWindow,
  selectedStatuses, setSelectedStatuses,
  selectedSources, setSelectedSources,
  stats, windowLabel, windowDescription,
  includedStatuses, includedSources,
  onGenerateReport, onDownloadList,
  matchingCount,
}: ReportDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const sectionCls = "space-y-3 pb-5 border-b border-gray-100 last:border-0 last:pb-0";
  const legendCls  = "block text-sm font-semibold text-gray-600 uppercase tracking-wide";
  const rowCls     = "flex items-center justify-between gap-3 min-h-[40px] cursor-pointer select-none";
  const inputCls   = "h-5 w-5 rounded accent-[#0B5C6C] cursor-pointer shrink-0";

  const WINDOW_OPTIONS: { value: ReportWindow; label: string }[] = [
    { value: "7d",  label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" },
  ];
  const canGenerateReport = selectedStatuses.size > 0;

  function toggleStatus(status: OrderStatus) {
    const next = new Set(selectedStatuses);
    next.has(status) ? next.delete(status) : next.add(status);
    setSelectedStatuses(next);
  }

  function toggleSource(source: ReportSource) {
    const next = new Set(selectedSources);
    next.has(source) ? next.delete(source) : next.add(source);
    setSelectedSources(next);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Download Report"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy">Download Report</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Report description */}
          <div className={sectionCls}>
            <p className="text-sm leading-6 text-gray-600">
              Operational request report based on currently loaded Midland Sleep request data. This report is for staff review and does not include patient clinical details.
            </p>
            <dl className="mt-3 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-gray-700">Reporting window</dt>
                <dd className="text-right">{windowLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-gray-700">Included statuses</dt>
                <dd className="text-right">{includedStatuses}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-gray-700">Included sources</dt>
                <dd className="text-right">{includedSources}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-gray-700">Matching requests</dt>
                <dd className="text-right tabular-nums">{matchingCount}</dd>
              </div>
            </dl>
          </div>

          {/* Reporting window */}
          <div className={sectionCls}>
            <span className={legendCls}>Reporting window</span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {WINDOW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportWindow(opt.value)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg border transition-colors text-left",
                    reportWindow === opt.value
                      ? "bg-[#0B5C6C] border-[#0B5C6C] text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-[#0B5C6C]/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs leading-5 text-gray-500">{windowDescription}</p>
          </div>

          {/* Status filters */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between gap-3">
              <span className={legendCls}>Statuses</span>
              <div className="flex items-center gap-3 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(new Set(STATUS_OPTIONS))}
                  className="text-[#0B5C6C] hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(new Set())}
                  className="text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {STATUS_OPTIONS.map((status) => (
                <label key={status} className={rowCls}>
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.has(status)}
                      onChange={() => toggleStatus(status)}
                      className={inputCls}
                    />
                    {status}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 tabular-nums">{stats.byStatus[status]}</span>
                </label>
              ))}
            </div>
            {!canGenerateReport && (
              <p className="text-sm text-red-700">Select at least one status to generate a report.</p>
            )}
          </div>

          {/* Source filters */}
          <div className={sectionCls}>
            <span className={legendCls}>Sources</span>
            <div className="mt-3 space-y-1">
              {REPORT_SOURCE_OPTIONS.map((source) => {
                const count =
                  source === "patient_portal" ? stats.portal :
                  source === "support_request" ? stats.support :
                  source === "admin_created" ? stats.adminCreated :
                  stats.otherSource;
                return (
                  <label key={source} className={rowCls}>
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedSources.has(source)}
                        onChange={() => toggleSource(source)}
                        className={inputCls}
                      />
                      {REPORT_SOURCE_LABEL[source]}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 tabular-nums">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Requests by status */}
          <div className={sectionCls}>
            <span className={legendCls}>Requests by status</span>
            <p className="text-xs text-gray-500 mt-0.5">{windowLabel}</p>
            <dl className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-semibold text-gray-700">Total matching requests</dt>
                <dd className="text-sm font-bold text-navy tabular-nums">{stats.total}</dd>
              </div>
              {STATUS_OPTIONS.map((status) => (
                <div key={status} className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_BAR_COLOR[status])} />
                    {status}
                  </dt>
                  <dd className="text-sm font-semibold text-gray-800 tabular-nums">{stats.byStatus[status]}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <dt className="text-sm text-amber-700">Needs funding review</dt>
                <dd className="text-sm font-semibold text-amber-700 tabular-nums">{stats.needsFundingReview}</dd>
              </div>
            </dl>
          </div>

          {/* Requests by source */}
          <div className={sectionCls}>
            <span className={legendCls}>Requests by source</span>
            <dl className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Source: Portal</dt>
                <dd className="text-sm font-semibold text-gray-800 tabular-nums">{stats.portal}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Source: Support</dt>
                <dd className="text-sm font-semibold text-gray-800 tabular-nums">{stats.support}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Source: Admin created</dt>
                <dd className="text-sm font-semibold text-gray-800 tabular-nums">{stats.adminCreated}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Source: Other</dt>
                <dd className="text-sm font-semibold text-gray-800 tabular-nums">{stats.otherSource}</dd>
              </div>
            </dl>
          </div>

          {/* File format */}
          <div className={sectionCls}>
            <span className={legendCls}>File format</span>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 min-h-[44px]">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#0B5C6C]">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#0B5C6C]" />
                </div>
                <span className="text-base text-gray-700">CSV — summary report (Section, Metric, Value)</span>
              </div>
              <div className="flex items-center gap-3 min-h-[44px] opacity-40">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-300" />
                <span className="text-base text-gray-400">PDF — future scope</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4 space-y-4 bg-white">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onGenerateReport}
              disabled={!canGenerateReport}
              className="w-full bg-[#0B5C6C] text-white text-base font-medium px-6 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download summary report
            </button>
            <p className="text-xs text-gray-500 leading-5">Summary report includes totals, status counts, source counts, and funding review counts.</p>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onDownloadList}
              className="w-full border border-gray-300 bg-white text-gray-700 text-sm font-medium px-6 py-2 rounded-lg min-h-[44px] hover:border-[#0B5C6C] transition-colors"
            >
              Download detailed request list ({matchingCount} matching rows)
            </button>
            <p className="text-xs text-gray-500 leading-5">Detailed request list includes matching request rows for staff review.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Notification queue state ─────────────────────────────────────────────────

interface OrderNotifState {
  ok:              boolean;
  scheduledFor?:   string;
  notificationId?: string;
  supersededCount?: number;
  reason?:         string;
  triggerStatus?:  string;  // display label e.g. "Approved"
}

// Maps DynamoDB trigger_status values to admin-facing display labels
const TRIGGER_STATUS_DISPLAY: Record<string, string> = {
  approved:       "Approved",
  sent:           "Sent",
  declined:       "Declined",
  needs_followup: "Needs Follow-Up",
};

// notifState meanings:
//   undefined  = not yet loaded (fetch in progress)
//   null       = loaded, no queued notification
//   object     = loaded, has queued or failed notification state
function NotificationSection({
  notifState,
  orderStatus,
}: {
  notifState: OrderNotifState | null | undefined;
  orderStatus?: OrderStatus;
}) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Patient communication status</p>
      {notifState === undefined ? (
        <p className="text-xs text-gray-400">—</p>
      ) : notifState === null ? (
        <p className="text-xs text-gray-400">No patient communication is queued for this status.</p>
      ) : notifState.ok ? (
        <div className="rounded-lg border border-[#74C0A2]/30 bg-[#74C0A2]/5 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35">
              Queued
            </span>
            {notifState.triggerStatus && (
              <span className="text-xs text-gray-600">Triggered by: {notifState.triggerStatus}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-5">
            A patient communication is queued based on the latest status change.
          </p>
          {notifState.scheduledFor && (
            <p className="text-xs text-gray-500">Scheduled: {formatHistoryDate(notifState.scheduledFor)}</p>
          )}
          <p className="text-xs text-gray-500">Channel: Email</p>
          <p className="text-xs text-gray-400 leading-5 italic">
            No email has been sent yet. This is a queued communication record.
          </p>
          {notifState.supersededCount !== undefined && notifState.supersededCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {notifState.supersededCount} earlier record{notifState.supersededCount !== 1 ? "s" : ""} superseded — previous communication superseded
            </span>
          )}
          {orderStatus === "Delivered" && (
            <p className="text-xs text-gray-400 leading-5">
              Delivered does not create a new communication record. This entry may relate to the previous Sent update.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2.5">
          <p className="text-xs text-amber-700">Communication queue unavailable. Status update was saved.</p>
        </div>
      )}
    </div>
  );
}

// ─── RequestReviewDrawer types + helpers ─────────────────────────────────────

type RequestHistoryState = "idle" | "loading" | "loaded" | "error";

interface RequestHistoryEvent {
  timestamp: string;
  label: string;
  action: string;
  adminEmail?: string | null;
  result: string | null;
}

const REQUEST_HISTORY_LABELS: Record<string, string> = {
  REQUEST_STATUS_UPDATED:  "Status updated",
  REQUEST_CREATED:         "Request submitted",
  REQUEST_REVIEWED:        "Request reviewed",
};

function labelForRequestAction(action: string): string {
  return (
    REQUEST_HISTORY_LABELS[action] ??
    action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  );
}

const SAFE_REQUEST_DETAIL: Record<string, string> = {
  REQUEST_CREATED:               "Request created",
  REQUEST_STATUS_UPDATED:        "Request status updated",
  REQUEST_REVIEWED:              "Request reviewed",
  REQUEST_FUNDING_REVIEW_SET:    "Funding review flag updated",
  REQUEST_FUNDING_REVIEW_CLEARED:"Funding review flag updated",
  REQUEST_FUNDING_REVIEW_CLEAR:  "Funding review flag updated",
};

function getSafeRequestHistoryDetail(action: string): string {
  return SAFE_REQUEST_DETAIL[action] ?? "Request activity recorded";
}

function formatHistoryDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Pacific/Auckland",
  }).format(d);
}

// ─── Entitlement estimate helper ─────────────────────────────────────────────

function calcFundingBreakdown(order: Order) {
  const allowance = DEFAULT_ANNUAL_ALLOWANCE;
  const requested = order.estimatedItemAmount;
  if (requested === null) {
    return {
      requested:     null,
      allowance,
      funded:        order.estimatedFundedAmount        ?? null,
      copay:         order.estimatedPatientCopay        ?? null,
      remaining:     order.estimatedRemainingAfter      ?? null,
      overAllowance: false,
      dataAvailable: false,
    };
  }
  const funded    = order.estimatedFundedAmount   ?? Math.min(requested, allowance);
  const copay     = order.estimatedPatientCopay   ?? Math.max(0, requested - funded);
  const remaining = order.estimatedRemainingAfter ?? Math.max(0, allowance - funded);
  return {
    requested,
    allowance,
    funded,
    copay,
    remaining,
    overAllowance: requested > allowance,
    dataAvailable: true,
  };
}

// ─── RequestReviewDrawer ──────────────────────────────────────────────────────

interface RequestReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  statusLoading: Set<string>;
  fundingReviewLoading: Set<string>;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  onFundingReviewToggle: (order: Order) => void;
  onViewPatient: () => void;
  notifState?: OrderNotifState | null | undefined;
}

function RequestReviewDrawer({
  isOpen, onClose,
  order,
  statusLoading, fundingReviewLoading,
  onStatusChange, onFundingReviewToggle,
  onViewPatient,
  notifState,
}: RequestReviewDrawerProps) {
  const [tab, setTab] = useState<ReviewTab>("request");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setTab("request");
  }, [order?.id, isOpen]);

  const historyFetchRef = useRef(false);
  const [requestHistory,      setRequestHistory]      = useState<RequestHistoryEvent[]>([]);
  const [requestHistoryState, setRequestHistoryState] = useState<RequestHistoryState>("idle");

  useEffect(() => {
    setRequestHistory([]);
    setRequestHistoryState("idle");
    historyFetchRef.current = false;
  }, [order?.id]);

  useEffect(() => {
    if (tab !== "history" || !order?.msid || historyFetchRef.current) return;
    historyFetchRef.current = true;
    let cancelled = false;
    setRequestHistoryState("loading");
    fetch(`/api/admin/patients/activity?msid=${encodeURIComponent(order.msid)}&limit=50`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const payload = data as Record<string, unknown>;
        if (Array.isArray(payload.activity)) {
          const all = payload.activity as RequestHistoryEvent[];
          setRequestHistory(all.filter((e) => e.action.startsWith("REQUEST")));
          setRequestHistoryState("loaded");
        } else {
          setRequestHistoryState("error");
        }
      })
      .catch(() => { if (!cancelled) setRequestHistoryState("error"); });
    return () => { cancelled = true; };
  }, [tab, order?.msid]);

  const REVIEW_TABS: { key: ReviewTab; label: string }[] = [
    { key: "request", label: "Request" },
    { key: "funding", label: "Funding" },
    { key: "patient", label: "Patient" },
    { key: "history", label: "History" },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Review Request"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {order?.requestId ?? "—"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-navy truncate">
                {order?.patient ?? "—"}
              </h2>
              <p className="mt-0.5 font-mono text-sm text-gray-400">{order?.msid ?? "—"}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close review"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {order && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full", STATUS_BADGE[order.status])}>
                {order.status}
              </span>
              <SourceBadge source={order.source} />
              {order.needsFundingReview && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Funding review
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          {REVIEW_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 px-3 py-3 text-sm font-semibold -mb-px border-b-2 transition-colors",
                tab === key
                  ? "border-[#0B5C6C] text-[#0B5C6C]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!order ? (
            <p className="text-sm text-gray-400">No request selected.</p>
          ) : tab === "request" ? (
            <div className="space-y-5">

              {/* Requested items */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Requested items</p>
                <p className="text-sm text-gray-800 leading-5">{order.items || order.itemDescription || "—"}</p>
              </div>

              {/* Status + lifecycle interpretation */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Status</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order, e.target.value as OrderStatus)}
                    disabled={statusLoading.has(order.id)}
                    className={cn("rounded-full px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 disabled:opacity-60", STATUS_BADGE[order.status])}
                    aria-label={`Change status for ${order.requestId}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {statusLoading.has(order.id) && (
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Saving…</p>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 leading-5">{STATUS_LIFECYCLE_COPY[order.status]}</p>
              </div>

              {/* Funding context + review flag */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Funding</p>
                <div className="rounded-lg border border-amber-200/70 bg-amber-50/50 px-3 py-2 mb-3">
                  <p className="text-xs text-amber-800">Phase 2 visibility only — no deduction, payment, or reservation applied.</p>
                </div>
                {(order.estimatedItemAmount !== null || order.estimatedFundedAmount !== null) && (
                  <dl className="divide-y divide-gray-100 mb-3">
                    <div className="flex justify-between items-center py-2">
                      <dt className="text-xs text-gray-600">Est. item amount</dt>
                      <dd className="text-xs font-semibold text-gray-800">{formatEstimate(order.estimatedItemAmount)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <dt className="text-xs text-emerald-700">Est. funded</dt>
                      <dd className="text-xs font-semibold text-emerald-700">{formatEstimate(order.estimatedFundedAmount)}</dd>
                    </div>
                    {order.estimatedPatientCopay !== null && order.estimatedPatientCopay !== undefined && order.estimatedPatientCopay > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <dt className="text-xs text-gray-600">Est. co-pay</dt>
                        <dd className="text-xs font-semibold text-gray-800">{formatEstimate(order.estimatedPatientCopay)}</dd>
                      </div>
                    )}
                  </dl>
                )}
                <button
                  type="button"
                  onClick={() => onFundingReviewToggle(order)}
                  disabled={fundingReviewLoading.has(order.id)}
                  className={cn(
                    "w-full text-left text-sm font-medium px-3 py-2 rounded-lg border transition-colors disabled:opacity-60",
                    order.needsFundingReview
                      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                  )}
                >
                  {fundingReviewLoading.has(order.id) ? "…" : order.needsFundingReview ? "Funding review: flagged — click to clear" : "Funding review: not flagged — click to flag"}
                </button>
                {order.reviewReason && (
                  <p className="mt-1.5 text-xs text-gray-500">Reason: {order.reviewReason}</p>
                )}
              </div>

              {/* Metadata */}
              <dl className="divide-y divide-gray-100">
                <div className="flex justify-between items-center py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</dt>
                  <dd className="font-mono text-xs font-semibold text-gray-800">{order.requestId}</dd>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source</dt>
                  <dd><SourceBadge source={order.source} /></dd>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</dt>
                  <dd className="text-xs text-gray-700">{order.date}</dd>
                </div>
                {order.updatedDate && order.updatedDate !== order.date && (
                  <div className="flex justify-between items-center py-2.5">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Updated</dt>
                    <dd className="text-xs text-gray-700">{order.updatedDate}</dd>
                  </div>
                )}
                {order.contactPreference && (
                  <div className="flex justify-between items-center py-2.5">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact pref.</dt>
                    <dd className="text-xs text-gray-700">{order.contactPreference}</dd>
                  </div>
                )}
              </dl>

              <NotificationSection notifState={notifState} orderStatus={order.status} />
            </div>
          ) : tab === "funding" ? (
            <div className="space-y-5">

              {/* Phase 2 banner */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Phase 2 visibility only.</span>{" "}
                  No entitlement deduction, payment, or inventory reservation is applied.
                </p>
              </div>

              {/* Allowance estimate breakdown */}
              {(() => {
                const fb = calcFundingBreakdown(order);
                return (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                      Allowance estimate — request level
                    </p>
                    {!fb.dataAvailable && (
                      <p className="mb-3 text-xs text-gray-400 leading-5">
                        Item amount not available for this request type. Entitlement estimates cannot be fully calculated.
                      </p>
                    )}
                    <dl className="divide-y divide-gray-100">
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-sm text-gray-600">Requested amount</dt>
                        <dd className="text-sm font-semibold text-gray-800">
                          {fb.requested !== null ? formatEstimate(fb.requested) : <span className="text-gray-400 font-normal">Not available</span>}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-sm text-gray-400">Annual allowance (ref.)</dt>
                        <dd className="text-sm text-gray-400">${fb.allowance.toFixed(0)}.00</dd>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-sm font-medium text-emerald-700">Est. funded</dt>
                        <dd className="text-sm font-semibold text-emerald-700">
                          {fb.funded !== null ? formatEstimate(fb.funded) : <span className="text-gray-400 font-normal">—</span>}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <dt className={cn("text-sm", fb.copay !== null && fb.copay > 0 ? "text-orange-700 font-medium" : "text-gray-600")}>
                          Est. patient co-pay
                        </dt>
                        <dd className={cn("text-sm font-semibold", fb.copay !== null && fb.copay > 0 ? "text-orange-700" : "text-gray-800")}>
                          {fb.copay !== null ? formatEstimate(fb.copay) : <span className="text-gray-400 font-normal">—</span>}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-sm text-gray-600">Est. remaining after</dt>
                        <dd className="text-sm font-semibold text-gray-800">
                          {fb.remaining !== null ? formatEstimate(fb.remaining) : <span className="text-gray-400 font-normal">—</span>}
                        </dd>
                      </div>
                    </dl>
                    {fb.dataAvailable && (
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5">
                        <p className="text-xs text-gray-600 leading-5">
                          {fb.overAllowance ? (
                            <>
                              <span className="font-semibold">{formatEstimate(fb.requested)}</span>
                              {" requested exceeds "}
                              <span className="font-semibold">${fb.allowance} allowance</span>
                              {" — est. co-pay "}
                              <span className="font-semibold text-orange-700">{formatEstimate(fb.copay)}</span>
                              {", remaining "}
                              <span className="font-semibold">{formatEstimate(fb.remaining)}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">${fb.allowance}</span>
                              {" allowance − "}
                              <span className="font-semibold text-emerald-700">{formatEstimate(fb.funded)}</span>
                              {" est. funded = "}
                              <span className="font-semibold">{formatEstimate(fb.remaining)}</span>
                              {" remaining (est.)"}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    {fb.overAllowance && (
                      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 space-y-1">
                        <p className="text-xs font-semibold text-amber-800">
                          Request exceeds annual allowance — funding check recommended.
                        </p>
                        <p className="text-xs text-amber-700">
                          Estimated co-pay of {formatEstimate(fb.copay)} applies based on ${fb.allowance} allowance reference.
                          Use the funding review flag to mark this for staff check.
                        </p>
                      </div>
                    )}
                    <p className="mt-3 text-[10px] text-gray-400 leading-4">
                      Request-level estimate only. Patient-level allowance usage is not yet tracked in Phase 2.
                      All figures are estimates — no deduction has been applied.
                    </p>
                  </div>
                );
              })()}

              {/* Funding review */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Funding review flag</p>
                <button
                  type="button"
                  onClick={() => onFundingReviewToggle(order)}
                  disabled={fundingReviewLoading.has(order.id)}
                  className={cn(
                    "w-full text-left text-sm font-medium px-4 py-2.5 rounded-lg border transition-colors disabled:opacity-60",
                    order.needsFundingReview
                      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                  )}
                >
                  {fundingReviewLoading.has(order.id) ? "…" : order.needsFundingReview ? "Flagged — click to clear" : "Not flagged — click to flag"}
                </button>
                {order.reviewReason && (
                  <p className="mt-2 text-xs text-gray-500">Reason: {order.reviewReason}</p>
                )}
              </div>
            </div>
          ) : tab === "patient" ? (
            <div className="space-y-5">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</dt>
                  <dd className="mt-1 text-base font-semibold text-navy">{order.patient}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Midland Sleep ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-700">{order.msid}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source</dt>
                  <dd className="mt-1"><SourceBadge source={order.source} /></dd>
                </div>
              </dl>
              <p className="text-sm leading-6 text-gray-500">
                Device record, mask record, and full patient history are available in the patient profile.
              </p>
              <button
                type="button"
                onClick={onViewPatient}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#0B5C6C] px-4 py-2.5 text-sm font-medium text-[#0B5C6C] min-h-[44px] hover:bg-[#0B5C6C]/5 transition-colors"
              >
                Open patient record
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Safe metadata */}
              <dl className="divide-y divide-gray-100">
                <div className="flex justify-between items-center py-3">
                  <dt className="text-sm text-gray-600">Created</dt>
                  <dd className="text-sm font-semibold text-gray-800">{order.date}</dd>
                </div>
                {order.updatedDate && order.updatedDate !== order.date && (
                  <div className="flex justify-between items-center py-3">
                    <dt className="text-sm text-gray-600">Last updated</dt>
                    <dd className="text-sm font-semibold text-gray-800">{order.updatedDate}</dd>
                  </div>
                )}
                <div className="flex justify-between items-center py-3">
                  <dt className="text-sm text-gray-600">Current status</dt>
                  <dd>
                    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full", STATUS_BADGE[order.status])}>
                      {order.status}
                    </span>
                  </dd>
                </div>
              </dl>

              {/* Request activity */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Patient request activity</p>
                <p className="text-xs text-gray-400 leading-5">Showing request-related activity for this patient. Some events may relate to other requests from the same patient.</p>

                {(requestHistoryState === "idle" || requestHistoryState === "loading") && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-sm text-gray-400">Loading activity…</p>
                  </div>
                )}
                {requestHistoryState === "error" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm text-amber-800">Activity temporarily unavailable.</p>
                  </div>
                )}
                {requestHistoryState === "loaded" && requestHistory.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 space-y-1.5">
                    <p className="text-sm text-gray-500">No patient request activity is available yet.</p>
                    <p className="text-xs text-gray-400">Full patient audit history is available from the patient record.</p>
                  </div>
                )}
                {requestHistoryState === "loaded" && requestHistory.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-[460px]">
                        <div className="grid grid-cols-[100px_130px_1fr_110px] gap-x-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                          {["When", "Activity", "Details", "By"].map((h) => (
                            <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</span>
                          ))}
                        </div>
                        <ul className="divide-y divide-gray-100">
                          {requestHistory.map((event, i) => (
                            <li key={i} className="grid grid-cols-[100px_130px_1fr_110px] gap-x-3 items-start px-4 py-3">
                              <span className="text-xs text-gray-500 whitespace-nowrap leading-5">
                                {formatHistoryDate(event.timestamp)}
                              </span>
                              <span className="text-sm font-medium text-gray-800 leading-5">
                                {labelForRequestAction(event.action)}
                              </span>
                              <span className="text-xs text-gray-600 leading-5 break-words">
                                {getSafeRequestHistoryDetail(event.action)}
                              </span>
                              <span className="text-xs text-gray-500 leading-5">
                                {event.adminEmail ? "Staff user" : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-400">
                        {requestHistory.length} event{requestHistory.length !== 1 ? "s" : ""} · Patient request activity
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-700">
        {filtered ? "No requests match the current filters." : "No requests here yet."}
      </p>
      {!filtered && (
        <p className="text-sm leading-6 text-gray-500 mt-1">
          Patient supply requests submitted via the patient portal will appear here. Checkout,
          fulfilment, and payment processing are Phase 3.
        </p>
      )}
    </div>
  );
}

function CreateTestRequestPanel({
  form,
  onChange,
  onCreate,
}: {
  form: TestRequestForm;
  onChange: (patch: Partial<TestRequestForm>) => void;
  onCreate: () => void;
}) {
  const amount = Number(form.amount) || 0;
  const estimate = calculateEstimate(amount);
  const inputCls = "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Create test request</h2>
            <p className="mt-1 text-sm text-gray-500">
              Demo request only — not persisted after refresh.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Local only
          </span>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5 lg:grid-cols-6">
        <label className="space-y-1 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Patient MSID</span>
          <input value={form.msid} onChange={(e) => onChange({ msid: e.target.value })} className={inputCls} placeholder="MS-900005" />
        </label>
        <label className="space-y-1 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Patient name</span>
          <input value={form.patient} onChange={(e) => onChange({ patient: e.target.value })} className={inputCls} placeholder="Demo Patient" />
        </label>
        <label className="space-y-1 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</span>
          <select value={form.category} onChange={(e) => onChange({ category: e.target.value as RequestCategory })} className={inputCls}>
            {REQUEST_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requested item</span>
          <input value={form.item} onChange={(e) => onChange({ item: e.target.value })} className={inputCls} placeholder="Mask cushion" />
        </label>
        <label className="space-y-1 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estimated amount</span>
          <input type="number" min="0" step="1" value={form.amount} onChange={(e) => onChange({ amount: e.target.value })} className={inputCls} placeholder="85" />
        </label>
        <label className="space-y-1 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin note</span>
          <input value={form.note} onChange={(e) => onChange({ note: e.target.value })} className={inputCls} placeholder="Optional" />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-5 py-4">
        <div className="grid gap-x-5 gap-y-1 text-xs text-gray-600 sm:grid-cols-4">
          <p><span className="text-gray-400">Default allowance:</span> {formatCurrency(DEFAULT_ANNUAL_ALLOWANCE)}</p>
          <p><span className="text-gray-400">Funded:</span> {formatCurrency(estimate.estimatedFundedAmount)}</p>
          <p><span className="text-gray-400">Patient co-pay:</span> {formatCurrency(estimate.estimatedPatientCopay)}</p>
          <p><span className="text-gray-400">Remaining after:</span> {formatCurrency(estimate.estimatedRemainingAfter)}</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-[#0B5C6C] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0B5C6C]/90"
        >
          Create test request
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders,              setOrders]              = useState<Order[]>([]);
  const [ordersLoading,       setOrdersLoading]       = useState(true);
  const [statusTab,           setStatusTab]           = useState<StatusTab>("all");
  const [selected,            setSelected]            = useState<Set<string>>(new Set());
  const [drawerOpen,          setDrawerOpen]          = useState(false);
  const [drawerMsid,          setDrawerMsid]          = useState<string | null>(null);
  const [drawerName,          setDrawerName]          = useState<string | undefined>(undefined);
  const [filterOpen,          setFilterOpen]          = useState(false);
  const [statusFilters,       setStatusFilters]       = useState<Set<OrderStatus>>(new Set());
  const [typeFilters,         setTypeFilters]         = useState<Set<OrderType>>(new Set());
  const [dateRange,           setDateRange]           = useState<DateRange | null>(null);
  const [customDateFrom,      setCustomDateFrom]      = useState("");
  const [customDateTo,        setCustomDateTo]        = useState("");
  const [sortOpt,             setSortOpt]             = useState<OrderSortOpt | null>(null);
  const [statusLoading,       setStatusLoading]       = useState<Set<string>>(new Set());
  const [fundingReviewLoading, setFundingReviewLoading] = useState<Set<string>>(new Set());
  const [statusError,         setStatusError]         = useState<string | null>(null);
  const [showAdminRows,       setShowAdminRows]       = useState(false);
  const [devToolsOpen,        setDevToolsOpen]        = useState(false);
  const [reportWindow,        setReportWindow]        = useState<ReportWindow>("30d");
  const [reportStatusFilters, setReportStatusFilters] = useState<Set<OrderStatus>>(() => new Set(STATUS_OPTIONS));
  const [reportSourceFilters, setReportSourceFilters] = useState<Set<ReportSource>>(() => new Set(REPORT_SOURCE_OPTIONS));
  const [reportOpen,          setReportOpen]          = useState(false);
  const [reviewDrawerOpen,    setReviewDrawerOpen]    = useState(false);
  const [reviewOrderId,       setReviewOrderId]       = useState<string | null>(null);
  const [notifStates,         setNotifStates]         = useState<Map<string, OrderNotifState | null>>(new Map());
  const [notifQueuedFilter,   setNotifQueuedFilter]   = useState(false);
  const [kpiActiveFilter,     setKpiActiveFilter]     = useState<KpiActiveFilter | null>(null);
  const [mainTab,             setMainTab]             = useState<"overview" | "requests">("overview");
  const [testForm,            setTestForm]            = useState<TestRequestForm>({
    msid: "MS-900005",
    patient: "Demo Patient",
    category: "Mask",
    item: "Mask cushion",
    amount: "85",
    note: "",
  });

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const real: Order[] = (data.orders ?? []).map((order: Partial<Order> & Pick<Order, "id" | "requestId" | "patient" | "msid" | "date" | "items" | "type">) =>
          normalizeOrder(order)
        );
        setOrders(real.length > 0 ? real : DEMO_REQUESTS);
      })
      .catch(() => { /* orders stays empty; EmptyState renders */ })
      .finally(() => setOrdersLoading(false));
  }, []);

  // Batch-fetch notification summaries for all real orders when the order list loads
  useEffect(() => {
    const toFetch = orders.filter((o) => !o.isDemo && !o.localOnly && !notifStates.has(o.id));
    if (toFetch.length === 0) return;
    Promise.allSettled(
      toFetch.map((order) =>
        fetch(`/api/admin/orders?notifRequest=${encodeURIComponent(order.requestId)}`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((data: unknown) => ({ orderId: order.id, data }))
          .catch(() => ({ orderId: order.id, data: null }))
      )
    ).then((results) => {
      setNotifStates((prev) => {
        const next = new Map(prev);
        for (const result of results) {
          if (result.status === "fulfilled") {
            const { orderId, data } = result.value as { orderId: string; data: Record<string, unknown> | null };
            const notif = data?.notification && typeof data.notification === "object"
              ? (data.notification as Record<string, unknown>)
              : null;
            if (notif && notif.delivery_status === "queued") {
              next.set(orderId, {
                ok:              true,
                scheduledFor:    typeof notif.scheduled_for   === "string" ? notif.scheduled_for   : undefined,
                supersededCount: typeof notif.supersededCount === "number" ? notif.supersededCount : undefined,
                triggerStatus:   typeof notif.trigger_status  === "string"
                  ? (TRIGGER_STATUS_DISPLAY[notif.trigger_status] ?? (notif.trigger_status as string))
                  : undefined,
              });
            } else {
              next.set(orderId, null);
            }
          }
        }
        return next;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Fetch persisted notification state when the review drawer opens for an order not already in local state
  const reviewOrderIdForNotif = reviewDrawerOpen ? reviewOrderId : null;
  useEffect(() => {
    if (!reviewOrderIdForNotif) return;
    const order = orders.find((o) => o.id === reviewOrderIdForNotif);
    if (!order || notifStates.has(order.id)) return;

    const requestId = order.requestId;
    fetch(`/api/admin/orders?notifRequest=${encodeURIComponent(requestId)}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: unknown) => {
        const payload = data as Record<string, unknown>;
        const notif = payload.notification && typeof payload.notification === 'object'
          ? payload.notification as Record<string, unknown>
          : null;
        setNotifStates((prev) => {
          const next = new Map(prev);
          if (notif && notif.delivery_status === 'queued') {
            next.set(order.id, {
              ok:              true,
              scheduledFor:    typeof notif.scheduled_for    === 'string' ? notif.scheduled_for    : undefined,
              supersededCount: typeof notif.supersededCount  === 'number' ? notif.supersededCount  : undefined,
              triggerStatus:   typeof notif.trigger_status   === 'string'
                ? (TRIGGER_STATUS_DISPLAY[notif.trigger_status] ?? notif.trigger_status as string)
                : undefined,
            });
          } else {
            next.set(order.id, null);
          }
          return next;
        });
      })
      .catch(() => {
        setNotifStates((prev) => {
          const next = new Map(prev);
          next.set(order.id, null);
          return next;
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewOrderIdForNotif]);

  const kpiCounts = useMemo(() => {
    const real    = orders.filter((o) => !isAdminRow(o));
    const visible = orders.filter((o) => showAdminRows || !isAdminRow(o));
    return {
      all:                    visible.length,
      New:                    real.filter((o) => o.status === "New").length,
      Reviewing:              real.filter((o) => o.status === "Reviewing").length,
      Approved:               real.filter((o) => o.status === "Approved").length,
      Sent:                   real.filter((o) => o.status === "Sent").length,
      Delivered:              real.filter((o) => o.status === "Delivered").length,
      Declined:               real.filter((o) => o.status === "Declined").length,
      "Needs Follow-Up":      real.filter((o) => o.status === "Needs Follow-Up").length,
      "Needs Funding Review": real.filter((o) => o.needsFundingReview).length,
    };
  }, [orders, showAdminRows]);

  const opKpiStats = useMemo(() => {
    const real = orders.filter((o) => !isAdminRow(o));
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth();
    function inCurrentMonth(s: string): boolean {
      const d = parseToDate(s);
      return d !== null && d.getFullYear() === cy && d.getMonth() === cm;
    }
    return {
      requestsThisMonth:  real.filter((o) => inCurrentMonth(o.date)).length,
      newRequests:        real.filter((o) => o.status === "New").length,
      needsFundingReview: real.filter((o) => Boolean(o.needsFundingReview)).length,
      deliveredThisMonth: real.filter((o) => o.status === "Delivered" && inCurrentMonth(o.date)).length,
      declinedThisMonth:  real.filter((o) => o.status === "Declined"  && inCurrentMonth(o.date)).length,
    };
  }, [orders]);

const reviewOrder = useMemo(
    () => (reviewOrderId ? orders.find((o) => o.id === reviewOrderId) ?? null : null),
    [orders, reviewOrderId]
  );

  const reportRows = useMemo(() => {
    let result = orders.filter(isReportableOrder);
    if (reportWindow !== "all") {
      const days = reportWindow === "7d" ? 7 : reportWindow === "30d" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((o) => {
        const d = parseToDate(o.date);
        return d !== null && d >= cutoff;
      });
    }
    result = result.filter((o) => reportStatusFilters.has(o.status));
    result = result.filter((o) => reportSourceFilters.has(getSourceKey(o.source)));
    return result;
  }, [orders, reportWindow, reportStatusFilters, reportSourceFilters]);

  const reportStats = useMemo(() => {
    const byStatus: Record<OrderStatus, number> = {
      New: 0, Reviewing: 0, Approved: 0, Sent: 0,
      Delivered: 0, Declined: 0, "Needs Follow-Up": 0,
    };
    for (const o of reportRows) {
      byStatus[o.status] = byStatus[o.status] + 1;
    }
    return {
      total:              reportRows.length,
      byStatus,
      portal:             reportRows.filter((o) => getSourceKey(o.source) === "patient_portal").length,
      support:            reportRows.filter((o) => getSourceKey(o.source) === "support_request").length,
      adminCreated:       reportRows.filter((o) => getSourceKey(o.source) === "admin_created").length,
      otherSource:        reportRows.filter((o) => getSourceKey(o.source) === "other").length,
      needsFundingReview: reportRows.filter((o) => o.needsFundingReview).length,
    };
  }, [reportRows]);

  const reportWindowLabel =
    reportWindow === "7d"  ? "Last 7 days"  :
    reportWindow === "30d" ? "Last 30 days" :
    reportWindow === "90d" ? "Last 90 days" : "All time";

  const reportWindowDescription =
    reportWindow === "all"
      ? "Includes all loaded request records."
      : `Includes requests created in the last ${reportWindow === "7d" ? 7 : reportWindow === "30d" ? 30 : 90} days.`;

  const includedReportStatuses =
    reportStatusFilters.size === STATUS_OPTIONS.length
      ? "All statuses"
      : STATUS_OPTIONS.filter((status) => reportStatusFilters.has(status)).join("; ") || "None";

  const includedReportSources =
    reportSourceFilters.size === REPORT_SOURCE_OPTIONS.length
      ? "All sources"
      : REPORT_SOURCE_OPTIONS.filter((source) => reportSourceFilters.has(source)).map((source) => REPORT_SOURCE_LABEL[source]).join("; ") || "None";

  function clearAllFilters() {
    setStatusFilters(new Set());
    setTypeFilters(new Set());
    setDateRange(null);
    setCustomDateFrom("");
    setCustomDateTo("");
    setSortOpt(null);
    setKpiActiveFilter(null);
    setNotifQueuedFilter(false);
  }

  function handleStatusTab(tab: StatusTab) {
    setStatusTab(tab);
    setStatusFilters(new Set());
    setKpiActiveFilter(null);
  }

  function handleKpiCardClick(filter: KpiActiveFilter) {
    if (kpiActiveFilter === filter) {
      setKpiActiveFilter(null);
    } else {
      setKpiActiveFilter(filter);
      setStatusTab("all");
      setStatusFilters(new Set());
    }
  }

  function applyOperationalFilters(baseOrders: Order[]): Order[] {
    let result = [...baseOrders];

    // KPI card filter takes priority; status tab is secondary; panel status filters are tertiary.
    if (kpiActiveFilter) {
      const now = new Date();
      const cy = now.getFullYear();
      const cm = now.getMonth();
      const inCurrentMonth = (s: string) => {
        const d = parseToDate(s);
        return d !== null && d.getFullYear() === cy && d.getMonth() === cm;
      };
      if (kpiActiveFilter === "requestsThisMonth") {
        result = result.filter((o) => inCurrentMonth(o.date));
      } else if (kpiActiveFilter === "newRequests") {
        result = result.filter((o) => o.status === "New");
      } else if (kpiActiveFilter === "needsFundingReview") {
        result = result.filter((o) => Boolean(o.needsFundingReview));
      } else if (kpiActiveFilter === "deliveredThisMonth") {
        result = result.filter((o) => o.status === "Delivered" && inCurrentMonth(o.date));
      } else if (kpiActiveFilter === "declinedThisMonth") {
        result = result.filter((o) => o.status === "Declined" && inCurrentMonth(o.date));
      }
    } else if (statusTab === "Needs Funding Review") {
      result = result.filter((o) => o.needsFundingReview);
    } else if (statusTab !== "all") {
      result = result.filter((o) => o.status === statusTab);
    } else if (statusFilters.size > 0) {
      result = result.filter((o) => statusFilters.has(o.status));
    }

    if (typeFilters.size > 0) {
      result = result.filter((o) => typeFilters.has(o.type));
    }

    if (dateRange) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekAgo  = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
      const customFrom = parseInputDate(customDateFrom);
      const customTo = parseInputDate(customDateTo);
      result = result.filter((o) => {
        const d = parseToDate(o.date);
        if (!d) return false;
        if (dateRange === "week")  return d >= weekAgo;
        if (dateRange === "month") return d >= monthAgo && d < weekAgo;
        if (dateRange === "custom") {
          if (customFrom && d < customFrom) return false;
          if (customTo && d > customTo) return false;
          return true;
        }
        return d < monthAgo;
      });
    }

    return result;
  }

  const visibleOrders = useMemo(() => {
    // KPI filter is based on real-data counts, so its table scope must match real rows only.
    const forceRealRows = Boolean(kpiActiveFilter);
    let result = applyOperationalFilters(
      orders.filter((o) => forceRealRows ? !isAdminRow(o) : showAdminRows || !isAdminRow(o))
    );

    if (notifQueuedFilter) {
      result = result.filter((o) => notifStates.get(o.id)?.ok === true);
    }

    if (sortOpt) {
      result.sort((a, b) => {
        if (sortOpt === "newest")  return parseDateForSort(b.date) - parseDateForSort(a.date);
        if (sortOpt === "oldest")  return parseDateForSort(a.date) - parseDateForSort(b.date);
        if (sortOpt === "name_az") return a.patient.localeCompare(b.patient);
        if (sortOpt === "status")  return a.status.localeCompare(b.status);
        return 0;
      });
    } else {
      // Default: real rows before admin rows, then newest first within each group
      result.sort((a, b) => {
        const aAdmin = isAdminRow(a);
        const bAdmin = isAdminRow(b);
        if (aAdmin !== bAdmin) return aAdmin ? 1 : -1;
        return parseDateForSort(b.date) - parseDateForSort(a.date);
      });
    }

    return result;
  }, [orders, statusTab, statusFilters, typeFilters, dateRange, customDateFrom, customDateTo, sortOpt, showAdminRows, kpiActiveFilter, notifQueuedFilter, notifStates]);

  const activeFilterCount = statusFilters.size + typeFilters.size + (dateRange ? 1 : 0) + (sortOpt ? 1 : 0) + (kpiActiveFilter ? 1 : 0) + (notifQueuedFilter ? 1 : 0);

  const kpiChipLabel: Record<KpiActiveFilter, string> = {
    requestsThisMonth:  "This month",
    newRequests:        "New requests",
    needsFundingReview: "Funding check required",
    deliveredThisMonth: "Delivered · this month",
    declinedThisMonth:  "Declined · this month",
  };
  const customDateFromValue = parseInputDate(customDateFrom);
  const customDateToValue = parseInputDate(customDateTo);
  const dateChipLabel =
    dateRange === "custom"
      ? customDateFromValue && customDateToValue
        ? `Date: ${formatChartDate(customDateFromValue)} - ${formatChartDate(customDateToValue)}`
        : customDateFromValue
          ? `Date: From ${formatChartDate(customDateFromValue)}`
          : customDateToValue
            ? `Date: Until ${formatChartDate(customDateToValue)}`
            : "Date: Custom range"
      : dateRange === "week"
        ? "This week"
        : dateRange === "month"
          ? "This month"
          : "Older";

  const filterChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(notifQueuedFilter ? [{ key: "notifQueued", label: "Communication queued", onRemove: () => setNotifQueuedFilter(false) }] : []),
    ...(kpiActiveFilter ? [{ key: "kpi", label: kpiChipLabel[kpiActiveFilter], onRemove: () => setKpiActiveFilter(null) }] : []),
    ...[...statusFilters].map((s) => ({
      key: `s-${s}`,
      label: s,
      onRemove: () => { const n = new Set(statusFilters); n.delete(s); setStatusFilters(n); },
    })),
    ...[...typeFilters].map((t) => ({
      key: `t-${t}`,
      label: TYPE_LABEL[t],
      onRemove: () => { const n = new Set(typeFilters); n.delete(t); setTypeFilters(n); },
    })),
    ...(dateRange ? [{
      key: "date",
      label: dateChipLabel,
      onRemove: () => {
        setDateRange(null);
        setCustomDateFrom("");
        setCustomDateTo("");
      },
    }] : []),
    ...(sortOpt ? [{
      key: "sort",
      label: `Sort: ${sortOpt === "newest" ? "Newest" : sortOpt === "oldest" ? "Oldest" : sortOpt === "name_az" ? "Name A–Z" : "Status"}`,
      onRemove: () => setSortOpt(null),
    }] : []),
  ];

  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((o) => selected.has(o.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleOrders.forEach((o) => next.delete(o.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleOrders.forEach((o) => next.add(o.id));
        return next;
      });
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedVisible = visibleOrders.filter((o) => selected.has(o.id));

  function handleApproveSelected() {
    setOrders((prev) =>
      prev.map((o) => (selected.has(o.id) ? { ...o, status: "Approved", updatedDate: formatToday(), localOnly: o.localOnly ?? true } : o))
    );
    setSelected(new Set());
  }

  const DB_STATUS: Record<string, string> = {
    New:              'new',
    Reviewing:        'reviewing',
    Approved:         'approved',
    Sent:             'sent',
    Delivered:        'delivered',
    Declined:         'declined',
    'Needs Follow-Up': 'needs_followup',
  };

  async function handleFundingReviewToggle(order: Order) {
    const newFlag = !order.needsFundingReview;
    if (order.isDemo || order.localOnly) {
      setOrders((prev) =>
        prev.map((o) => o.id === order.id ? { ...o, needsFundingReview: newFlag, updatedDate: formatToday() } : o)
      );
      return;
    }
    setFundingReviewLoading((prev) => new Set(prev).add(order.id));
    setStatusError(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, needsFundingReview: newFlag }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOrders((prev) =>
        prev.map((o) => o.id === order.id ? { ...o, needsFundingReview: newFlag, updatedDate: formatToday() } : o)
      );
    } catch {
      setStatusError(`Failed to update funding review flag for ${order.requestId}.`);
    } finally {
      setFundingReviewLoading((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  }

  async function handleStatusChange(order: Order, status: OrderStatus) {
    // Demo / local-only rows: local mutation only
    if (order.isDemo || order.localOnly) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status, updatedDate: formatToday() } : o))
      );
      return;
    }

    setStatusLoading((prev) => new Set(prev).add(order.id));
    setStatusError(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: DB_STATUS[status] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status, updatedDate: formatToday() } : o))
      );
      const nq = data.notificationQueue && typeof data.notificationQueue === 'object'
        ? data.notificationQueue as Record<string, unknown>
        : null;
      setNotifStates((prev) => {
        const next = new Map(prev);
        if (nq !== null) {
          next.set(order.id, {
            ok:              nq.ok === true,
            scheduledFor:    typeof nq.scheduledFor === 'string'    ? nq.scheduledFor    : undefined,
            notificationId:  typeof nq.notificationId === 'string'  ? nq.notificationId  : undefined,
            supersededCount: typeof nq.supersededCount === 'number' ? nq.supersededCount : undefined,
            reason:          typeof nq.reason === 'string'          ? nq.reason          : undefined,
            triggerStatus:   status,
          });
        } else {
          // Non-trigger status or no notification queued — mark explicitly as null (not unknown)
          next.set(order.id, null);
        }
        return next;
      });
    } catch {
      setStatusError(`Failed to update status for ${order.requestId}.`);
    } finally {
      setStatusLoading((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  }

  function handleReviewRequest(order: Order) {
    setReviewOrderId(order.id);
    setReviewDrawerOpen(true);
  }

  function handleReviewToPatient(order: Order) {
    setReviewDrawerOpen(false);
    setDrawerMsid(order.msid);
    setDrawerName(order.patient);
    setDrawerOpen(true);
  }

  function handleCreateTestRequest() {
    const amount = Math.max(0, Number(testForm.amount) || 0);
    const estimate = calculateEstimate(amount);
    const now = formatToday();
    const id = `local-${Date.now()}`;
    const msid = testForm.msid.trim() || "MS-LOCAL";
    const request: Order = {
      id,
      requestId: `REQ-LOCAL-${String(Date.now()).slice(-6)}`,
      patient: testForm.patient.trim() || "Demo Patient",
      msid,
      date: now,
      updatedDate: now,
      items: testForm.item.trim() || testForm.category,
      category: testForm.category,
      type: testForm.category === "Support request" ? "PRIVATE" : "ENTITLEMENT",
      status: "New",
      source: "admin_created",
      estimatedItemAmount: amount,
      ...estimate,
      adminNote: testForm.note.trim() || undefined,
      isDemo: true,
      localOnly: true,
    };
    setOrders((prev) => [request, ...prev]);
    setStatusTab("New");
    setStatusFilters(new Set());
    setTestForm((prev) => ({
      ...prev,
      item: "",
      amount: "85",
      note: "",
    }));
  }

  const isFiltered = activeFilterCount > 0 || !!kpiActiveFilter;

  const attentionOrders = useMemo(() => {
    const real = orders.filter((o) => !isAdminRow(o));
    const urgent = real.filter((o) => o.status === "New" || o.status === "Needs Follow-Up" || o.status === "Reviewing");
    return urgent
      .slice()
      .sort((a, b) => parseDateForSort(b.date) - parseDateForSort(a.date))
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="rounded-2xl border border-sand bg-white px-6 py-6 shadow-sm md:px-7">
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-[#EFF5F4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-deep-teal">
              Patient operations
            </p>
            <div>
              <h1 className="text-4xl font-bold leading-tight text-navy">Patient Requests</h1>
              <p className="mt-2 max-w-2xl text-base leading-6 text-gray-600">Supply request worklist for staff review and tracking.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedVisible.length > 0 && (
              <button
                type="button"
                onClick={handleApproveSelected}
                className="bg-[#0B5C6C] text-white text-base font-medium px-5 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors shadow-sm"
              >
                Approve selected ({selectedVisible.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadCsv(visibleOrders, notifStates)}
              title={`Export ${visibleOrders.length} row${visibleOrders.length === 1 ? "" : "s"} — respects active tab, filters, and sort order`}
              className="flex items-center gap-2 px-4 py-2.5 border border-sand rounded-lg text-base font-medium
                         bg-white text-gray-700 hover:border-[#0B5C6C] hover:bg-[#F5F3EE] min-h-[44px] whitespace-nowrap transition-colors"
            >
              Export current view ({visibleOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-sand rounded-lg text-base font-medium
                         bg-white text-gray-700 hover:border-[#0B5C6C] hover:bg-[#F5F3EE] min-h-[44px] whitespace-nowrap transition-colors"
            >
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Status update error */}
      {statusError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-800">{statusError}</p>
          <button type="button" onClick={() => setStatusError(null)} className="text-red-600 hover:text-red-800 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Operational KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            { key: "requestsThisMonth"  as KpiActiveFilter, label: "Requests this month",   count: opKpiStats.requestsThisMonth,  dot: "bg-gray-400",       countCls: "text-gray-900",   sub: null },
            { key: "newRequests"        as KpiActiveFilter, label: "New requests",           count: opKpiStats.newRequests,        dot: "bg-[#0B5C6C]",      countCls: "text-[#0B5C6C]",  sub: null },
            { key: "needsFundingReview" as KpiActiveFilter, label: "Funding check required", count: opKpiStats.needsFundingReview, dot: "bg-amber-400",      countCls: opKpiStats.needsFundingReview > 0 ? "text-amber-700" : "text-gray-900", sub: opKpiStats.needsFundingReview > 0 ? "Requires staff check" : null },
            { key: "deliveredThisMonth" as KpiActiveFilter, label: "Delivered requests",     count: opKpiStats.deliveredThisMonth, dot: "bg-emerald-500",    countCls: "text-emerald-700", sub: "Created this month" },
            { key: "declinedThisMonth"  as KpiActiveFilter, label: "Declined requests",      count: opKpiStats.declinedThisMonth,  dot: "bg-rose-400",       countCls: opKpiStats.declinedThisMonth > 0 ? "text-rose-700" : "text-gray-900", sub: "Created this month" },
          ] as const
        ).map(({ key, label, count, dot, countCls, sub }) => {
          const isActive = kpiActiveFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKpiCardClick(key)}
              className={cn(
                "bg-white rounded-xl px-5 py-4 text-left transition-all shadow-sm min-h-[126px]",
                isActive
                  ? "border-2 border-[#0B5C6C] ring-1 ring-[#0B5C6C]/20"
                  : "border border-sand hover:border-[#0B5C6C]/40 hover:shadow-md"
              )}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
                {label}
                {isActive && <span className="ml-auto text-[10px] font-semibold text-[#0B5C6C] bg-[#0B5C6C]/10 px-1.5 py-0.5 rounded">Active</span>}
              </p>
              <p className={cn("text-3xl font-bold mt-1.5", countCls)}>{count}</p>
              {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
            </button>
          );
        })}
      </div>

      {/* Overview / Requests tab switcher */}
      <div className="rounded-xl border border-sand bg-white p-1 shadow-sm">
        <div className="flex gap-1">
          {(["overview", "requests"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMainTab(tab)}
              className={cn(
                "rounded-lg px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap",
                mainTab === tab
                  ? "bg-[#EFF5F4] text-[#0B5C6C]"
                  : "text-gray-500 hover:bg-[#F5F3EE] hover:text-gray-700"
              )}
            >
              {tab === "overview" ? "Overview" : `Requests (${kpiCounts.all})`}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {mainTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {([
              { label: "Needs staff review",    count: kpiCounts["New"],                 dot: "bg-amber-400",   countCls: kpiCounts["New"] > 0 ? "text-amber-700" : "text-gray-900",     sub: "Status: New" },
              { label: "Needs follow-up",        count: kpiCounts["Needs Follow-Up"],     dot: "bg-orange-400",  countCls: kpiCounts["Needs Follow-Up"] > 0 ? "text-orange-700" : "text-gray-900", sub: "Awaiting staff action" },
              { label: "Funding check required", count: kpiCounts["Needs Funding Review"], dot: "bg-amber-400",  countCls: kpiCounts["Needs Funding Review"] > 0 ? "text-amber-700" : "text-gray-900", sub: "Flagged for review" },
              {
                label: "Communication queued",
                count: orders.filter((o) => !isAdminRow(o) && notifStates.get(o.id)?.ok === true).length,
                dot: "bg-[#74C0A2]",
                countCls: "text-[#0B5C6C]",
                sub: "Patient message pending",
              },
              { label: "Sent / on the way",      count: kpiCounts["Sent"],               dot: "bg-purple-400",  countCls: "text-purple-700", sub: null },
              { label: "Delivered",              count: kpiCounts["Delivered"],           dot: "bg-emerald-500", countCls: "text-emerald-700", sub: null },
            ] as const).map(({ label, count, dot, countCls, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-sand px-5 py-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
                  {label}
                </p>
                <p className={cn("text-3xl font-bold mt-1.5", countCls)}>{count}</p>
                {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
              </div>
            ))}
          </div>

          <div className="bg-white border border-sand rounded-xl overflow-hidden shadow-sm">
            <div className="border-b border-sand bg-[#F5F3EE] px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Needs attention</h2>
                <p className="text-xs text-gray-500 mt-0.5">New, reviewing, and follow-up — real requests only</p>
              </div>
              <button
                type="button"
                onClick={() => setMainTab("requests")}
                className="text-sm font-medium text-[#0B5C6C] hover:underline whitespace-nowrap shrink-0"
              >
                View all in Requests →
              </button>
            </div>
            {attentionOrders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">No requests currently need attention.</p>
            ) : (
              <div className="divide-y divide-sand/60">
                {attentionOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F5F3EE] transition-colors">
                    <button
                      type="button"
                      onClick={() => handleReviewRequest(order)}
                      className="font-mono text-sm font-semibold text-[#0B5C6C] hover:underline whitespace-nowrap text-left"
                    >
                      {order.requestId}
                    </button>
                    <span className="text-sm font-medium text-navy flex-1 min-w-0 truncate">{order.patient}</span>
                    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap", STATUS_BADGE[order.status])}>{order.status}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{order.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests tab */}
      {mainTab === "requests" && (
        <>

      {/* Status tabs — worklist filter */}
      <div className="overflow-x-auto rounded-xl border border-sand bg-white shadow-sm">
        <div className="flex items-center gap-1 min-w-max p-1">
          {STATUS_TABS.map(({ key, label }) => {
            const count = kpiCounts[key as keyof typeof kpiCounts] ?? 0;
            const isActive = statusTab === key;
            let countNode: React.ReactNode;
            if (key === "Needs Funding Review" && count > 0) {
              countNode = <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">{count}</span>;
            } else if (key === "Declined" && count > 0) {
              countNode = <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700">{count}</span>;
            } else if (key === "Delivered" && count > 0) {
              countNode = <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">{count}</span>;
            } else {
              countNode = <span className="ml-1 text-xs font-medium opacity-60">({count})</span>;
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleStatusTab(key)}
                className={cn(
                  "rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-[#EFF5F4] text-[#0B5C6C]"
                    : "text-gray-500 hover:bg-[#F5F3EE] hover:text-gray-700"
                )}
              >
                {label}{countNode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar: filter/sort + admin toggle + active filter chips */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sand bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-sand rounded-lg text-sm font-medium bg-white text-gray-700 hover:border-[#0B5C6C] hover:bg-[#F5F3EE] min-h-[40px] whitespace-nowrap transition-colors"
        >
          Filter &amp; Sort
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-[#0B5C6C] text-white text-xs font-semibold px-2 py-0.5 min-w-[22px]">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowAdminRows((v) => !v)}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors",
            showAdminRows
              ? "border-[#0B5C6C] bg-[#0B5C6C]/10 text-[#0B5C6C]"
              : "border-sand bg-white text-gray-500 hover:border-gray-300 hover:bg-[#F5F3EE]"
          )}
        >
          {showAdminRows ? "Hide test rows" : "Show test rows"}
        </button>
        <button
          type="button"
          onClick={() => setNotifQueuedFilter((v) => !v)}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors",
            notifQueuedFilter
              ? "border-[#74C0A2] bg-[#74C0A2]/10 text-[#0B5C6C]"
              : "border-sand bg-white text-gray-500 hover:border-gray-300 hover:bg-[#F5F3EE]"
          )}
        >
          Communication queued
        </button>
        {filterChips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1.5 bg-[#0B5C6C]/10 text-[#0B5C6C] text-sm font-medium px-3 py-1.5 rounded-full"
          >
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label} filter`}
              className="hover:text-[#0B5C6C]/60 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {filterChips.length > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline px-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-sand rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-sand bg-[#F5F3EE] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Request list</h2>
            <p className="mt-0.5 text-xs text-gray-500">Filtered worklist using currently loaded request data.</p>
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 border border-sand">
            {visibleOrders.length} visible
          </p>
        </div>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-16 text-base text-gray-500">
            Loading requests…
          </div>
        ) : visibleOrders.length === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-[#F5F3EE] border-b border-sand">
                  <th className="px-3 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded accent-[#0B5C6C] cursor-pointer"
                      aria-label="Select all"
                    />
                  </th>
                  {["REF", "PATIENT", "ITEMS", "FUNDING", "SOURCE", "STATUS", "CREATED", "ACTION"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/60">
                {visibleOrders.map((order) => {
                  const isSelected = selected.has(order.id);
                  const hasNotif = notifStates.get(order.id)?.ok === true;
                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        "transition-colors",
                        isSelected ? "bg-[#EFF5F4]"
                        : hasNotif ? "bg-[#74C0A2]/5 hover:bg-[#74C0A2]/10"
                        : "hover:bg-[#F5F3EE]"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(order.id)}
                          className="h-4 w-4 rounded accent-[#0B5C6C] cursor-pointer"
                          aria-label={`Select ${order.patient}`}
                        />
                      </td>
                      {/* REF */}
                      <td className={cn("px-3 py-3", hasNotif && "border-l-2 border-l-[#74C0A2] pl-2")}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.needsFundingReview && (
                            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                              Funding check
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleReviewRequest(order)}
                            aria-label={`Review request ${order.requestId}`}
                            className={cn(
                              "font-mono text-sm text-[#0B5C6C] hover:underline whitespace-nowrap text-left",
                              hasNotif ? "font-bold" : "font-semibold"
                            )}
                          >
                            {order.requestId}
                          </button>
                          {order.isDemo && (
                            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide whitespace-nowrap">
                              Demo
                            </span>
                          )}
                        </div>
                        {hasNotif && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#74C0A2]/40 bg-[#74C0A2]/20 px-2 py-0.5 text-xs font-semibold text-[#0B5C6C] whitespace-nowrap">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B5C6C]/50" />
                              Patient communication queued
                            </span>
                            {(notifStates.get(order.id)?.supersededCount ?? 0) > 0 && (
                              <span className="inline-flex w-fit items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 whitespace-nowrap">
                                Previous communication superseded
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-0.5 text-xs font-mono text-gray-400">{order.msid}</div>
                      </td>
                      {/* PATIENT */}
                      <td className="px-3 py-3">
                        <span className="text-base font-semibold text-navy whitespace-nowrap">{order.patient}</span>
                        {order.portalAccountStatus === "linked" && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              Portal linked
                            </span>
                          </div>
                        )}
                        {order.portalAccountStatus === "no_account" && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200 whitespace-nowrap">
                              No portal account
                            </span>
                          </div>
                        )}
                        {order.portalAccountStatus === "unknown" && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
                              Portal unknown
                            </span>
                          </div>
                        )}
                      </td>
                      {/* ITEMS */}
                      <td className="px-3 py-3 max-w-[180px]">
                        <span className="text-sm text-gray-700 line-clamp-2">
                          {order.items || order.itemDescription || "—"}
                        </span>
                      </td>
                      {/* FUNDING */}
                      <td className="px-3 py-3">
                        {order.estimatedFundedAmount !== null || order.estimatedItemAmount !== null ? (
                          <div className="space-y-0.5 text-xs whitespace-nowrap">
                            {order.estimatedFundedAmount !== null && (
                              <div className="font-semibold text-emerald-700">{formatEstimate(order.estimatedFundedAmount)} funded</div>
                            )}
                            {order.estimatedPatientCopay !== null && order.estimatedPatientCopay > 0 && (
                              <div className="text-gray-600">{formatEstimate(order.estimatedPatientCopay)} co-pay</div>
                            )}
                            {order.estimatedItemAmount !== null && (
                              <div className="text-gray-400">Est {formatEstimate(order.estimatedItemAmount)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* SOURCE */}
                      <td className="px-3 py-3">
                        <SourceBadge source={order.source} />
                      </td>
                      {/* STATUS */}
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                            disabled={statusLoading.has(order.id)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 disabled:opacity-60 ${STATUS_BADGE[order.status]}`}
                            aria-label={`Change status for ${order.requestId}`}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          {statusLoading.has(order.id) && (
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Saving…</p>
                          )}
                          {(order.isDemo || order.localOnly) && !statusLoading.has(order.id) && (
                            <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600">Local-only</p>
                          )}
                          {!statusLoading.has(order.id) && (
                            <p className="text-[10px] text-gray-400 leading-4">{STATUS_QUEUE_COPY[order.status]}</p>
                          )}
                        </div>
                      </td>
                      {/* CREATED */}
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-700 whitespace-nowrap">{order.date}</span>
                      </td>
                      {/* ACTION */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleReviewRequest(order)}
                            className="border border-[#0B5C6C] text-[#0B5C6C] text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
                          >
                            Review request
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFundingReviewToggle(order)}
                            disabled={fundingReviewLoading.has(order.id)}
                            title={order.needsFundingReview ? "Clear funding review flag" : "Flag for funding review"}
                            className={cn(
                              "text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] border transition-colors whitespace-nowrap disabled:opacity-60",
                              order.needsFundingReview
                                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                            )}
                          >
                            {fundingReviewLoading.has(order.id) ? "…" : order.needsFundingReview ? "Clear funding check" : "Flag: funding check"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Developer tools (collapsed by default) */}
      <div className="rounded-xl border border-sand overflow-hidden bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setDevToolsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 bg-[#F5F3EE] hover:bg-sand-pale text-sm font-medium text-gray-500 transition-colors"
        >
          <span>Developer tools</span>
          <svg
            className={cn("h-4 w-4 text-gray-400 transition-transform", devToolsOpen && "rotate-180")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {devToolsOpen && (
          <div className="border-t border-gray-200 p-5 space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Estimates only.</span> No entitlement is deducted, no payment is taken,
                and no inventory is reserved in Phase 2. Checkout, payment, inventory reservation, fulfilment,
                and automatic entitlement deduction are Phase 3.
              </p>
            </div>
            {orders.some((o) => o.isDemo) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Demo request data.</span> No real patient requests have
                  been received yet. These rows show what staff request tracking will look like.
                </p>
              </div>
            )}
            <CreateTestRequestPanel
              form={testForm}
              onChange={(patch) => setTestForm((prev) => ({ ...prev, ...patch }))}
              onCreate={handleCreateTestRequest}
            />
          </div>
        )}
      </div>
        </>
      )}

      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        statusFilters={statusFilters}
        setStatusFilters={setStatusFilters}
        typeFilters={typeFilters}
        setTypeFilters={setTypeFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        customDateFrom={customDateFrom}
        setCustomDateFrom={setCustomDateFrom}
        customDateTo={customDateTo}
        setCustomDateTo={setCustomDateTo}
        sortOpt={sortOpt}
        setSortOpt={setSortOpt}
        resultCount={visibleOrders.length}
        onClearAll={clearAllFilters}
      />

      <ReportDrawer
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportWindow={reportWindow}
        setReportWindow={setReportWindow}
        selectedStatuses={reportStatusFilters}
        setSelectedStatuses={setReportStatusFilters}
        selectedSources={reportSourceFilters}
        setSelectedSources={setReportSourceFilters}
        stats={reportStats}
        windowLabel={reportWindowLabel}
        windowDescription={reportWindowDescription}
        includedStatuses={includedReportStatuses}
        includedSources={includedReportSources}
        onGenerateReport={() => downloadReportCsv({
          windowLabel:        reportWindowLabel,
          generatedAt:        new Date().toISOString(),
          includedStatuses:   includedReportStatuses,
          includedSources:    includedReportSources,
          stats:              reportStats,
        })}
        onDownloadList={() => downloadReportRequestListCsv(reportRows)}
        matchingCount={reportRows.length}
      />

      <RequestReviewDrawer
        isOpen={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
        order={reviewOrder}
        statusLoading={statusLoading}
        fundingReviewLoading={fundingReviewLoading}
        onStatusChange={handleStatusChange}
        onFundingReviewToggle={handleFundingReviewToggle}
        onViewPatient={() => reviewOrder && handleReviewToPatient(reviewOrder)}
        notifState={
          reviewOrder
            ? (notifStates.has(reviewOrder.id) ? notifStates.get(reviewOrder.id) : undefined)
            : undefined
        }
      />

      <PatientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        msid={drawerMsid}
        patientName={drawerName}
      />
    </div>
  );
}
