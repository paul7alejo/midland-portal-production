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
    live: "Live in Phase 2",
    phase3: "Planned for Phase 3",
    later: "Later phase",
  };
  const phaseClass = {
    live: "bg-emerald-50 text-emerald-700 border-emerald-200",
    phase3: "bg-gray-100 text-gray-600 border-gray-200",
    later: "bg-white text-gray-500 border-gray-200",
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

export default function AdminEntitlementPage() {
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
          Full entitlement deduction and checkout are Phase 3 scope.
        </p>
      </div>

      {/* Summary cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Entitlement concept — current defaults</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Default annual allowance"
            value="$250"
            sub="Reference value only"
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
            sub="No checkout effect"
            theme="amber"
          />
        </div>
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
          <a
            href="/admin/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#0B5C6C] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B5C6C] transition-colors hover:bg-[#0B5C6C]/[0.06]"
          >
            View requests needing funding review
          </a>
        </div>
      </div>

      {/* Capability map */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Entitlement capability map</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <CapabilityGroup title="Live in Phase 2">
            <PhaseChip label="Funding source captured on import" phase="live" />
            <PhaseChip label="Entitlement visibility in admin patient drawer" phase="live" />
            <PhaseChip label="Funding review flags in Orders" phase="live" />
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
