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
  const isOk = result === "ok" || result === "success" || result === "attempted";
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
        isOk
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {result}
    </span>
  );
}

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filterAction, setFilterAction] = useState("");
  const [filterMsid, setFilterMsid] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/audit?limit=100");
        if (!res.ok) throw new Error("Non-ok response");
        const data = await res.json() as { events?: AuditEvent[] };
        setEvents(data.events ?? []);
        setLoadState("loaded");
      } catch {
        setLoadState("error");
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const action = filterAction.toLowerCase().trim();
    const msid   = filterMsid.toLowerCase().trim();
    const email  = filterEmail.toLowerCase().trim();
    return events.filter((e) => {
      if (action && !e.label.toLowerCase().includes(action) && !e.action.toLowerCase().includes(action)) return false;
      if (msid   && !(e.patientMsid ?? "").toLowerCase().includes(msid)) return false;
      if (email  && !(e.adminEmail  ?? "").toLowerCase().includes(email)) return false;
      return true;
    });
  }, [events, filterAction, filterMsid, filterEmail]);

  const hasFilters = filterAction || filterMsid || filterEmail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Audit Log</h1>
        <p className="text-base text-gray-600">
          Read-only operational visibility of admin actions and account events. No NHI, no passwords, no secrets are stored here.
        </p>
      </div>

      {/* Filter bar */}
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
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setFilterAction(""); setFilterMsid(""); setFilterEmail(""); }}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Patient MSID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((e) => (
                  <tr key={e.sk} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {formatTimestamp(e.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{e.label}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{e.adminEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{e.patientMsid ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><ResultBadge result={e.result} /></td>
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
