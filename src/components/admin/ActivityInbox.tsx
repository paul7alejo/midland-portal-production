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

const AREA_ICONS: Record<ActivityArea, React.ComponentType<{ className?: string }>> = {
  Orders:           ShoppingCart,
  Patients:         Users,
  Outreach:         Mail,
  Import:           Upload,
  Inventory:        PackageSearch,
  "Portal Accounts": Shield,
  System:           Settings,
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
  Attention: {
    label: "Attention",
    chip: "bg-amber-50 text-amber-800 border border-amber-300",
    icon: AlertCircle,
  },
  Warning: {
    label: "Warning",
    chip: "bg-red-50 text-red-700 border border-red-300",
    icon: AlertTriangle,
  },
  Info: {
    label: "Info",
    chip: "bg-sky-50 text-sky-700 border border-sky-200",
    icon: Info,
  },
  Completed: {
    label: "Completed",
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle2,
  },
};

const FILTERS: { id: ActivityFilterId; label: string }[] = [
  { id: "all",           label: "All" },
  { id: "attention",     label: "Needs attention" },
  { id: "orders",        label: "Orders" },
  { id: "communications",label: "Communications" },
  { id: "safety",        label: "Safety" },
  { id: "system",        label: "System" },
  { id: "inventory",     label: "Inventory" },
];

function kpiCounts(items: ActivityItem[]) {
  return {
    attention:      items.filter((i) => i.priority === "Attention" || i.priority === "Warning").length,
    patientRequests:items.filter((i) => i.filters.includes("orders")).length,
    communications: items.filter((i) => i.filters.includes("communications")).length,
    safety:         items.filter((i) => i.filters.includes("safety")).length,
    system:         items.filter((i) => i.filters.includes("system")).length,
  };
}

function FeedItem({ item }: { item: ActivityItem }) {
  const AreaIcon = AREA_ICONS[item.area];
  const PriorityIcon = PRIORITY_CONFIG[item.priority].icon;

  return (
    <div className="flex gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
      {/* Area icon */}
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "#E6F4F4" }}
      >
        <AreaIcon className="h-4 w-4 text-[#0B5C6C]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Chips + time */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_COLORS[item.area]}`}>
            {item.area}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CONFIG[item.priority].chip}`}>
            <PriorityIcon className="h-3 w-3" />
            {PRIORITY_CONFIG[item.priority].label}
          </span>
          <span className="ml-auto text-xs text-gray-400 shrink-0">{item.time}</span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 leading-snug">{item.title}</p>

        {/* Summary */}
        <p className="text-sm text-gray-500 mt-0.5 leading-5">{item.summary}</p>

        {/* Reference + action */}
        <div className="flex items-center gap-3 mt-2">
          {item.reference && (
            <span className="text-xs font-mono text-gray-400">{item.reference}</span>
          )}
          <Link
            href={item.actionHref}
            className="text-xs font-medium text-[#0B5C6C] hover:underline"
          >
            {item.actionLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActivityInbox() {
  const [activeFilter, setActiveFilter] = useState<ActivityFilterId>("all");

  const kpi = useMemo(() => kpiCounts(SAMPLE_ACTIVITY), []);

  const visibleItems = useMemo(
    () =>
      activeFilter === "all"
        ? SAMPLE_ACTIVITY
        : SAMPLE_ACTIVITY.filter((i) => i.filters.includes(activeFilter)),
    [activeFilter]
  );

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

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Needs attention",
            value: kpi.attention,
            accent: "#92400E",
            bg: "#FEF3C7",
            dot: "#F59E0B",
          },
          {
            label: "Patient requests",
            value: kpi.patientRequests,
            accent: "#0B2A3C",
            bg: "#E6F4F4",
            dot: "#0B5C6C",
          },
          {
            label: "Communications",
            value: kpi.communications,
            accent: "#0B2A3C",
            bg: "#E6F4F4",
            dot: "#0B5C6C",
          },
          {
            label: "Safety / outreach",
            value: kpi.safety,
            accent: "#991B1B",
            bg: "#FEE2E2",
            dot: "#EF4444",
          },
          {
            label: "System events",
            value: kpi.system,
            accent: "#374151",
            bg: "#F9FAFB",
            dot: "#6B7280",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative rounded-xl border p-4"
            style={{ background: card.bg, borderColor: `${card.dot}33` }}
          >
            <p className="text-xs font-medium text-gray-500 leading-tight">{card.label}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums" style={{ color: card.accent }}>
              {card.value}
            </p>
            {card.value > 0 && (card.dot === "#F59E0B" || card.dot === "#EF4444") && (
              <span className="absolute -top-1 -right-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: card.dot }}
                  />
                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ background: card.dot }}
                  />
                </span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-[#0B5C6C] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
              }`}
              style={isActive ? { background: "#0B5C6C" } : undefined}
            >
              {f.label}
              {isActive && f.id !== "all" && (
                <span className="ml-1.5 tabular-nums">{visibleItems.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {visibleItems.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No activity items in this category.
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
            Showing {visibleItems.length} of {SAMPLE_ACTIVITY.length} activity items &mdash; static sample data for v1.
          </p>
        </div>
      </div>
    </div>
  );
}
