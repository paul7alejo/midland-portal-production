import type { ReactNode } from "react";

function Section({ title, children }: { title: string; children: ReactNode }) {
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

function Rule({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-gray-700">
      <span className="mt-0.5 shrink-0 text-[#0B5C6C] font-bold">·</span>
      <span>{children}</span>
    </li>
  );
}

function SupportCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-[#0B5C6C] font-medium">{action}</p>
    </div>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center gap-4">
      <kbd className="inline-block rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-700 whitespace-nowrap shadow-sm">
        {keys}
      </kbd>
      <span className="text-sm text-gray-700">{action}</span>
    </div>
  );
}

function BoundaryWarning({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-red-700">
      <span className="mt-0.5 shrink-0 text-red-500 font-bold">✕</span>
      <span>{children}</span>
    </li>
  );
}

export default function AdminConfigPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Settings &amp; Support</h1>
        <p className="text-base text-gray-600">
          Read-only reference for system status, clinic rules, support contacts, and data boundaries.
          No settings can be changed here.
        </p>
      </div>

      <div className="space-y-4">
        {/* System status */}
        <Section title="System status">
          <dl className="space-y-2">
            <Row label="Environment"      value="Production — Midland Sleep" />
            <Row label="Release status"   value="Phase 2C-1 — Entitlement + Request + Audit Demo Value Pass" />
            <Row label="Latest proof tag" value="phase-2c-0-admin-control-entitlement-proof-2026-05-25" />
            <Row label="Portal status"    value="Admin and import workflows live" />
            <Row label="Import status"    value="CSV import with portal account creation active" />
            <Row label="Patient portal"   value="Active — accounts created on import when enabled" />
          </dl>
        </Section>

        {/* Clinic rules */}
        <Section title="Clinic rules">
          <ul className="space-y-2">
            <Rule>
              Default Midland/Biomed annual allowance:{" "}
              <strong>$250 per eligible patient.</strong>
            </Rule>
            <Rule>
              All import rows require{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                enable_portal_access = true
              </code>{" "}
              before execute is allowed.
            </Rule>
            <Rule>
              Temporary passwords are shown once only in the import result panel. They are not
              stored in import history, batch details, or evidence CSVs.
            </Rule>
            <Rule>
              NHI reveal is disabled in the current admin MVP. No raw NHI is shown in any admin
              screen or evidence output.
            </Rule>
            <Rule>
              Import history is stored in the admin browser only. It does not appear on other
              devices or browsers and will not survive clearing browser data. Download batch
              evidence CSVs at import time.
            </Rule>
            <Rule>
              Rollback is a placeholder only — no automated reversal of imported records is
              implemented. Reversal requires a separately approved data remediation plan.
            </Rule>
          </ul>
        </Section>

        {/* Support & Help */}
        <Section title="Support &amp; help">
          <div className="grid gap-3 sm:grid-cols-2">
            <SupportCard
              title="Report a bug"
              description="An existing agreed workflow is not behaving as documented."
              action="Contact OneOfZero via the agreed escalation path. Include what you expected, what happened, and the patient MSID if applicable."
            />
            <SupportCard
              title="Request a change"
              description="A new workflow, field, report, or automation is needed."
              action="Submit a change request. Describe the outcome and acceptance criteria. Changes require a separate estimate and approval before work starts."
            />
            <SupportCard
              title="Emergency support"
              description="Admin locked out, import writing unsafe data, or raw NHI visible where it should not be."
              action="Use the agreed emergency escalation path. Emergency support is for true production-blocking issues only."
            />
            <SupportCard
              title="Monthly support model"
              description="Support is available under the NZD $2,300/month retainer. Work outside agreed scope requires a separate estimate."
              action="Contact OneOfZero for retainer review or to scope a change request."
            />
          </div>
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Keyboard shortcuts">
          <div className="space-y-3">
            <ShortcutRow
              keys="Cmd / Ctrl + Enter"
              action="Save note (when note text area is focused)"
            />
            <ShortcutRow keys="Esc" action="Close drawer or modal" />
          </div>
        </Section>

        {/* Safety / data boundaries */}
        <Section title="Safety &amp; data boundaries">
          <p className="text-sm text-gray-600">
            Follow these rules during normal admin work and when raising support requests.
          </p>
          <ul className="space-y-2 pt-1">
            <BoundaryWarning>
              Do not paste raw NHI into notes, support requests, tickets, AI tools, emails, or
              informal channels.
            </BoundaryWarning>
            <BoundaryWarning>
              Do not include patient names, dates of birth, and contact details together in support
              requests unless explicitly required by OneOfZero for triage.
            </BoundaryWarning>
            <BoundaryWarning>
              Admin notes are for operational observations only — not clinical assessments,
              diagnoses, or risk scores.
            </BoundaryWarning>
            <BoundaryWarning>
              Do not forward temporary passwords by email or store them outside the import result
              panel.
            </BoundaryWarning>
            <BoundaryWarning>
              Do not share batch evidence CSVs outside approved Midland storage locations.
            </BoundaryWarning>
            <BoundaryWarning>
              Do not ask technical support to make clinical or identity decisions on behalf of
              Midland.
            </BoundaryWarning>
          </ul>
        </Section>
      </div>
    </div>
  );
}
