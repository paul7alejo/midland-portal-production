"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePatientData } from "@/hooks/usePatientData";
import EquipmentVisual from "@/components/portal/EquipmentVisual";

const ITEM_LABELS: Record<string, string> = {
  cushion: "Mask cushion",
  headgear: "Headgear",
  mask_kit: "Complete mask kit",
  filter: "Filters",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMaskType(type: string): string {
  if (type === "full_face") return "Full face";
  if (type === "nasal") return "Nasal";
  if (type === "nasal_pillow") return "Nasal pillow";
  return type;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { patient } = useAuth();

  // Auth guard is now in portal/layout.tsx — no need here.
  if (!patient) return null;

  const { device, mask, entitlement: entitlementData, loading: dataLoading } = usePatientData();
  const entitlement = entitlementData?.items ?? [];
  const maintenance = (patient as any).maintenance ?? [];

  if (dataLoading) return <div className="p-8 text-gray-700 font-body text-lg leading-7">Loading your data...</div>;

  const canReorderNow = entitlement.some((item: any) => item.status === "ELIGIBLE");
  const overdueChecks = maintenance.filter((c: any) => c.status === "OVERDUE");
  const dueSoonChecks = maintenance.filter((c: any) => c.status === "DUE");

  const phoneLink = (
    <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">
      0800 000 000
    </a>
  );

  const emailLink = (
    <a href="mailto:hello@midlandsleep.co.nz" className="text-deep-teal font-medium hover:underline">
      hello@midlandsleep.co.nz
    </a>
  );

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-navy px-7 py-8 md:py-10 mb-8">
        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.06]" aria-hidden="true">
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
            <circle cx="220" cy="220" r="70" stroke="#74C0A2" strokeWidth="44"/>
            <circle cx="220" cy="220" r="120" stroke="#74C0A2" strokeWidth="28"/>
            <circle cx="220" cy="220" r="160" stroke="#74C0A2" strokeWidth="18"/>
          </svg>
        </div>
        <p className="text-seafoam/75 font-mono text-xs uppercase tracking-[0.22em] mb-3">Patient Portal</p>
        <h1 className="font-display text-[36px] md:text-[44px] leading-tight font-semibold text-cream mb-2">
          {getGreeting()}, {(patient.name ?? "Patient").split(" ")[0]}.
        </h1>
        <p className="text-cream/55 text-base leading-6">Your sleep care, made simple.</p>
      </div>

      <div className="space-y-7">

        {/* CARD 1 — MY EQUIPMENT */}
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <h2 className="font-display text-2xl font-semibold text-navy leading-snug">My equipment</h2>
            <Link
              href="/portal/equipment"
              className="text-lg text-deep-teal hover:underline font-medium"
            >
              View full details
            </Link>
          </div>

          {(device || mask) && (
            <div className="flex flex-wrap gap-4 pb-5 border-b border-sand">
              {device && (
                <div className="flex items-center gap-3 min-w-0">
                  <EquipmentVisual type="machine" className="h-16 w-24 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Machine</p>
                    <p className="text-base font-semibold text-charcoal leading-snug">{device.brand} {device.name}</p>
                  </div>
                </div>
              )}
              {mask && (
                <div className="flex items-center gap-3 min-w-0">
                  <EquipmentVisual type="mask" className="h-16 w-24 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Mask</p>
                    <p className="text-base font-semibold text-charcoal leading-snug">{mask.brand} {mask.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 text-lg leading-7">
            {!device && (
              <div>
                <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Machine</p>
                <p className="text-charcoal font-medium">No machine on file</p>
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Serial number</p>
              <p className="text-charcoal font-mono break-all">
                {device ? device.serial_number : "No serial on file"}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Issued</p>
              <p className="text-charcoal">
                {device ? formatDate(device.setup_date) : "Not recorded"}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Funded by</p>
              <p className="text-charcoal font-medium">
                {(device?.funding_stream ?? (patient as any).funding_stream ?? "ACC") === "ACC" ? "ACC" : "Health NZ"}
              </p>
            </div>

            {/* Safety check + Water chamber status badges */}
            {maintenance.map((check: any) => (
              <div key={check.check_type}>
                <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
                  {check.check_type === "safety_check" ? "Safety Check" : "Water Chamber"}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base font-medium",
                    check.status === "OVERDUE"
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : check.status === "DUE"
                      ? "bg-sand-pale text-charcoal border border-sand"
                      : "bg-seafoam-pale text-charcoal border border-seafoam/30"
                  )}
                >
                  {check.status === "OVERDUE"
                    ? `Overdue — ${formatDate(check.due_date)}`
                    : check.status === "DUE"
                    ? `Due ${formatDate(check.due_date)}`
                    : "OK"}
                </span>
              </div>
            ))}

            {/* Mask info */}
            <div>
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Mask</p>
              <p className="text-charcoal font-medium">
                {mask ? `${mask.brand} ${mask.name} ${formatMaskType(mask.type)}` : "No mask on file"}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Size</p>
              <p className="text-charcoal font-medium">
                {mask ? mask.size : "Not recorded"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Last issued</p>
              <p className="text-charcoal">
                {mask ? formatDate(mask.fitted_date) : "Not recorded"}
              </p>
            </div>
          </div>
        </section>

        {/* CARD 2 — MY SUPPLIES STATUS */}
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-navy leading-snug">My supplies status</h2>

          {canReorderNow ? (
            <div className="bg-seafoam-pale rounded-lg p-5 space-y-4">
              <p className="text-charcoal font-medium flex items-center gap-2 text-lg leading-7">
                <span className="text-seafoam">&#9989;</span>
                You can request mask supplies
              </p>
              <Link
                href="/portal/reorder"
                className="inline-flex items-center justify-center gap-2 bg-[#0B5C6C] text-white px-7 py-3.5 rounded-lg text-lg font-medium min-h-[52px] hover:bg-[#0B5C6C]/90 transition-colors"
              >
                Request Supplies
              </Link>
            </div>
          ) : (
            <div className="bg-sand-pale rounded-lg p-5 space-y-2">
              <p className="text-charcoal font-medium text-lg leading-7">
                Your supplies are not yet available to reorder.
              </p>
              {entitlement.some((item) => item.next_eligible_date) && (
                <p className="text-lg leading-7 text-charcoal/80">
                  Next eligible from{" "}
                  {formatDate(
                    entitlement
                      .filter((item) => item.next_eligible_date)
                      .map((item) => item.next_eligible_date as string)
                      .sort()[0]
                  )}
                </p>
              )}
            </div>
          )}

          {/* Per-item breakdown */}
          <ul className="grid gap-3 md:grid-cols-2">
            {entitlement.map((item) => (
              <li
                key={item.item_type}
                className={cn(
                  "rounded-md border border-l-4 p-4 space-y-1.5",
                  item.status === "ELIGIBLE"
                    ? "border-sand border-l-seafoam bg-seafoam-pale/30"
                    : "border-sand bg-white"
                )}
              >
                <p className="text-base font-semibold text-charcoal leading-7">
                  {ITEM_LABELS[item.item_type]}
                </p>
                {item.status === "ELIGIBLE" ? (
                  <p className="text-base">
                    <span className="text-deep-teal font-medium">Available now</span>
                  </p>
                ) : (
                  <p className="text-base text-charcoal/70 leading-6">
                    From{" "}
                    {item.next_eligible_date
                      ? formatDate(item.next_eligible_date)
                      : "later this year"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* CARD 3 — SAFETY AND MAINTENANCE */}
        {(overdueChecks.length > 0 || dueSoonChecks.length > 0) && (
          <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-navy leading-snug">
              Safety and maintenance
            </h2>

            <div className="space-y-4">
              {overdueChecks.map((check: any) => (
                <div
                  key={check.check_type}
                  className="border border-amber/40 bg-sand-pale rounded-md p-4 flex items-start gap-3"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber shrink-0" />
                  <div className="flex-1">
                    <p className="text-lg font-medium text-charcoal leading-7">
                      {check.label} - Overdue
                    </p>
                    <p className="text-base text-charcoal/80 mt-1 leading-6">
                      Due {formatDate(check.due_date)}. Please call Midland Sleep on{" "}
                      {phoneLink} to arrange this.
                    </p>
                  </div>
                </div>
              ))}

              {dueSoonChecks.map((check: any) => (
                <div
                  key={check.check_type}
                  className="border border-sand rounded-md p-4 flex items-start gap-3"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-sand shrink-0" />
                  <div className="flex-1">
                    <p className="text-lg font-medium text-charcoal leading-7">
                      {check.label} - Due soon
                    </p>
                    <p className="text-base text-charcoal/80 mt-1 leading-6">
                      Due {formatDate(check.due_date)}. Contact Midland Sleep if you have questions.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CARD 4 — NEED HELP */}
        <section className="bg-sand-pale border border-sand rounded-2xl p-6 md:p-7">
          <h2 className="font-display text-2xl font-semibold text-navy mb-3 leading-snug">Need help?</h2>
          <p className="text-lg leading-7 text-charcoal/80">
            Call Midland Sleep on {phoneLink} or email {emailLink}. We are open Monday to Friday, 8:30am to 5pm.
          </p>
        </section>

      </div>
    </>
  );
}
