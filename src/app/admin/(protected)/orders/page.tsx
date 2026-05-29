"use client";

import { useState, useMemo, useEffect } from "react";
import { PatientDrawer } from "@/components/admin/PatientDrawer";
import { cn } from "@/lib/utils";

type OrderStatus   = "New" | "Reviewing" | "Approved" | "Sent" | "Delivered" | "Declined" | "Needs Follow-Up";
type KpiFilter     = OrderStatus | "Needs Funding Review" | null;
type OrderType     = "ENTITLEMENT" | "PRIVATE" | "MIXED";
type DateRange     = "week" | "month" | "older";
type ViewTab       = "active" | "completed" | "all";
type OrderSortOpt  = "newest" | "oldest" | "name_az" | "status";
type RequestCategory = "Mask" | "Headgear" | "Filters" | "Tubing" | "Cleaning supplies" | "Support request";

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
  adminNote?: string;
  isDemo?: boolean;
  localOnly?: boolean;
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

const DEFAULT_ANNUAL_ALLOWANCE = 250;

const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

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

const ACTIVE_TAB_STATUSES    = new Set<OrderStatus>(["New", "Reviewing", "Approved", "Sent", "Needs Follow-Up"]);
const COMPLETED_TAB_STATUSES = new Set<OrderStatus>(["Delivered", "Declined"]);
const TAB_STATUS_GROUPS: Record<ViewTab, Set<OrderStatus> | null> = {
  active: ACTIVE_TAB_STATUSES,
  completed: COMPLETED_TAB_STATUSES,
  all: null,
};

function isOrderInTab(order: Order, tab: ViewTab): boolean {
  const statuses = TAB_STATUS_GROUPS[tab];
  return statuses ? statuses.has(order.status) : true;
}

function getTabForKpiFilter(filter: KpiFilter): ViewTab | null {
  if (!filter) return null;
  if (filter === "Declined") return "completed";
  if (filter === "Needs Funding Review") return "all";
  return "active";
}

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
          <p className="text-base font-medium text-gray-600">{resultCount} orders found</p>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0B5C6C] text-white text-base font-medium px-6 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
          >
            Show orders
          </button>
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
        {filtered ? "No orders match the current filters." : "No orders here yet."}
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
  const [kpiFilter,           setKpiFilter]           = useState<KpiFilter>(null);
  const [selected,            setSelected]            = useState<Set<string>>(new Set());
  const [drawerOpen,          setDrawerOpen]          = useState(false);
  const [drawerMsid,          setDrawerMsid]          = useState<string | null>(null);
  const [drawerName,          setDrawerName]          = useState<string | undefined>(undefined);
  const [filterOpen,          setFilterOpen]          = useState(false);
  const [statusFilters,       setStatusFilters]       = useState<Set<OrderStatus>>(new Set());
  const [typeFilters,         setTypeFilters]         = useState<Set<OrderType>>(new Set());
  const [dateRange,           setDateRange]           = useState<DateRange | null>(null);
  const [sortOpt,             setSortOpt]             = useState<OrderSortOpt | null>(null);
  const [statusLoading,       setStatusLoading]       = useState<Set<string>>(new Set());
  const [fundingReviewLoading, setFundingReviewLoading] = useState<Set<string>>(new Set());
  const [statusError,         setStatusError]         = useState<string | null>(null);
  const [showAdminRows,       setShowAdminRows]       = useState(false);
  const [viewTab,             setViewTab]             = useState<ViewTab>("active");
  const [devToolsOpen,        setDevToolsOpen]        = useState(false);
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

  const kpiCounts = useMemo(() => {
    const real = orders.filter((o) => !isAdminRow(o));
    return {
      New:                 real.filter((o) => o.status === "New").length,
      Reviewing:           real.filter((o) => o.status === "Reviewing").length,
      Approved:            real.filter((o) => o.status === "Approved").length,
      Sent:                real.filter((o) => o.status === "Sent").length,
      Declined:            real.filter((o) => o.status === "Declined").length,
      "Needs Follow-Up":   real.filter((o) => o.status === "Needs Follow-Up").length,
      "Needs Funding Review": real.filter((o) => o.needsFundingReview).length,
    };
  }, [orders]);

  const tabCounts = useMemo(() => {
    const rows = orders.filter((o) => showAdminRows || !isAdminRow(o));
    return {
      active: rows.filter((o) => isOrderInTab(o, "active")).length,
      completed: rows.filter((o) => isOrderInTab(o, "completed")).length,
      all: rows.length,
    };
  }, [orders, showAdminRows]);

  function clearAllFilters() {
    setStatusFilters(new Set());
    setTypeFilters(new Set());
    setDateRange(null);
    setSortOpt(null);
  }

  function handleTabChange(tab: ViewTab) {
    setViewTab(tab);
    setKpiFilter(null);
    setStatusFilters(new Set());
  }

  function handleKpiClick(filter: KpiFilter, isActive: boolean) {
    if (isActive) {
      setKpiFilter(null);
      return;
    }
    const targetTab = getTabForKpiFilter(filter);
    if (targetTab) setViewTab(targetTab);
    setStatusFilters(new Set());
    setKpiFilter(filter);
  }

  const visibleOrders = useMemo(() => {
    // Apply admin/test row visibility
    let result = orders.filter((o) => showAdminRows || !isAdminRow(o));

    // Tab pre-filter
    result = result.filter((o) => isOrderInTab(o, viewTab));

    // KPI card filter takes priority; panel status filters are secondary
    if (kpiFilter === "Needs Funding Review") {
      result = result.filter((o) => o.needsFundingReview);
    } else if (kpiFilter) {
      result = result.filter((o) => o.status === kpiFilter);
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
      result = result.filter((o) => {
        const d = parseToDate(o.date);
        if (!d) return false;
        if (dateRange === "week")  return d >= weekAgo;
        if (dateRange === "month") return d >= monthAgo && d < weekAgo;
        return d < monthAgo;
      });
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
  }, [orders, kpiFilter, statusFilters, typeFilters, dateRange, sortOpt, showAdminRows, viewTab]);

  const activeFilterCount =
    (kpiFilter ? 1 : 0) + statusFilters.size + typeFilters.size + (dateRange ? 1 : 0) + (sortOpt ? 1 : 0);

  const filterChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(kpiFilter ? [{
      key: "kpi",
      label: kpiFilter,
      onRemove: () => setKpiFilter(null),
    }] : []),
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
      label: dateRange === "week" ? "This week" : dateRange === "month" ? "This month" : "Older",
      onRemove: () => setDateRange(null),
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
      if (!res.ok) throw new Error(await res.text());
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status, updatedDate: formatToday() } : o))
      );
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

  function handleViewPatient(order: Order) {
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
    setViewTab("active");
    setKpiFilter("New");
    setStatusFilters(new Set());
    setTestForm((prev) => ({
      ...prev,
      item: "",
      amount: "85",
      note: "",
    }));
  }

  const isFiltered = activeFilterCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
            Patient operations
          </p>
          <h1 className="text-3xl font-bold text-navy">Patient Requests</h1>
          <p className="text-base leading-6 text-gray-600">Supply request worklist for staff review and tracking.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedVisible.length > 0 && (
            <button
              type="button"
              onClick={handleApproveSelected}
              className="bg-[#0B5C6C] text-white text-base font-medium px-5 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
            >
              Approve selected ({selectedVisible.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-base font-medium
                       bg-white text-gray-700 hover:border-[#0B5C6C] min-h-[44px] whitespace-nowrap transition-colors"
          >
            Filter &amp; Sort
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-[#0B5C6C] text-white
                               text-xs font-semibold px-2 py-0.5 min-w-[22px]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status update error */}
      {statusError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-800">{statusError}</p>
          <button type="button" onClick={() => setStatusError(null)} className="text-red-600 hover:text-red-800 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* View tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200">
        {(["active", "completed", "all"] as ViewTab[]).map((tab) => {
          const label = tab === "active" ? "Active" : tab === "completed" ? "Completed" : "All";
          const isActive = viewTab === tab;
          const count = tabCounts[tab];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={cn(
                "px-5 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors",
                isActive
                  ? "border-[#0B5C6C] text-[#0B5C6C]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {label} <span className="ml-1 text-xs font-medium opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* KPI cards */}
      {(() => {
        type KpiCard = { key: KpiFilter; label: string; amber?: boolean };
        const KPI_CARDS: KpiCard[] = [
          { key: "New",                  label: "New",                  amber: true },
          { key: "Reviewing",            label: "Reviewing" },
          { key: "Approved",             label: "Approved" },
          { key: "Sent",                 label: "Sent" },
          { key: "Declined",             label: "Declined" },
          { key: "Needs Follow-Up",      label: "Needs Follow-Up",      amber: true },
          { key: "Needs Funding Review", label: "Needs Funding Review", amber: true },
        ];
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {KPI_CARDS.map(({ key, label, amber }) => {
              const count = key ? kpiCounts[key as keyof typeof kpiCounts] ?? 0 : 0;
              const isActive = kpiFilter === key;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleKpiClick(key, isActive)}
                  className={cn(
                    "relative flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors",
                    isActive
                      ? "bg-[#0B5C6C] border-[#0B5C6C] text-white shadow-sm"
                      : "bg-white border-sand text-charcoal hover:border-[#0B5C6C]/40"
                  )}
                >
                  {amber && count > 0 && !isActive && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400" />
                  )}
                  <span className={cn("text-2xl font-bold leading-none mb-1", isActive ? "text-white" : "text-navy")}>
                    {count}
                  </span>
                  <span className={cn("text-xs font-medium leading-tight", isActive ? "text-white/80" : "text-charcoal/70")}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Toolbar: admin toggle + active filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdminRows((v) => !v)}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors",
            showAdminRows
              ? "border-[#0B5C6C] bg-[#0B5C6C]/10 text-[#0B5C6C]"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
          )}
        >
          {showAdminRows ? "Hide test rows" : "Show test rows"}
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-gray-800">Request list</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review patient requests and open the patient drawer for context.
          </p>
        </div>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-16 text-base text-gray-500">
            Loading orders…
          </div>
        ) : visibleOrders.length === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
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
              <tbody className="divide-y divide-gray-100">
                {visibleOrders.map((order) => {
                  const isSelected = selected.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${isSelected ? "bg-teal-50" : "hover:bg-gray-50"}`}
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
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.needsFundingReview && (
                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" title="Needs funding review" />
                          )}
                          <span className="font-mono text-sm font-semibold text-gray-800 whitespace-nowrap">{order.requestId}</span>
                          {order.isDemo && (
                            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide whitespace-nowrap">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs font-mono text-gray-400">{order.msid}</div>
                      </td>
                      {/* PATIENT */}
                      <td className="px-3 py-3">
                        <span className="text-base font-semibold text-navy whitespace-nowrap">{order.patient}</span>
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
                            onClick={() => handleViewPatient(order)}
                            className="border border-[#0B5C6C] text-[#0B5C6C] text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
                          >
                            View patient
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
                            {fundingReviewLoading.has(order.id) ? "…" : order.needsFundingReview ? "Unflag" : "Flag funding"}
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
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setDevToolsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-500 transition-colors"
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

      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        statusFilters={statusFilters}
        setStatusFilters={setStatusFilters}
        typeFilters={typeFilters}
        setTypeFilters={setTypeFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        sortOpt={sortOpt}
        setSortOpt={setSortOpt}
        resultCount={visibleOrders.length}
        onClearAll={clearAllFilters}
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
