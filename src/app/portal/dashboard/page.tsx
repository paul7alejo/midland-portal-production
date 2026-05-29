"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePatientData } from "@/hooks/usePatientData";
import EquipmentVisual from "@/components/portal/EquipmentVisual";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";

type ReorderStatus =
  | "new"
  | "reviewing"
  | "approved"
  | "sent"
  | "delivered"
  | "declined"
  | "needs_followup";

interface CurrentReorderRequest {
  id: string;
  referenceNumber: string;
  status: ReorderStatus;
  createdAt: string;
  updatedAt?: string;
  itemNames?: string[];
  items?: string[];
  itemDescription?: string;
}

const BLOCKING_STATUSES_PATIENT = new Set<ReorderStatus>([
  "new",
  "reviewing",
  "approved",
  "sent",
  "declined",
  "needs_followup",
]);

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addYears(iso: string, years: number): string | null {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}


function getFirstName(name?: string): string {
  return name?.trim().split(/\s+/)[0] || "Patient";
}

function normalizeMsid(msid?: string): string {
  if (!msid) return "Not available";
  return msid.startsWith("MS-") ? msid : `MS-${msid}`;
}

function formatRequestedItems(request: CurrentReorderRequest | null): string | null {
  if (!request) return null;
  const itemNames = request.itemNames?.length ? request.itemNames : request.items;
  if (itemNames?.length) return itemNames.join(", ");
  return request.itemDescription?.trim() || null;
}

export default function DashboardPage() {
  const { patient } = useAuth();
  const [currentRequest, setCurrentRequest] =
    useState<CurrentReorderRequest | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (!patient?.userId) return;
    let cancelled = false;

    async function loadCurrentRequest() {
      setRequestLoading(true);
      try {
        configureCognito();
        const token = await getIdToken();
        if (!token) throw new Error("Session expired. Please log in again.");

        const res = await fetch("/api/patient/reorder", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({})) as {
          request?: CurrentReorderRequest | null;
        };
        if (!cancelled && res.ok) {
          setCurrentRequest(data.request ?? null);
        }
      } catch {
        if (!cancelled) setCurrentRequest(null);
      } finally {
        if (!cancelled) setRequestLoading(false);
      }
    }

    void loadCurrentRequest();
    return () => {
      cancelled = true;
    };
  }, [patient?.userId]);

  // Auth guard is now in portal/layout.tsx — no need here.
  if (!patient) return null;

  const { device, mask, entitlement: entitlementData, loading: dataLoading } = usePatientData();
  const entitlement = entitlementData?.items ?? [];
  const maintenance = (patient as any).maintenance ?? [];

  if (dataLoading) return <div className="p-8 text-gray-700 font-body text-lg leading-7">Loading your data...</div>;

  const hasEligibleItems = entitlement.some((item: any) => item.status === "ELIGIBLE");
  const hasAnyItems = entitlement.length > 0;
  const requestAccessStatus: "eligible" | "needs_review" | "not_eligible" =
    !entitlementData ? "needs_review"
    : !hasAnyItems   ? "needs_review"
    : hasEligibleItems ? "eligible"
    : "not_eligible";

  const canReorder = requestAccessStatus === "eligible" || requestAccessStatus === "needs_review";
  const msid = normalizeMsid(patient.msid);
  const firstName = getFirstName(patient.name);
  const isRequestBlocking =
    currentRequest !== null && BLOCKING_STATUSES_PATIENT.has(currentRequest.status);
  const requestedItems = formatRequestedItems(currentRequest);

  const supplyStatus = requestLoading
    ? {
        label: "Checking supply request status",
        detail: "We are checking whether you have a request in progress.",
        action: null,
        requestedLabel: null,
        cardClass: "border-sand bg-white text-charcoal",
      }
    : isRequestBlocking
    ? {
        label: "Request in progress",
        detail: "Midland Sleep is reviewing or preparing your current supply request.",
        action: "View request",
        requestedLabel: requestedItems ? "Requested" : null,
        cardClass: "border-seafoam/40 bg-seafoam-pale text-deep-teal",
      }
    : currentRequest?.status === "delivered"
    ? {
        label: "Supplies available",
        detail: "Your last request is complete. You can request replacement supplies when needed.",
        action: "Request supplies",
        requestedLabel: requestedItems ? "Last requested" : null,
        cardClass: "border-seafoam/40 bg-seafoam-pale text-deep-teal",
      }
    : canReorder
    ? {
        label: "Supplies available",
        detail: "You can request replacement supplies when needed. Midland Sleep staff will review your request.",
        action: "Request supplies",
        requestedLabel: null,
        cardClass: "border-seafoam/40 bg-seafoam-pale text-deep-teal",
      }
    : {
        label: "Supplies need staff review",
        detail: "Contact Midland Sleep if you need supplies. Staff will review your options with you.",
        action: "Get help",
        requestedLabel: requestedItems ? "Requested" : null,
        cardClass: "border-sand bg-sand-pale text-charcoal",
      };
  const overdueChecks = maintenance.filter((c: any) => c.status === "OVERDUE");
  const dueSoonChecks = maintenance.filter((c: any) => c.status === "DUE");
  const machineReplacementDue = device ? addYears(device.setup_date, 5) : null;

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
      <div className="relative mb-6 overflow-hidden rounded-xl bg-navy px-5 py-6 md:px-7 md:py-7">
        <div className="relative">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-seafoam/75">Patient Portal</p>
          <h1 className="mb-4 font-display text-[34px] font-semibold leading-tight text-cream md:text-[42px]">
            Good morning, {firstName}
          </h1>
          <div className="rounded-lg border border-cream/15 bg-white/8 p-4 sm:inline-flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2">
            <p className="text-xl font-semibold leading-7 text-cream">{patient.name ?? "Patient"}</p>
            <p className="font-mono text-lg font-semibold leading-7 text-cream">Midland Sleep ID: {msid}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">

        {/* CARD 1 — MY EQUIPMENT */}
        <section className="space-y-4 rounded-xl border border-sand bg-white p-5 md:p-6">
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
            <div className="grid gap-4 border-b border-sand pb-4 md:grid-cols-2">
              {device && (
                <div className="rounded-lg border border-sand bg-sand-pale/40 p-4">
                  <Link
                    href="/portal/equipment"
                    aria-label={`View equipment details for ${device.name}`}
                    className="block rounded-lg transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-deep-teal"
                  >
                    <EquipmentVisual type="machine" className="h-24 w-full min-w-0 sm:h-28" />
                  </Link>
                  <div className="mt-3 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Machine</p>
                    <Link
                      href="/portal/equipment"
                      className="mt-1 block text-xl font-semibold text-charcoal leading-snug hover:text-deep-teal hover:underline"
                    >
                      {device.name}
                    </Link>
                    {machineReplacementDue && (
                      <p className="mt-2 text-base leading-6 text-charcoal/80">
                        Replacement due {formatDate(machineReplacementDue)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {mask && (
                <div className="rounded-lg border border-sand bg-sand-pale/40 p-4">
                  <Link
                    href="/portal/equipment"
                    aria-label={`View equipment details for ${mask.name}`}
                    className="block rounded-lg transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-deep-teal"
                  >
                    <EquipmentVisual type="mask" className="h-24 w-full min-w-0 sm:h-28" />
                  </Link>
                  <div className="mt-3 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Mask</p>
                    <Link
                      href="/portal/equipment"
                      className="mt-1 block text-xl font-semibold text-charcoal leading-snug hover:text-deep-teal hover:underline"
                    >
                      {mask.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-x-8 gap-y-4 text-lg leading-7 md:grid-cols-2">
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
              <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">Replacement due</p>
              <p className="text-charcoal font-medium">
                {machineReplacementDue ? formatDate(machineReplacementDue) : "Not recorded"}
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
                {mask ? mask.name : "No mask on file"}
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

        <div className="space-y-5">
          {/* CARD 2 — MY SUPPLIES STATUS */}
          <section className={cn("space-y-4 rounded-xl border p-5 md:p-6", supplyStatus.cardClass)}>
            <h2 className="font-display text-2xl font-semibold leading-snug text-navy">My supplies status</h2>
            <div>
              <p className="text-xl font-semibold leading-7">{supplyStatus.label}</p>
              <p className="mt-2 text-lg leading-7">{supplyStatus.detail}</p>
            </div>
            {supplyStatus.requestedLabel && requestedItems && (
              <div className="rounded-lg border border-white/60 bg-white/60 p-4 text-charcoal">
                <p className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                  {supplyStatus.requestedLabel}
                </p>
                <p className="text-lg font-semibold leading-7">{requestedItems}</p>
              </div>
            )}
            {supplyStatus.action && (
              <Link
                href="/portal/reorder"
                className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#0B5C6C] px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-[#0B5C6C]/90"
              >
                {supplyStatus.action}
              </Link>
            )}
          </section>

          {/* CARD 3 — SAFETY AND MAINTENANCE */}
          {(overdueChecks.length > 0 || dueSoonChecks.length > 0) && (
            <section className="space-y-4 rounded-xl border border-sand bg-white p-5 md:p-6">
              <h2 className="font-display text-2xl font-semibold text-navy leading-snug">
                Safety and maintenance
              </h2>

              <div className="space-y-3">
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
          <section className="rounded-xl border border-sand bg-sand-pale p-5 md:p-6">
            <h2 className="font-display text-2xl font-semibold text-navy mb-3 leading-snug">Need help?</h2>
            <p className="text-lg leading-7 text-charcoal/80">
              Call Midland Sleep on {phoneLink} or email {emailLink}. We are open Monday to Friday, 8:30am to 5pm.
            </p>
          </section>
        </div>

      </div>
    </>
  );
}
