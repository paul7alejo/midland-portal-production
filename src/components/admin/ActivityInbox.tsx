"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  Mail,
  Upload,
  PackageSearch,
  Shield,
  Settings,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  SAMPLE_ACTIVITY,
  type ActivityItem,
  type ActivityArea,
  type ActivityPriority,
  type ActivityFilterId,
} from "@/lib/sample-data/admin-activity";

// ─── Constants ────────────────────────────────────────────────────────────────

const AREA_ICONS: Record<ActivityArea, React.ComponentType<{ className?: string }>> = {
  Orders:            ShoppingCart,
  Patients:          Users,
  Outreach:          Mail,
  Import:            Upload,
  Inventory:         PackageSearch,
  "Portal Accounts": Shield,
  System:            Settings,
};

const AREA_COLORS: Record<ActivityArea, string> = {
  Orders:            "bg-sky-50 text-sky-700 border border-sky-200",
  Patients:          "bg-violet-50 text-violet-700 border border-violet-200",
  Outreach:          "bg-teal-50 text-teal-700 border border-teal-200",
  Import:            "bg-slate-50 text-slate-600 border border-slate-200",
  Inventory:         "bg-orange-50 text-orange-700 border border-orange-200",
  "Portal Accounts": "bg-amber-50 text-amber-700 border border-amber-200",
  System:            "bg-gray-50 text-gray-600 border border-gray-200",
};

const PRIORITY_CONFIG: Record<
  ActivityPriority,
  { label: string; chip: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Attention: { label: "Attention", chip: "bg-amber-50 text-amber-800 border border-amber-300", icon: AlertCircle },
  Warning:   { label: "Warning",   chip: "bg-red-50 text-red-700 border border-red-300",        icon: AlertTriangle },
  Info:      { label: "Info",      chip: "bg-sky-50 text-sky-700 border border-sky-200",         icon: Info },
  Completed: { label: "Completed", chip: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2 },
};

const CATEGORY_FILTERS: { id: ActivityFilterId; label: string }[] = [
  { id: "all",            label: "All" },
  { id: "attention",      label: "Needs attention" },
  { id: "orders",         label: "Orders" },
  { id: "communications", label: "Communications" },
  { id: "safety",         label: "Safety" },
  { id: "system",         label: "System" },
  { id: "inventory",      label: "Inventory" },
];

const KPI_DEFS: {
  label: string;
  filterId: ActivityFilterId;
  kpiKey: "attention" | "patientRequests" | "communications" | "safety" | "system";
  accent: string;
  bg: string;
  dot: string;
  hasPulse: boolean;
}[] = [
  { label: "Needs attention",  filterId: "attention",      kpiKey: "attention",       accent: "#92400E", bg: "#FEF3C7", dot: "#F59E0B", hasPulse: true  },
  { label: "Patient requests", filterId: "orders",         kpiKey: "patientRequests", accent: "#0B2A3C", bg: "#E6F4F4", dot: "#0B5C6C", hasPulse: false },
  { label: "Communications",   filterId: "communications", kpiKey: "communications",  accent: "#0B2A3C", bg: "#E6F4F4", dot: "#0B5C6C", hasPulse: false },
  { label: "Safety / outreach",filterId: "safety",         kpiKey: "safety",          accent: "#991B1B", bg: "#FEE2E2", dot: "#EF4444", hasPulse: true  },
  { label: "System events",    filterId: "system",         kpiKey: "system",          accent: "#374151", bg: "#F9FAFB", dot: "#6B7280", hasPulse: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DateRangeId = "today" | "week" | "month" | "all";

const DATE_RANGES: { id: DateRangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week",  label: "Last 7 days" },
  { id: "month", label: "Last 30 days" },
  { id: "all",   label: "All time" },
];

function isInRange(iso: string, range: DateRangeId): boolean {
  if (range === "all") return true;
  const date = new Date(iso);
  const now = new Date();
  if (range === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date >= today;
  }
  const msAgo = now.getTime() - date.getTime();
  if (range === "week") return msAgo <= 7 * 86_400_000;
  return msAgo <= 30 * 86_400_000;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.floor((today.getTime() - itemDay.getTime()) / 86_400_000);
  const timeStr = date.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit", hour12: true });
  if (dayDiff === 0) return `Today, ${timeStr}`;
  if (dayDiff === 1) return `Yesterday, ${timeStr}`;
  if (dayDiff < 7) return `${dayDiff} days ago`;
  return date.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

function kpiCounts(items: ActivityItem[]) {
  return {
    attention:       items.filter((i) => i.priority === "Attention" || i.priority === "Warning").length,
    patientRequests: items.filter((i) => i.filters.includes("orders")).length,
    communications:  items.filter((i) => i.filters.includes("communications")).length,
    safety:          items.filter((i) => i.filters.includes("safety")).length,
    system:          items.filter((i) => i.filters.includes("system")).length,
  };
}

// ─── Feed item ────────────────────────────────────────────────────────────────

function FeedItem({ item }: { item: ActivityItem }) {
  const AreaIcon     = AREA_ICONS[item.area];
  const PriorityIcon = PRIORITY_CONFIG[item.priority].icon;

  return (
    <div className="flex gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "#E6F4F4" }}
      >
        <AreaIcon className="h-4 w-4 text-[#0B5C6C]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_COLORS[item.area]}`}>
            {item.area}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CONFIG[item.priority].chip}`}>
            <PriorityIcon className="h-3 w-3" />
            {PRIORITY_CONFIG[item.priority].label}
          </span>
          <span className="ml-auto text-xs text-gray-400 shrink-0">
            {formatRelativeTime(item.timestamp)}
          </span>
        </div>

        <p className="text-sm font-semibold text-gray-800 leading-snug">{item.title}</p>
        <p className="text-sm text-gray-500 mt-0.5 leading-5">{item.summary}</p>

        <div className="flex items-center gap-3 mt-2">
          {item.reference && (
            <span className="text-xs font-mono text-gray-400">{item.reference}</span>
          )}
          <Link href={item.actionHref} className="text-xs font-medium text-[#0B5C6C] hover:underline">
            {item.actionLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityInbox() {
  const [activeFilter, setActiveFilter] = useState<ActivityFilterId>("all");
  const [dateRange,    setDateRange]    = useState<DateRangeId>("all");
  const [sortOrder,    setSortOrder]    = useState<"newest" | "oldest">("newest");

  const kpi = useMemo(() => kpiCounts(SAMPLE_ACTIVITY), []);

  const visibleItems = useMemo(() => {
    let items =
      activeFilter === "all"
        ? SAMPLE_ACTIVITY
        : SAMPLE_ACTIVITY.filter((i) => i.filters.includes(activeFilter));

    if (dateRange !== "all") {
      items = items.filter((i) => isInRange(i.timestamp, dateRange));
    }

    return [...items].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
  }, [activeFilter, dateRange, sortOrder]);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold" style={{ color: "#0B2A3C" }}>
          Activity Inbox
        </h1>
        <p className="text-sm text-gray-500">
          One place for recent portal activity and items needing staff attention.
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Read-only operational view. No messages are sent from this page.
        </p>
      </div>

      {/* KPI cards — clickable, filter the feed */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KPI_DEFS.map((def) => {
          const value    = kpi[def.kpiKey];
          const isActive = activeFilter === def.filterId;
          return (
            <button
              key={def.filterId}
              type="button"
              onClick={() => setActiveFilter(isActive ? "all" : def.filterId)}
              className="relative rounded-xl border p-4 text-left transition-shadow focus:outline-none focus-visible:ring-2"
              style={{
                background:   def.bg,
                borderColor:  isActive ? def.dot : `${def.dot}33`,
                boxShadow:    isActive ? `0 0 0 2px ${def.dot}` : undefined,
              }}
              aria-pressed={isActive}
              title={`Filter by ${def.label}`}
            >
              <p className="text-xs font-medium text-gray-500 leading-tight">{def.label}</p>
              <p className="text-3xl font-bold mt-1 tabular-nums" style={{ color: def.accent }}>
                {value}
              </p>
              {value > 0 && def.hasPulse && (
                <span className="absolute -top-1 -right-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: def.dot }}
                    />
                    <span
                      className="relative inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ background: def.dot }}
                    />
                  </span>
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-2 right-2 text-[10px] font-semibold" style={{ color: def.dot }}>
                  ✓ active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Controls row: date range + category filters + sort */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          {DATE_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDateRange(r.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                dateRange === r.id
                  ? "border-[#0B2A3C] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
              style={dateRange === r.id ? { background: "#0B2A3C" } : undefined}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-5 w-px bg-gray-200" />

        {/* Category filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-[#0B5C6C] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
                style={isActive ? { background: "#0B5C6C" } : undefined}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort — right-aligned */}
        <div className="ml-auto shrink-0">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/20 focus:border-[#0B5C6C]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {visibleItems.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-400">No activity items match the current filters.</p>
            <button
              type="button"
              onClick={() => { setActiveFilter("all"); setDateRange("all"); }}
              className="mt-2 text-xs font-medium text-[#0B5C6C] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            Showing {visibleItems.length} of {SAMPLE_ACTIVITY.length} activity items.{" "}
            Read-only sample activity view — live aggregation will connect to audit, order, import, and portal account events in a future phase.
          </p>
        </div>
      </div>
    </div>
  );
}
