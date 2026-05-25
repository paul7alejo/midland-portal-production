function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-0.5">
      <dt className="w-52 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800">{value}</dd>
    </div>
  );
}

function InfoItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-gray-700">
      <span className="mt-0.5 shrink-0 text-[#0B5C6C]">·</span>
      <span>{children}</span>
    </li>
  );
}

function FutureBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
      {label}
    </span>
  );
}

export default function AdminConfigPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">System Status</h1>
        <p className="text-base text-gray-600">
          Read-only overview of the current environment, import rules, and entitlement configuration. No settings can be changed here.
        </p>
      </div>

      <div className="space-y-4">
        {/* System status */}
        <Section title="System status">
          <dl className="space-y-2">
            <Row label="Environment"      value="Production (Midland Sleep)" />
            <Row label="Release status"   value="Controlled pilot — Phase 2A" />
            <Row label="Portal status"    value="Admin and import workflows live" />
            <Row label="Patient portal"   value="Active — accounts created on import when enabled" />
            <Row label="Support contact"  value="OneOfZero technical support — contact via agreed escalation path" />
          </dl>
        </Section>

        {/* Import rules */}
        <Section title="Current import rules">
          <ul className="space-y-2">
            <InfoItem>CSV import requires all rows to have <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">enable_portal_access = true</code> before execute is allowed.</InfoItem>
            <InfoItem>A Cognito portal account is created for each patient when <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">enable_portal_access = true</code>.</InfoItem>
            <InfoItem>Temporary passwords are shown once only in the import result panel. They are not stored in import history.</InfoItem>
            <InfoItem>Import history is stored in the admin browser only. It does not appear on other devices or other browsers, and will not survive clearing browser data.</InfoItem>
            <InfoItem>Dry run validates without writing records. Execute only proceeds after preflight passes.</InfoItem>
            <InfoItem>Duplicate NHI and duplicate machine serial rows are flagged and blocked before execute.</InfoItem>
          </ul>
        </Section>

        {/* Entitlement rules */}
        <Section title="Entitlement rules — Phase 2 visibility">
          <ul className="space-y-2">
            <InfoItem>Default Midland/Biomed annual allowance concept: <strong>$250 per eligible patient</strong>.</InfoItem>
            <InfoItem>Admin entitlement display is read-only visibility and alignment. No deduction, checkout, or payment logic is active.</InfoItem>
            <InfoItem>Patient entitlement amounts shown in the admin drawer are informational only. Full deduction logic requires Phase 3 activation.</InfoItem>
            <InfoItem>Funding source (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">funded_by</code>) is captured on import and shown in the patient drawer.</InfoItem>
            <InfoItem>Store ordering, inventory dispatch, and payment capture are not live in the current phase.</InfoItem>
          </ul>
        </Section>

        {/* Planned modules */}
        <Section title="Planned future modules">
          <p className="text-sm text-gray-500 mb-3">
            The following are not live. They will be scoped and delivered as separate change requests in later phases.
          </p>
          <div className="flex flex-wrap gap-2">
            <FutureBadge label="CPAP store / checkout" />
            <FutureBadge label="Stripe payment capture" />
            <FutureBadge label="Inventory & fulfilment" />
            <FutureBadge label="Patient invite emails" />
            <FutureBadge label="Backend-persistent import history" />
            <FutureBadge label="Entitlement deduction logic" />
            <FutureBadge label="Advanced audit dashboards" />
            <FutureBadge label="Editable configuration" />
            <FutureBadge label="Multi-clinic / multi-tenant" />
          </div>
        </Section>

        {/* Known limitations note */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">Known limitations</p>
          <p className="text-sm text-amber-800">
            Import history is browser-local only. Rollback is a placeholder only — no automated reversal is implemented. NHI reveal is disabled in the current admin MVP. Full known limitations are documented in the Midland OS handover materials.
          </p>
        </div>
      </div>
    </div>
  );
}
