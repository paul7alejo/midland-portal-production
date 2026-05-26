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

const CATEGORY_TABS: CategoryTab[] = [
  "All",
  "Patients",
  "Portal Accounts",
  "Orders",
  "Import",
  "Entitlement",
  "System",
  "Failed",
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

function categorize(action: string): Exclude<CategoryTab, "All" | "Failed"> {
  const a = action.toUpperCase();
  if (PORTAL_ACCOUNT_ACTIONS.has(a)) return "Portal Accounts";
  if (PATIENT_ACTIONS.has(a)) return "Patients";
  if (a.startsWith("ORDER_") || a.startsWith("REQUEST_")) return "Orders";
  if (a.startsWith("IMPORT_") || a.startsWith("CSV_")) return "Import";
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
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTimestamp(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Pacific/Auckland",
  }).format(d);
}

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-gray-400 text-xs">—</span>;
  const ok = GOOD_RESULTS.has(result);
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {result}
    </span>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "Patients":        "bg-blue-50 text-blue-700 border-blue-200",
  "Portal Accounts": "bg-purple-50 text-purple-700 border-purple-200",
  "Orders":          "bg-orange-50 text-orange-700 border-orange-200",
  "Import":          "bg-[#0B5C6C]/10 text-[#0B5C6C] border-[#0B5C6C]/20",
  "Entitlement":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "System":          "bg-gray-100 text-gray-600 border-gray-200",
};

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
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: "red" | "amber";
}) {
  const numColor =
    highlight === "red"
      ? "text-red-600"
      : highlight === "amber"
      ? "text-amber-600"
      : "text-navy";
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-5 py-4">
      <p className={`text-2xl font-bold tabular-nums ${numColor}`}>{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminAuditPage() {
  const [events,    setEvents]    = useState<AuditEvent[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [activeTab, setActiveTab] = useState<CategoryTab>("All");
  const [filterAction, setFilterAction] = useState("");
  const [filterMsid,   setFilterMsid]   = useState("");
  const [filterEmail,  setFilterEmail]  = useState("");

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

  const stats = useMemo(
    () => ({
      today:     events.filter((e) => isToday(e.timestamp)).length,
      pwResets:  events.filter((e) => e.action === "ADMIN_PASSWORD_RESET_ATTEMPT").length,
      nhiReveals: events.filter((e) => e.action.toUpperCase().includes("NHI_REVEAL")).length,
      failed:    events.filter((e) => isFailed(e.result)).length,
      orders:    events.filter((e) => {
        const a = e.action.toUpperCase();
        return a.startsWith("ORDER_") || a.startsWith("REQUEST_");
      }).length,
    }),
    [events]
  );

  const tabFiltered = useMemo(() => {
    if (activeTab === "All")    return events;
    if (activeTab === "Failed") return events.filter((e) => isFailed(e.result));
    return events.filter((e) => categorize(e.action) === activeTab);
  }, [events, activeTab]);

  const filtered = useMemo(() => {
    const action = filterAction.toLowerCase().trim();
    const msid   = filterMsid.toLowerCase().trim();
    const email  = filterEmail.toLowerCase().trim();
    return tabFiltered.filter((e) => {
      if (action && !e.label.toLowerCase().includes(action) && !e.action.toLowerCase().includes(action)) return false;
      if (msid   && !(e.patientMsid ?? "").toLowerCase().includes(msid)) return false;
      if (email  && !(e.adminEmail  ?? "").toLowerCase().includes(email)) return false;
      return true;
    });
  }, [tabFiltered, filterAction, filterMsid, filterEmail]);

  const hasTextFilters = filterAction || filterMsid || filterEmail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Audit Log</h1>
        <p className="text-base text-gray-600">
          Read-only operational visibility of admin actions and account events. No NHI, passwords, or secrets are stored in audit records.
        </p>
      </div>

      {/* Summary cards */}
      {loadState === "loaded" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryCard label="Events today"    value={stats.today} />
          <SummaryCard label="Password resets" value={stats.pwResets} sub="all time" />
          <SummaryCard label="NHI reveals"     value={stats.nhiReveals} sub="disabled in MVP" />
          <SummaryCard
            label="Failed events"
            value={stats.failed}
            highlight={stats.failed > 0 ? "red" : undefined}
          />
          <SummaryCard label="Order events" value={stats.orders} />
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

      {/* Text filter bar */}
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
            onClick={() => {
              setFilterAction("");
              setFilterMsid("");
              setFilterEmail("");
            }}
            className="text-sm text-[#0B5C6C] underline underline-offset-2 hover:opacity-70 self-center"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* States */}
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

      {loadState === "loaded" && events.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
          No events match the current filters.
        </div>
      )}

      {loadState === "loaded" && filtered.length > 0 && (
        <>
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {events.length} events · newest first · read-only
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Patient MSID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((e) => (
                  <tr
                    key={e.sk}
                    className={`hover:bg-gray-50/60 ${isFailed(e.result) ? "bg-red-50/30" : ""}`}
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ResultBadge result={e.result} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{e.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            Showing up to 100 most recent events. No NHI, passwords, or secrets are included in audit records.
          </p>
        </>
      )}
    </div>
  );
}
