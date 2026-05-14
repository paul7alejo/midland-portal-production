"use client";

import { useState, useMemo, useEffect } from "react";
import { PatientDrawer } from "@/components/admin/PatientDrawer";
import { cn } from "@/lib/utils";

type OrderStatus   = "Pending" | "Approved" | "Dispatched" | "Completed" | "Declined";
type TabKey        = OrderStatus;
type OrderType     = "ENTITLEMENT" | "PRIVATE" | "MIXED";
type DateRange     = "week" | "month" | "older";
type OrderSortOpt  = "newest" | "oldest" | "name_az" | "status";

interface Order {
  id: string;
  patient: string;
  msid: string;
  date: string;
  items: string;
  type: OrderType;
  status: OrderStatus;
}

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

const TABS: { key: TabKey }[] = [
  { key: "Pending"    },
  { key: "Approved"   },
  { key: "Dispatched" },
  { key: "Completed"  },
  { key: "Declined"   },
];

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Approved", "Dispatched", "Completed", "Declined"];
const TYPE_OPTIONS:   OrderType[]   = ["ENTITLEMENT", "PRIVATE", "MIXED"];
const TYPE_LABEL: Record<OrderType, string> = {
  ENTITLEMENT: "Entitlement",
  PRIVATE:     "Private",
  MIXED:       "Mixed",
};
const STATUS_BADGE: Record<OrderStatus, string> = {
  Pending:    "bg-amber-100 text-amber-800 border border-amber-200",
  Approved:   "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Dispatched: "bg-blue-100 text-blue-800 border border-blue-200",
  Completed:  "bg-gray-100 text-gray-700 border border-gray-200",
  Declined:   "bg-red-100 text-red-700 border border-red-200",
};
const TYPE_BADGE: Record<OrderType, string> = {
  ENTITLEMENT: "bg-[#0B5C6C]/10 text-[#0B5C6C]",
  PRIVATE:     "bg-purple-100 text-purple-700",
  MIXED:       "bg-orange-100 text-orange-700",
};

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
        <p className="text-sm leading-6 text-gray-500 mt-1">Supply requests will appear here once they reach this stage.</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab,     setActiveTab]     = useState<TabKey>("Pending");
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerMsid,    setDrawerMsid]    = useState<string | null>(null);
  const [drawerName,    setDrawerName]    = useState<string | undefined>(undefined);
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<OrderStatus>>(new Set());
  const [typeFilters,   setTypeFilters]   = useState<Set<OrderType>>(new Set());
  const [dateRange,     setDateRange]     = useState<DateRange | null>(null);
  const [sortOpt,       setSortOpt]       = useState<OrderSortOpt | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => { /* orders stays empty; EmptyState renders */ })
      .finally(() => setOrdersLoading(false));
  }, []);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "Pending").length,
    [orders]
  );

  function clearAllFilters() {
    setStatusFilters(new Set());
    setTypeFilters(new Set());
    setDateRange(null);
    setSortOpt(null);
  }

  function handleTabClick(key: TabKey) {
    setActiveTab(key);
    setSelected(new Set());
    // clicking a tab clears panel status filters so tab-based filtering resumes
    setStatusFilters(new Set());
  }

  const visibleOrders = useMemo(() => {
    let result = [...orders];

    // Status: panel filters override tab when active
    if (statusFilters.size > 0) {
      result = result.filter((o) => statusFilters.has(o.status));
    } else {
      result = result.filter((o) => o.status === activeTab);
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
    }

    return result;
  }, [activeTab, statusFilters, typeFilters, dateRange, sortOpt]);

  const activeFilterCount =
    statusFilters.size + typeFilters.size + (dateRange ? 1 : 0) + (sortOpt ? 1 : 0);

  const filterChips: { key: string; label: string; onRemove: () => void }[] = [
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
    console.log("approve selected", selectedVisible);
  }

  function handleApprove(order: Order) {
    console.log("approve", order);
  }

  function handleViewPatient(order: Order) {
    setDrawerMsid(order.msid);
    setDrawerName(order.patient);
    setDrawerOpen(true);
  }

  function handleDecline(order: Order) {
    console.log("decline", order);
  }

  const isFiltered = activeFilterCount > 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
            Patient operations
          </p>
          <h1 className="text-3xl font-bold text-navy">Orders</h1>
          <p className="text-base leading-6 text-gray-600">Supply request worklist for staff review.</p>
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

      {/* Tab bar */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key && statusFilters.size === 0;
            const badge = tab.key === "Pending" ? pendingCount : undefined;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`
                  flex items-center gap-2 px-5 py-3.5 text-base font-medium border-b-2 transition-colors
                  ${isActive
                    ? "border-[#0B5C6C] text-[#0B5C6C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.key}
                {badge !== undefined && badge > 0 && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full text-xs font-semibold px-2 py-0.5 min-w-[22px] ${
                      isActive ? "bg-[#0B5C6C] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline px-1"
          >
            Clear all
          </button>
        </div>
      )}

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
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded accent-[#0B5C6C] cursor-pointer"
                      aria-label="Select all"
                    />
                  </th>
                  {["Patient", "MSID", "Date", "Items", "Type", "Status", "Actions"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
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
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(order.id)}
                          className="h-4 w-4 rounded accent-[#0B5C6C] cursor-pointer"
                          aria-label={`Select ${order.patient}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-base font-semibold text-navy whitespace-nowrap">{order.patient}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-gray-700">{order.msid.replace(/^MS-/, "")}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 whitespace-nowrap">{order.date}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700">{order.items}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${TYPE_BADGE[order.type]}`}>
                          {TYPE_LABEL[order.type]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleApprove(order)}
                            className="bg-[#0B5C6C] text-white text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] hover:bg-[#0B5C6C]/90 transition-colors whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewPatient(order)}
                            className="border border-[#0B5C6C] text-[#0B5C6C] text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
                          >
                            View patient
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecline(order)}
                            className="text-sm font-medium text-red-500 hover:text-red-700 px-2 py-2 min-h-[40px] transition-colors"
                          >
                            Decline
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
