"use client";

import { useState, useEffect, useMemo } from "react";

interface AuditEvent {
  sk: string;
  timestamp: string;
  label: string;
  action: string;
  adminEmail: string | null;
  patientMsid: string | null;
  result: string | null;
  details?: string;
  source?: string | null;
  module?: string | null;
  category?: string | null;
}

type LoadState = "loading" | "loaded" | "error";

type CategoryTab =
  | "All"
  | "Patients"
  | "Portal Accounts"
  | "Orders"
  | "Import"
  | "Entitlement"
  | "System"
  | "Failed";

type KpiFilter = "today" | "pwResets" | "nhiReveals" | "failed" | "orders" | null;
type TimeFilter = "today" | "7d" | "30d" | "all";
type SortOrder  = "newest" | "oldest";
type PageSize = 20 | 50 | 100;
type KpiTone = "today" | "password" | "nhi" | "failed" | "orders";

const CATEGORY_TABS: CategoryTab[] = [
  "All", "Patients", "Portal Accounts", "Orders",
  "Import", "Entitlement", "System", "Failed",
];

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d",    label: "7 days" },
  { value: "30d",   label: "30 days" },
  { value: "all",   label: "All" },
];

const PORTAL_ACCOUNT_ACTIONS = new Set([
  "ADMIN_PASSWORD_RESET_ATTEMPT",
  "ADMIN_ACCOUNT_UNLOCK_ATTEMPT",
  "PATIENT_LOGIN",
  "PATIENT_PASSWORD_CHANGED",
  "ACCOUNT_ENABLED",
  "ACCOUNT_LOCKED",
  "PATIENT_PORTAL_LOGIN",
]);

const PATIENT_ACTIONS = new Set([
  "NOTE_CREATED",
  "NOTE_UPDATED",
  "NOTE_DELETE_ATTEMPT",
  "NOTE_SOFT_DELETED",
  "PATIENT_REVIEW_STATUS_UPDATED",
  "PATIENT_OUTREACH_STATUS_UPDATED",
  "PATIENT_SAFETY_STATUS_UPDATED",
  "PATIENT_SAFETY_DETAILS_UPDATED",
]);

const GOOD_RESULTS = new Set(["ok", "success", "attempted"]);
const PAGE_SIZE_OPTIONS: PageSize[] = [20, 50, 100];
const SENSITIVE_DETAIL_PATTERNS = [
  /nhi/i,
  /password/i,
  /temporary password/i,
  /token/i,
  /cookie/i,
  /secret/i,
  /authorization/i,
  /payload/i,
];

const CATEGORY_COLORS: Record<string, string> = {
  "Patients":        "bg-blue-50 text-blue-700 border-blue-200",
  "Portal Accounts": "bg-purple-50 text-purple-700 border-purple-200",
  "Orders":          "bg-orange-50 text-orange-700 border-orange-200",
  "Import":          "bg-[#0B5C6C]/10 text-[#0B5C6C] border-[#0B5C6C]/20",
  "Entitlement":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "System":          "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

function categorize(action: string): Exclude<CategoryTab, "All" | "Failed"> {
  const a = action.toUpperCase();
  if (PORTAL_ACCOUNT_ACTIONS.has(a)) return "Portal Accounts";
  if (PATIENT_ACTIONS.has(a))        return "Patients";
  if (a.includes("ORDER_") || a.includes("REQUEST_")) return "Orders";
  if (a.startsWith("IMPORT_") || a.startsWith("CSV_"))    return "Import";
  if (a.startsWith("ENTITLEMENT_") || a.startsWith("FUNDING_")) return "Entitlement";
  return "System";
}

function isFailed(result: string | null): boolean {
  return result !== null && result !== "" && !GOOD_RESULTS.has(result);
}

function isToday(timestamp: string): boolean {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

function applyTimeFilter(events: AuditEvent[], filter: TimeFilter): AuditEvent[] {
  if (filter === "all")   return events;
  if (filter === "today") return events.filter((e) => isToday(e.timestamp));
  const cutoffMs = Date.now() - (filter === "7d" ? 7 : 30) * 24 * 3600 * 1000;
  return events.filter((e) => e.timestamp && new Date(e.timestamp).getTime() >= cutoffMs);
}

function applyKpiFilter(events: AuditEvent[], kpi: KpiFilter): AuditEvent[] {
  if (!kpi) return events;
  if (kpi === "today")      return events.filter((e) => isToday(e.timestamp));
  if (kpi === "pwResets")   return events.filter((e) => e.action === "ADMIN_PASSWORD_RESET_ATTEMPT");
  if (kpi === "nhiReveals") return events.filter((e) => e.action.toUpperCase().includes("NHI_REVEAL"));
  if (kpi === "failed")     return events.filter((e) => isFailed(e.result));
  return events.filter((e) => {
    const a = e.action.toUpperCase();
    return a.includes("ORDER_") || a.includes("REQUEST_");
  });
}

function formatTimestamp(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Pacific/Auckland",
  }).format(d);
}

function formatFullTimestamp(value: string): string {
  if (!value) return "Not captured";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Pacific/Auckland",
  }).format(d);
}

function safeText(value: string | null | undefined, fallback = "Not captured"): string {
  const text = value?.trim();
  if (!text) return fallback;
  return text;
}

function getSafeDetails(event: AuditEvent): string {
  const details = event.details?.trim();
  if (!details) return "No safe details captured.";
  if (SENSITIVE_DETAIL_PATTERNS.some((pattern) => pattern.test(details))) {
    return "Safe details withheld from this view.";
  }
  return details;
}

function getAuditSource(event: AuditEvent): string {
  const sourceParts = [
    event.source,
    event.module,
    event.category ?? categorize(event.action),
  ]
    .map((part) => part?.trim())
    .filter(Boolean);
  return sourceParts.length > 0 ? sourceParts.join(" / ") : "Not captured";
}

function escapeCsvValue(value: string): string {
  const clean = value.replace(/\r?\n|\r/g, " ");
  return `"${clean.replace(/"/g, '""')}"`;
}

function buildAuditCsv(events: AuditEvent[]): string {
  const headers = [
    "timestamp",
    "category",
    "event label",
    "action code",
    "admin email",
    "patient MSID",
    "result",
    "safe details",
  ];
  const rows = events.map((event) => [
    event.timestamp || "Not captured",
    categorize(event.action),
    safeText(event.label, "Unknown event"),
    safeText(event.action),
    safeText(event.adminEmail),
    safeText(event.patientMsid),
    safeText(event.result),
    getSafeDetails(event),
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-gray-400 text-xs">—</span>;
  const ok = GOOD_RESULTS.has(result);
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
      ok ? "bg-emerald-50 text-emerald-700 border-emerald-200"
         : "bg-red-50 text-red-700 border-red-200"
    }`}>
      {result}
    </span>
  );
}

function CategoryBadge({ action }: { action: string }) {
  const cat = categorize(action);
  const cls = CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {cat}
    </span>
  );
}

function SummaryCard({
  label, value, sub, tone, isActive, onClick,
}: {
  label: string; value: number; sub?: string;
  tone: KpiTone; isActive?: boolean; onClick: () => void;
}) {
  const tones: Record<KpiTone, { card: string; active: string; number: string; accent: string }> = {
    today: {
      card: "border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.04] hover:border-[#0B5C6C]/40",
      active: "ring-2 ring-[#0B5C6C] border-[#0B5C6C] bg-[#0B5C6C]/10",
      number: "text-[#073B4A]",
      accent: "bg-[#0B5C6C]",
    },
    password: {
      card: "border-teal-200 bg-teal-50/60 hover:border-teal-300",
      active: "ring-2 ring-teal-600 border-teal-500 bg-teal-100/70",
      number: "text-teal-800",
      accent: "bg-teal-600",
    },
    nhi: {
      card: "border-amber-200 bg-amber-50/70 hover:border-amber-300",
      active: "ring-2 ring-amber-500 border-amber-400 bg-amber-100/80",
      number: "text-amber-800",
      accent: "bg-amber-500",
    },
    failed: {
      card: "border-red-200 bg-red-50/60 hover:border-red-300",
      active: "ring-2 ring-red-600 border-red-500 bg-red-100/70",
      number: "text-red-700",
      accent: "bg-red-600",
    },
    orders: {
      card: "border-orange-200 bg-orange-50/60 hover:border-orange-300",
      active: "ring-2 ring-orange-500 border-orange-400 bg-orange-100/70",
      number: "text-orange-800",
      accent: "bg-orange-500",
    },
  };
  const toneCls = tones[tone];
  const stateCls = isActive ? toneCls.active : toneCls.card;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left rounded-xl border shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-5 py-4 transition-all ${stateCls}`}
    >
      {isActive && <span className={`absolute inset-x-4 top-0 h-1 rounded-b-full ${toneCls.accent}`} />}
      <p className={`text-2xl font-bold tabular-nums ${toneCls.number}`}>{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </button>
  );
}

function DetailRow({
  label, value, mono, node,
}: {
  label: string; value?: string; mono?: boolean; node?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {node ? (
        <div>{node}</div>
      ) : (
        <p className={`text-sm text-gray-800 break-all ${mono ? "font-mono" : ""}`}>
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}

function EventDetailsDrawer({
  event, onClose,
}: {
  event: AuditEvent | null; onClose: () => void;
}) {
  const isOpen = event !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Audit event details"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy">Event Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {event && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <DetailRow label="Full timestamp" value={formatFullTimestamp(event.timestamp)} />
            <DetailRow label="Category"  node={<CategoryBadge action={event.action} />} />
            <DetailRow label="Event"     value={event.label || "Unknown event"} />
            <DetailRow label="Action / event code" value={event.action || "Not captured"} mono />
            <DetailRow label="Result"    node={<ResultBadge result={event.result} />} />
            <hr className="border-gray-100" />
            <DetailRow label="Admin email"   value={safeText(event.adminEmail)} />
            <DetailRow label="Patient MSID"  value={safeText(event.patientMsid)} mono />
            <DetailRow label="Source / module / category" value={getAuditSource(event)} />
            <DetailRow label="Safe details"  value={getSafeDetails(event)} />
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                Privacy notice
              </p>
              <p className="text-xs text-gray-500">
                No raw NHI, passwords, temporary passwords, tokens, or secrets are stored in audit records.
                All fields shown here are safe operational metadata only.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  const [events,       setEvents]       = useState<AuditEvent[]>([]);
  const [loadState,    setLoadState]    = useState<LoadState>("loading");
  const [activeTab,    setActiveTab]    = useState<CategoryTab>("All");
  const [kpiFilter,    setKpiFilter]    = useState<KpiFilter>(null);
  const [timeFilter,   setTimeFilter]   = useState<TimeFilter>("all");
  const [sortOrder,    setSortOrder]    = useState<SortOrder>("newest");
  const [filterAction, setFilterAction] = useState("");
  const [filterMsid,   setFilterMsid]   = useState("");
  const [filterEmail,  setFilterEmail]  = useState("");
  const [pageSize,     setPageSize]     = useState<PageSize>(20);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/audit?limit=100");
        if (!res.ok) throw new Error("Non-ok response");
        const data = (await res.json()) as { events?: AuditEvent[] };
        setEvents(data.events ?? []);
        setLoadState("loaded");
      } catch {
        setLoadState("error");
      }
    }
    load();
  }, []);

  const stats = useMemo(() => ({
    today:      events.filter((e) => isToday(e.timestamp)).length,
    pwResets:   events.filter((e) => e.action === "ADMIN_PASSWORD_RESET_ATTEMPT").length,
    nhiReveals: events.filter((e) => e.action.toUpperCase().includes("NHI_REVEAL")).length,
    failed:     events.filter((e) => isFailed(e.result)).length,
    orders:     events.filter((e) => {
      const a = e.action.toUpperCase();
      return a.includes("ORDER_") || a.includes("REQUEST_");
    }).length,
  }), [events]);

  function toggleKpi(key: KpiFilter) {
    setKpiFilter((prev) => (prev === key ? null : key));
  }

  function clearAllControls() {
    setKpiFilter(null);
    setTimeFilter("all");
    setSortOrder("newest");
    setActiveTab("All");
    setFilterAction("");
    setFilterMsid("");
    setFilterEmail("");
    setCurrentPage(1);
  }

  function downloadCsv() {
    const csv = buildAuditCsv(sorted);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `midland-audit-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  // Full filtering pipeline
  const sorted = useMemo(() => {
    let result = applyTimeFilter(events, timeFilter);
    result = applyKpiFilter(result, kpiFilter);
    if (activeTab === "All") {
      // no additional tab filter
    } else if (activeTab === "Failed") {
      result = result.filter((e) => isFailed(e.result));
    } else {
      result = result.filter((e) => categorize(e.action) === activeTab);
    }

    const action = filterAction.toLowerCase().trim();
    const msid   = filterMsid.toLowerCase().trim();
    const email  = filterEmail.toLowerCase().trim();
    result = result.filter((e) => {
      if (action && !e.label.toLowerCase().includes(action) && !e.action.toLowerCase().includes(action)) return false;
      if (msid   && !(e.patientMsid ?? "").toLowerCase().includes(msid)) return false;
      if (email  && !(e.adminEmail  ?? "").toLowerCase().includes(email)) return false;
      return true;
    });

    if (sortOrder === "oldest") return [...result].reverse();
    return result;
  }, [events, timeFilter, kpiFilter, activeTab, filterAction, filterMsid, filterEmail, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, kpiFilter, activeTab, filterAction, filterMsid, filterEmail, sortOrder, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = sorted.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, sorted.length);
  const pagedEvents = sorted.slice(pageStartIndex, pageEndIndex);

  const hasAnyControl =
    kpiFilter || timeFilter !== "all" || sortOrder !== "newest" ||
    filterAction || filterMsid || filterEmail || activeTab !== "All";

  const hasTextFilters = filterAction || filterMsid || filterEmail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Audit Log</h1>
        <p className="text-base text-gray-600">
          Read-only operational visibility of admin actions and account events.
          No NHI, passwords, or secrets are stored in audit records.
        </p>
      </div>

      {/* Summary KPI cards */}
      {loadState === "loaded" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryCard
            label="Events today"
            value={stats.today}
            tone="today"
            isActive={kpiFilter === "today"}
            onClick={() => toggleKpi("today")}
          />
          <SummaryCard
            label="Password resets"
            value={stats.pwResets}
            sub="all time"
            tone="password"
            isActive={kpiFilter === "pwResets"}
            onClick={() => toggleKpi("pwResets")}
          />
          <SummaryCard
            label="NHI reveals"
            value={stats.nhiReveals}
            sub="disabled in MVP"
            tone="nhi"
            isActive={kpiFilter === "nhiReveals"}
            onClick={() => toggleKpi("nhiReveals")}
          />
          <SummaryCard
            label="Failed events"
            value={stats.failed}
            tone="failed"
            isActive={kpiFilter === "failed"}
            onClick={() => toggleKpi("failed")}
          />
          <SummaryCard
            label="Order events"
            value={stats.orders}
            tone="orders"
            isActive={kpiFilter === "orders"}
            onClick={() => toggleKpi("orders")}
          />
        </div>
      )}
      {loadState === "loaded" && kpiFilter && (
        <p className="text-xs text-[#0B5C6C]">
          KPI filter active — click the card again to clear, or{" "}
          <button
            type="button"
            onClick={clearAllControls}
            className="underline hover:opacity-70"
          >
            reset all
          </button>
          .
        </p>
      )}

      {/* Time filter + sort controls */}
      {loadState === "loaded" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {TIME_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimeFilter(opt.value)}
                className={`px-3 py-1.5 border-r last:border-r-0 border-gray-200 transition-colors whitespace-nowrap ${
                  timeFilter === opt.value
                    ? "bg-[#0B5C6C] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(["newest", "oldest"] as SortOrder[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSortOrder(v)}
                className={`px-3 py-1.5 border-r last:border-r-0 border-gray-200 transition-colors ${
                  sortOrder === v
                    ? "bg-[#0B5C6C] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v === "newest" ? "Newest first" : "Oldest first"}
              </button>
            ))}
          </div>

          {hasAnyControl && (
            <button
              type="button"
              onClick={clearAllControls}
              className="text-sm text-[#0B5C6C] underline underline-offset-2 hover:opacity-70"
            >
              Reset all
            </button>
          )}
        </div>
      )}

      {/* Category tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-0 min-w-max">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-[#0B5C6C] text-[#0B5C6C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
                {tab === "Failed" && stats.failed > 0 && (
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center rounded-full text-xs font-semibold px-1.5 min-w-[20px] ${
                      isActive ? "bg-red-600 text-white" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {stats.failed}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Text filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by event type…"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 w-48"
        />
        <input
          type="text"
          placeholder="Filter by patient MSID…"
          value={filterMsid}
          onChange={(e) => setFilterMsid(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 w-48"
        />
        <input
          type="text"
          placeholder="Filter by admin email…"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 w-52"
        />
        {hasTextFilters && (
          <button
            type="button"
            onClick={() => { setFilterAction(""); setFilterMsid(""); setFilterEmail(""); }}
            className="text-sm text-[#0B5C6C] underline underline-offset-2 hover:opacity-70 self-center"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Load states */}
      {loadState === "loading" && (
        <div className="py-20 text-center text-gray-400 text-sm">Loading audit events…</div>
      )}
      {loadState === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Failed to load audit log. Check your connection or contact technical support.
        </div>
      )}
      {loadState === "loaded" && events.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
          No audit events found. Events will appear here after admin actions are taken.
        </div>
      )}
      {loadState === "loaded" && events.length > 0 && sorted.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
          No events match the current filters.{" "}
          <button type="button" onClick={clearAllControls} className="text-[#0B5C6C] underline">
            Reset all
          </button>
        </div>
      )}

      {/* Table */}
      {loadState === "loaded" && sorted.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                Showing {pageStartIndex + 1}-{pageEndIndex} of {sorted.length} filtered events ·{" "}
                {sortOrder === "newest" ? "newest first" : "oldest first"} · click a row for details
              </p>
              <p className="text-xs text-gray-400">
                {events.length} loaded events available for filtering.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                Page size
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded-lg border border-[#0B5C6C]/30 bg-white px-3 py-1.5 text-sm font-medium text-[#0B5C6C] hover:bg-[#0B5C6C]/5 transition-colors"
              >
                Download filtered audit CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Timestamp", "Category", "Event", "Admin", "Patient MSID", "Result", "Details"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pagedEvents.map((e) => (
                  <tr
                    key={e.sk}
                    onClick={() => setSelectedEvent(e)}
                    onKeyDown={(ev) => { if (ev.key === "Enter") setSelectedEvent(e); }}
                    tabIndex={0}
                    className={`cursor-pointer hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                      isFailed(e.result) ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {formatTimestamp(e.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryBadge action={e.action} />
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{e.label}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{e.adminEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{e.patientMsid ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><ResultBadge result={e.result} /></td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{getSafeDetails(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Page {safeCurrentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Showing up to 100 most recent events. No NHI, passwords, or secrets are included in audit records.
          </p>
        </>
      )}

      {/* Event details drawer */}
      <EventDetailsDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
