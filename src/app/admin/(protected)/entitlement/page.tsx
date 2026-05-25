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

function PhaseChip({ label, phase }: { label: string; phase: "live" | "future" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-sm text-gray-700">{label}</span>
      {phase === "live" ? (
        <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Live — Phase 2</span>
      ) : (
        <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Phase 3</span>
      )}
    </div>
  );
}

export default function AdminEntitlementPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Funding &amp; Entitlement</h1>
        <p className="text-base text-gray-600">
          Visibility and alignment for the Midland/Biomed entitlement programme. This page is read-only.
          Full entitlement deduction, CPAP store ordering, and payment capture are Phase 3 scope.
        </p>
      </div>

      {/* Phase 2 scope notice */}
      <div className="rounded-xl border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.05] px-5 py-4">
        <p className="text-sm font-semibold text-[#0B5C6C] mb-1">Phase 2 — Visibility only</p>
        <p className="text-sm text-[#0B5C6C]/80">
          In this phase, entitlement data is displayed for admin review and alignment purposes. No deductions are applied, no orders are created, and no payments are processed. When a patient has remaining allowance, that information is visible to staff in the admin drawer only — it is not shown to patients and has no effect on checkout.
        </p>
      </div>

      {/* Summary cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Entitlement concept — current defaults</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Default annual allowance"
            value="$250"
            sub="per eligible patient"
            theme="teal"
          />
          <SummaryCard
            label="Used amount"
            value="Not yet tracked"
            sub="requires Phase 3 deduction logic"
            theme="neutral"
          />
          <SummaryCard
            label="Remaining"
            value="Not yet calculated"
            sub="requires Phase 3 deduction logic"
            theme="neutral"
          />
          <SummaryCard
            label="Eligibility status"
            value="Visibility only"
            sub="per patient in admin drawer"
            theme="amber"
          />
        </div>
      </div>

      {/* Capability map */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Entitlement capability map</h2>
        <div className="space-y-2">
          <PhaseChip label="Funding source captured on import (funded_by field)" phase="live" />
          <PhaseChip label="Entitlement visibility in admin patient drawer" phase="live" />
          <PhaseChip label="Funding review required notice for imported records" phase="live" />
          <PhaseChip label="Entitlement deduction logic on order placement" phase="future" />
          <PhaseChip label="CPAP store / checkout integration" phase="future" />
          <PhaseChip label="Patient co-pay calculation" phase="future" />
          <PhaseChip label="Inventory reservation on entitlement use" phase="future" />
          <PhaseChip label="Entitlement period renewal" phase="future" />
          <PhaseChip label="Per-item entitlement caps and rules" phase="future" />
        </div>
      </div>

      {/* Admin drawer reference */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
        <p className="text-sm font-semibold text-gray-700">Per-patient entitlement — admin drawer</p>
        <p className="text-sm text-gray-600">
          For individual patients, entitlement data is visible in the <strong>Entitlement &amp; funding</strong> tab of the patient drawer. Imported records show a &ldquo;Funding review required&rdquo; notice until entitlement data is confirmed. Amounts shown are informational only and do not drive any ordering or payment logic in this phase.
        </p>
      </div>

      {/* Phase 3 bridge note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-2">
        <p className="text-sm font-semibold text-amber-900">Phase 3 — ordering bridge</p>
        <p className="text-sm text-amber-800">
          When Phase 3 is activated, the $250 annual allowance will connect to CPAP store ordering. Patients will be able to apply their allowance at checkout, reducing their co-pay. Remaining allowance will be tracked and decremented against entitlement records in DynamoDB. Until Phase 3 is scoped and approved, no deduction or ordering logic is active.
        </p>
      </div>
    </div>
  );
}
