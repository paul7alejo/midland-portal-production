"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliveredOrderSummary {
  id: string;
  referenceNumber: string;
  patient: string;
  msid: string;
  items: string;
  status: string;
  createdDate: string;
  updatedDate?: string;
  estimatedFundedAmount: number | null;
  needsFundingReview: boolean;
}

interface EntitlementSummary {
  deliveredOrdersThisYear: number;
  nominalFundingUsedEstimate: number;
  requestsNeedingFundingReview: number;
  recentDeliveredOrders: DeliveredOrderSummary[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEstimate(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return `$${amount.toFixed(2)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  theme = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  theme?: "neutral" | "teal" | "amber";
}) {
  const colors = {
    neutral: "bg-white border-gray-200 text-gray-800",
    teal:    "bg-[#0B5C6C]/[0.06] border-[#0B5C6C]/20 text-[#0B5C6C]",
    amber:   "bg-amber-50 border-amber-200 text-amber-800",
  };
  return (
    <div className={`rounded-xl border px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${colors[theme]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

function PhaseChip({ label, phase }: { label: string; phase: "live" | "phase3" | "later" }) {
  const phaseLabel = {
    live:   "Live in Phase 2",
    phase3: "Planned for Phase 3",
    later:  "Later phase",
  };
  const phaseClass = {
    live:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    phase3: "bg-gray-100 text-gray-600 border-gray-200",
    later:  "bg-white text-gray-500 border-gray-200",
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${phaseClass[phase]}`}>
        {phaseLabel[phase]}
      </span>
    </div>
  );
}

function CapabilityGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminEntitlementPage() {
  const [summary, setSummary] = useState<EntitlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/entitlement", { credentials: "include" });
        if (!res.ok) throw new Error("Unable to load funding summary");
        const data = (await res.json()) as EntitlementSummary;
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setError("Funding summary could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Funding &amp; Entitlement</h1>
        <p className="text-base text-gray-600">
          Phase 2 visibility for the Midland/Biomed entitlement programme. This command centre is read-only:
          it helps staff understand funding review workflow without applying entitlement deductions.
        </p>
      </div>

      {/* Phase 2 scope notice */}
      <div className="rounded-xl border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.05] px-5 py-4">
        <p className="text-sm font-semibold text-[#0B5C6C] mb-1">Phase 2 — Visibility only</p>
        <p className="text-sm text-[#0B5C6C]/80">
          No deductions are applied. No orders are created from this page. No payments are processed.
          All dollar figures are estimates based on request data only. Full entitlement deduction and
          checkout are Phase 3 scope.
        </p>
      </div>

      {/* Live summary cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Live summary — {currentYear}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <div className="h-3 w-24 rounded bg-gray-100 mb-3 animate-pulse" />
                <div className="h-7 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="Delivered orders this year"
              value={String(summary.deliveredOrdersThisYear)}
              sub={`Calendar year ${currentYear}`}
              theme="teal"
            />
            <SummaryCard
              label="Nominal funding used (est.)"
              value={formatEstimate(summary.nominalFundingUsedEstimate)}
              sub="Estimate only — no deduction applied"
              theme="teal"
            />
            <SummaryCard
              label="Default annual allowance"
              value="$250"
              sub="Reference value only"
              theme="neutral"
            />
            <SummaryCard
              label="Needs funding review"
              value={String(summary.requestsNeedingFundingReview)}
              sub={
                summary.requestsNeedingFundingReview > 0
                  ? "Review in Patient Requests"
                  : "No requests flagged"
              }
              theme={summary.requestsNeedingFundingReview > 0 ? "amber" : "neutral"}
            />
          </div>
        ) : null}
      </div>

      {/* Funding review workflow */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">Funding review workflow</h2>
            <p className="text-sm text-gray-600">
              Requests needing funding review are managed in Patient Requests. Staff can flag or unflag
              funding review from Orders, while funding estimates remain visibility-only until Phase 3.
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>No entitlement balance is decremented from this page.</li>
              <li>No checkout, payment, or inventory reservation is triggered.</li>
              <li>Review flags help staff triage requests before any Phase 3 automation exists.</li>
            </ul>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#0B5C6C] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B5C6C] transition-colors hover:bg-[#0B5C6C]/[0.06]"
          >
            View requests needing funding review
          </Link>
        </div>
      </div>

      {/* Recent delivered orders */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent delivered orders
        </h2>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 text-sm text-gray-500">
            Recent orders could not be loaded.
          </div>
        ) : !summary || summary.recentDeliveredOrders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6">
            <p className="text-sm text-gray-500">No delivered orders to show yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Delivered orders will appear here once requests have been completed.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
              <p className="text-xs text-amber-700 font-medium">
                Estimate only — funding figures are based on request data. No entitlement deduction has been applied.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">MSID</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Completed</th>
                    <th className="px-4 py-3 font-medium text-right">Est. funded</th>
                    <th className="px-4 py-3 font-medium">Review flag</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentDeliveredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#0B5C6C] font-semibold whitespace-nowrap">
                        {order.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                        {order.patient}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {order.msid}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={order.items}>
                        {order.items}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {order.updatedDate ?? order.createdDate}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap tabular-nums">
                        {formatEstimate(order.estimatedFundedAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {order.needsFundingReview ? (
                          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Capability map */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Entitlement capability map</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <CapabilityGroup title="Live in Phase 2">
            <PhaseChip label="Funding source captured on import" phase="live" />
            <PhaseChip label="Entitlement visibility in admin patient drawer" phase="live" />
            <PhaseChip label="Funding review flags in Orders" phase="live" />
            <PhaseChip label="Delivered order count and nominal estimate (this page)" phase="live" />
          </CapabilityGroup>
          <CapabilityGroup title="Planned for Phase 3">
            <PhaseChip label="Entitlement deduction logic on order placement" phase="phase3" />
            <PhaseChip label="CPAP store / checkout integration" phase="phase3" />
            <PhaseChip label="Patient co-pay calculation" phase="phase3" />
          </CapabilityGroup>
          <CapabilityGroup title="Later phases">
            <PhaseChip label="Inventory reservation on entitlement use" phase="later" />
            <PhaseChip label="Entitlement period renewal" phase="later" />
            <PhaseChip label="Per-item entitlement caps and rules" phase="later" />
          </CapabilityGroup>
        </div>
      </div>

      {/* Admin drawer reference */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
        <p className="text-sm font-semibold text-gray-700">Per-patient entitlement — admin drawer</p>
        <p className="text-sm text-gray-600">
          For individual patients, entitlement data is visible in the <strong>Entitlement &amp; funding</strong> tab
          of the patient drawer. Amounts shown are informational only and do not drive any ordering,
          payment, or deduction logic in this phase.
        </p>
      </div>

      {/* Phase 3 bridge note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-2">
        <p className="text-sm font-semibold text-amber-900">Phase 3 — ordering bridge</p>
        <p className="text-sm text-amber-800">
          When Phase 3 is scoped and approved, the annual allowance can be connected to ordering,
          checkout, and remaining-balance tracking. Until then, no deduction, checkout, payment,
          or inventory reservation logic is active.
        </p>
      </div>
    </div>
  );
}
