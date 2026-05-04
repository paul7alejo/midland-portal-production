"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePatientData } from "@/hooks/usePatientData";

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

  if (dataLoading) return <div className="p-8 text-gray-700 font-body text-base">Loading your data...</div>;

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
      {/* Greeting — time-of-day, first name only */}
      <h1 className="font-display text-3xl md:text-4xl font-bold text-navy mb-8">
        {getGreeting()}, {(patient.name ?? "Patient").split(" ")[0]}.
      </h1>

      <div className="space-y-6">

        {/* CARD 1 — MY EQUIPMENT */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="font-display text-xl text-navy">My Equipment</h2>
            <Link
              href="/portal/equipment"
              className="text-base text-deep-teal hover:underline font-medium"
            >
              View full details
            </Link>
          </div>

          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Machine</p>
              <p className="text-charcoal font-medium">
                {device ? `${device.brand} ${device.name}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Device ID</p>
              <p className="text-charcoal font-mono">
                {device ? device.serial_number : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Issued</p>
              <p className="text-charcoal">
                {device ? formatDate(device.setup_date) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Funded by</p>
              <p className="text-charcoal font-medium">
                {(device?.funding_stream ?? (patient as any).funding_stream ?? "ACC") === "ACC" ? "ACC" : "Health NZ"}
              </p>
            </div>

            {/* Safety check + Water chamber status badges */}
            {maintenance.map((check: any) => (
              <div key={check.check_type}>
                <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  {check.check_type === "safety_check" ? "Safety Check" : "Water Chamber"}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
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
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Mask</p>
              <p className="text-charcoal font-medium">
                {mask ? `${mask.brand} ${mask.name} ${formatMaskType(mask.type)}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Size</p>
              <p className="text-charcoal font-medium">
                {mask ? mask.size : "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">Last Issued</p>
              <p className="text-charcoal">
                {mask ? formatDate(mask.fitted_date) : "-"}
              </p>
            </div>
          </div>
        </section>

        {/* CARD 2 — MY SUPPLIES STATUS */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <h2 className="font-display text-xl text-navy">My Supplies Status</h2>

          {canReorderNow ? (
            <div className="bg-seafoam-pale rounded-lg p-4 space-y-3">
              <p className="text-charcoal font-medium flex items-center gap-2 text-base">
                <span className="text-seafoam">&#9989;</span>
                You can request mask supplies
              </p>
              <Link
                href="/portal/reorder"
                className="inline-flex items-center gap-2 bg-deep-teal text-white px-5 py-2.5 rounded-full text-base font-medium hover:bg-deep-teal/90 transition-colors"
              >
                Request Supplies
              </Link>
            </div>
          ) : (
            <div className="bg-sand-pale rounded-lg p-4 space-y-2">
              <p className="text-charcoal font-medium text-base">
                Your supplies are not yet available to reorder.
              </p>
              {entitlement.some((item) => item.next_eligible_date) && (
                <p className="text-base text-gray-700">
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
                className="border border-sand rounded-md p-3 space-y-1"
              >
                <p className="text-sm font-medium text-charcoal">
                  {ITEM_LABELS[item.item_type]}
                </p>
                {item.status === "ELIGIBLE" ? (
                  <p className="text-xs">
                    <span className="text-seafoam font-medium">Available now</span>
                  </p>
                ) : (
                  <p className="text-xs text-charcoal/70">
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
          <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
            <h2 className="font-display text-xl text-navy">
              Safety and maintenance
            </h2>

            <div className="space-y-3">
              {overdueChecks.map((check: any) => (
                <div
                  key={check.check_type}
                  className="border border-amber/40 bg-sand-pale rounded-md p-3 flex items-start gap-3"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">
                      {check.label} - Overdue
                    </p>
                    <p className="text-xs text-charcoal/70 mt-0.5">
                      Due {formatDate(check.due_date)}. Please call Midland Sleep on{" "}
                      {phoneLink} to arrange this.
                    </p>
                  </div>
                </div>
              ))}

              {dueSoonChecks.map((check: any) => (
                <div
                  key={check.check_type}
                  className="border border-sand rounded-md p-3 flex items-start gap-3"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-sand shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">
                      {check.label} - Due soon
                    </p>
                    <p className="text-xs text-charcoal/70 mt-0.5">
                      Due {formatDate(check.due_date)}. Midland will be in touch closer to the time.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CARD 4 — NEED HELP */}
        <section className="bg-sand-pale border border-sand rounded-lg p-6">
          <h2 className="font-display text-lg text-navy mb-2">Need help?</h2>
          <p className="text-base text-gray-700">
            Call Midland Sleep on {phoneLink} or email {emailLink}. We are open Monday to Friday, 8:30am to 5pm.
          </p>
        </section>

      </div>
    </>
  );
}
