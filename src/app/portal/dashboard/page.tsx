"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, Fragment } from "react";
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
  | "complete"
  | "completed"
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

type StepState = "completed" | "active" | "future";
type StatusStep = { label: string; state: StepState };
type StatusTone = "neutral" | "green" | "teal" | "rose" | "amber";

interface RequestStatusConfig {
  title: string;
  body: string;
  steps: StatusStep[];
  tone: StatusTone;
  ctaLabel: string;
  ctaHref: string;
}

const STATUS_LABELS: Record<ReorderStatus, string> = {
  new: "Requested",
  reviewing: "Reviewing",
  approved: "Approved",
  sent: "Sent",
  delivered: "Delivered",
  complete: "Complete",
  completed: "Completed",
  declined: "Contact us",
  needs_followup: "We'll be in touch",
};

const TONE_STYLES: Record<
  StatusTone,
  { card: string; title: string; activeCircle: string; activeLabel: string }
> = {
  neutral: {
    card:         "border-[#E6D3A3] bg-white",
    title:        "text-[#0B2A3C]",
    activeCircle: "border-[#0B5C6C] bg-[#0B5C6C]",
    activeLabel:  "text-[#0B5C6C]",
  },
  teal: {
    card:         "border-seafoam/40 bg-seafoam-pale",
    title:        "text-deep-teal",
    activeCircle: "border-[#0B5C6C] bg-[#0B5C6C]",
    activeLabel:  "text-[#0B5C6C]",
  },
  green: {
    card:         "border-seafoam/40 bg-seafoam-pale",
    title:        "text-deep-teal",
    activeCircle: "border-[#0B5C6C] bg-[#0B5C6C]",
    activeLabel:  "text-[#0B5C6C]",
  },
  rose: {
    card:         "border-rose-200 bg-rose-50",
    title:        "text-rose-800",
    activeCircle: "border-rose-600 bg-rose-600",
    activeLabel:  "text-rose-700",
  },
  amber: {
    card:         "border-amber-200 bg-amber-50",
    title:        "text-amber-900",
    activeCircle: "border-amber-500 bg-amber-500",
    activeLabel:  "text-amber-800",
  },
};

function getStatusConfig(status: string | null | undefined): RequestStatusConfig {
  switch (status) {
    case "new":
      return {
        title: "Your supply request has been received",
        body: "Midland Sleep will review your request. Staff will check your eligibility and availability before confirming supplies.",
        steps: [
          { label: "Submitted", state: "completed" },
          { label: "Under review", state: "active" },
        ],
        tone: "teal",
        ctaLabel: "View request",
        ctaHref: "/portal/reorder",
      };
    case "reviewing":
      return {
        title: "Staff are reviewing your request",
        body: "Staff are checking the details of your request and will be in touch when it progresses.",
        steps: [
          { label: "Submitted", state: "completed" },
          { label: "Under review", state: "active" },
        ],
        tone: "teal",
        ctaLabel: "View request",
        ctaHref: "/portal/reorder",
      };
    case "approved":
      return {
        title: "Approved — staff are preparing your supplies",
        body: "Midland Sleep will prepare your supplies.",
        steps: [
          { label: "Submitted", state: "completed" },
          { label: "Approved", state: "active" },
          { label: "Preparing", state: "future" },
        ],
        tone: "green",
        ctaLabel: "View request",
        ctaHref: "/portal/reorder",
      };
    case "sent":
      return {
        title: "On the way",
        body: "Your supplies have been dispatched or are on their way.",
        steps: [
          { label: "Approved", state: "completed" },
          { label: "Dispatched", state: "active" },
          { label: "Delivered", state: "future" },
        ],
        tone: "teal",
        ctaLabel: "View request",
        ctaHref: "/portal/reorder",
      };
    case "delivered":
    case "complete":
    case "completed":
      return {
        title: "Your supply request is complete",
        body: "You can submit a new request when you need supplies again.",
        steps: [
          { label: "Approved", state: "completed" },
          { label: "Dispatched", state: "completed" },
          { label: "Delivered", state: "active" },
        ],
        tone: "green",
        ctaLabel: "Request supplies",
        ctaHref: "/portal/reorder",
      };
    case "declined":
      return {
        title: "Please contact Midland Sleep about this request",
        body: "Our team will be happy to discuss your options.",
        steps: [
          { label: "Submitted", state: "completed" },
          { label: "Reviewed", state: "completed" },
          { label: "Not approved", state: "active" },
        ],
        tone: "rose",
        ctaLabel: "Contact Midland Sleep",
        ctaHref: "/portal/contact",
      };
    case "needs_followup":
      return {
        title: "Our team will contact you shortly",
        body: "Our team will reach out to confirm a few details before your request progresses.",
        steps: [
          { label: "Submitted", state: "completed" },
          { label: "Reviewed", state: "completed" },
          { label: "We'll be in touch", state: "active" },
        ],
        tone: "amber",
        ctaLabel: "Contact Midland Sleep",
        ctaHref: "/portal/contact",
      };
    case null:
    case undefined:
      return {
        title: "You can request supplies when needed",
        body: "Use the request supplies page when you need replacement CPAP supplies.",
        steps: [],
        tone: "neutral",
        ctaLabel: "Request supplies",
        ctaHref: "/portal/reorder",
      };
    default:
      return {
        title: "Your supply request has been received",
        body: "Midland Sleep will review your request and let you know the next step.",
        steps: [
          { label: "Submitted", state: "completed" },
          { label: "Under review", state: "active" },
        ],
        tone: "teal",
        ctaLabel: "View request",
        ctaHref: "/portal/reorder",
      };
  }
}

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

function getNzGreeting(): string {
  const nzHour = Number(
    new Intl.DateTimeFormat("en-NZ", {
      hour: "numeric",
      hour12: false,
      timeZone: "Pacific/Auckland",
    }).format(new Date())
  );
  if (nzHour < 12) return "Good morning";
  if (nzHour < 18) return "Good afternoon";
  return "Good evening";
}

function normalizeMsid(msid?: string): string {
  if (!msid) return "Not available";
  return msid.startsWith("MS-") ? msid : `MS-${msid}`;
}

const formatItemName = (name: string) =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function formatRequestedItems(request: CurrentReorderRequest | null): string | null {
  if (!request) return null;
  const itemNames = request.itemNames?.length ? request.itemNames : request.items;
  if (itemNames?.length) return itemNames.map(formatItemName).join(" · ");
  return request.itemDescription?.trim() || null;
}

function getRequestDate(request: CurrentReorderRequest): string {
  return formatDate(request.updatedAt ?? request.createdAt);
}

function isCompletedRequestStatus(status: string | null | undefined): boolean {
  return status === "delivered" || status === "complete" || status === "completed";
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
  const greeting = getNzGreeting();
  const requestedItems = formatRequestedItems(currentRequest);
  const isCompletedRequest = isCompletedRequestStatus(currentRequest?.status);

  const config: RequestStatusConfig = requestLoading
    ? {
        title: "Checking your supply request…",
        body: "We are checking whether you have a request in progress.",
        steps: [],
        tone: "neutral",
        ctaLabel: "",
        ctaHref: "",
      }
    : !currentRequest && !canReorder
    ? {
        title: "Supplies need staff review",
        body: "Contact Midland Sleep if you need supplies. Staff will review your options with you.",
        steps: [],
        tone: "neutral",
        ctaLabel: "Get help",
        ctaHref: "/portal/contact",
      }
    : getStatusConfig(currentRequest?.status ?? null);

  const toneStyles = TONE_STYLES[config.tone];
  const stepCount = config.steps.length;
  const gridCols = config.steps
    .map((_, i) => (i < stepCount - 1 ? "1fr minmax(32px,1fr)" : "1fr"))
    .join(" ");

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
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[88rem] -translate-x-1/2 lg:w-[calc(100vw-18rem)]">
      {/* Hero */}
      <div className="relative mb-5 overflow-hidden rounded-xl bg-[#0B2A3C] px-5 py-5 md:px-7 md:py-6">
        <div className="relative">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-seafoam/75">Patient Portal</p>
          <h1 className="mb-4 font-display text-[34px] font-semibold leading-tight text-cream md:text-[42px]">
            {greeting}, {firstName}
          </h1>
          <p className="font-mono text-xl font-semibold leading-7 text-cream">Midland Sleep ID: {msid}</p>
        </div>
      </div>

      {/* Supply request status */}
      {isCompletedRequest && currentRequest ? (
        <section className="mb-5 rounded-xl border border-[#E6D3A3] bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <p className="mb-1 font-mono text-xs uppercase tracking-[0.16em] text-charcoal/60">
                Last supply request
              </p>
              <h2 className="font-display text-[28px] font-semibold leading-tight text-[#0B2A3C] md:text-[32px]">
                Your supply request is complete
              </h2>
              <p className="mt-2 max-w-3xl text-lg leading-7 text-charcoal/75">
                You can submit a new request when you need supplies again.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/portal/reorder"
                className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#0B5C6C] px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-[#0B5C6C]/90"
              >
                Request supplies again
              </Link>
              <Link
                href="#request-history"
                className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[#E6D3A3] bg-white px-6 py-3 text-lg font-medium text-[#0B5C6C] transition-colors hover:border-[#0B5C6C]/40 hover:bg-[#F5F3EE]"
              >
                View request history
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-lg border border-[#E6D3A3] bg-[#F5F3EE] p-4 text-charcoal md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                Reference
              </p>
              <p className="font-mono text-base font-semibold text-[#0B5C6C]">
                {currentRequest.referenceNumber}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                Status
              </p>
              <span className="inline-flex rounded-full bg-[#74C0A2]/20 px-3 py-1 text-sm font-semibold text-[#0B5C6C]">
                {STATUS_LABELS[currentRequest.status]}
              </span>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                Requested
              </p>
              <p className="text-base font-semibold leading-6 text-[#0B2A3C]">
                {requestedItems ?? "Supply request"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                Last updated
              </p>
              <p className="text-base leading-6 text-charcoal/75">
                {getRequestDate(currentRequest)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className={cn("mb-5 rounded-xl border p-5 shadow-sm md:p-6", toneStyles.card)}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <p className="mb-1 font-mono text-xs uppercase tracking-[0.16em] text-charcoal/60">
                Supply request status
              </p>
              <h2 className={cn("font-display text-[28px] font-semibold leading-tight md:text-[32px]", toneStyles.title)}>
                {config.title}
              </h2>
              <p className="mt-2 max-w-3xl text-lg leading-7">{config.body}</p>
            </div>
            {config.ctaLabel && (
              <Link
                href={config.ctaHref}
                className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#0B5C6C] px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-[#0B5C6C]/90"
              >
                {config.ctaLabel}
              </Link>
            )}
          </div>

          {stepCount > 0 && (
            <div aria-label="Supply request progress" className="mx-auto mt-6 max-w-5xl">
              <div className="grid items-start" style={{ gridTemplateColumns: gridCols }}>
                {config.steps.map((step, index) => (
                  <Fragment key={step.label}>
                    <div className="flex min-w-0 flex-col items-center text-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2",
                          step.state === "completed" && "border-[#74C0A2] bg-[#74C0A2] text-white",
                          step.state === "active"    && toneStyles.activeCircle,
                          step.state === "active"    && "text-white",
                          step.state === "future"    && "border-[#E6D3A3] bg-transparent"
                        )}
                        aria-hidden="true"
                      >
                        {step.state === "completed" ? (
                          <span className="text-base font-bold leading-none">&#10003;</span>
                        ) : step.state === "active" ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-sm leading-5 text-charcoal/60",
                          step.state === "completed" && "font-medium text-[#74C0A2]",
                          step.state === "active"    && cn("font-semibold", toneStyles.activeLabel)
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                    {index < stepCount - 1 && (
                      <div
                        className={cn(
                          "mt-4 border-t-2",
                          step.state === "completed"
                            ? "border-[#74C0A2]"
                            : "border-dashed border-[#E6D3A3]"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {requestedItems && currentRequest && (
            <div className="mt-5 rounded-lg border border-white/60 bg-white/60 p-4 text-charcoal">
              <p className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                Requested
              </p>
              <p className="text-lg font-semibold leading-7">{requestedItems}</p>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(420px,1.25fr)_minmax(280px,0.85fr)_minmax(280px,0.85fr)] 2xl:grid-cols-[minmax(520px,1.35fr)_minmax(320px,0.85fr)_minmax(320px,0.85fr)]">

        {/* CARD 1 — MY EQUIPMENT */}
        <section className="space-y-4 rounded-xl border border-[#E6D3A3] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6D3A3] pb-3">
            <h2 className="font-display text-[28px] font-semibold leading-snug text-[#0B2A3C]">My Equipment</h2>
            <Link
              href="/portal/equipment"
              className="text-lg text-deep-teal hover:underline font-medium"
            >
              View full details
            </Link>
          </div>

          {(device || mask) && (
            <div className="grid gap-5 border-b border-[#E6D3A3] pb-4 md:grid-cols-2">
              {device && (
                <div className="min-h-[120px] rounded-xl border border-[#D9E8E4] bg-[#EFF5F4] p-5">
                  <Link
                    href="/portal/equipment"
                    aria-label={`View equipment details for ${device.name}`}
                    className="flex h-20 items-center justify-center rounded-lg border border-[#E6D3A3] bg-white shadow-sm transition-colors hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-deep-teal"
                  >
                    <EquipmentVisual type="machine" className="h-12 w-20 min-w-0 text-[#0B5C6C]" />
                  </Link>
                  <div className="mt-4 min-w-0 text-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#888888]">Machine</p>
                    <Link
                      href="/portal/equipment"
                      className="mt-1 block text-[22px] font-bold leading-[1.2] text-[#0B2A3C] hover:text-deep-teal hover:underline"
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
                <div className="min-h-[120px] rounded-xl border border-[#E6D3A3]/70 bg-[#F5F3EE] p-5">
                  <Link
                    href="/portal/equipment"
                    aria-label={`View equipment details for ${mask.name}`}
                    className="flex h-20 items-center justify-center rounded-lg border border-[#E6D3A3] bg-white shadow-sm transition-colors hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-deep-teal"
                  >
                    <EquipmentVisual type="mask" className="h-12 w-20 min-w-0 text-[#0B5C6C]" />
                  </Link>
                  <div className="mt-4 min-w-0 text-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#888888]">Mask</p>
                    <Link
                      href="/portal/equipment"
                      className="mt-1 block text-[22px] font-bold leading-[1.2] text-[#0B2A3C] hover:text-deep-teal hover:underline"
                    >
                      {mask.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-x-8 gap-y-4 text-base leading-6 md:grid-cols-2">
            {!device && (
              <div>
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Machine</p>
                <p className="text-charcoal font-medium">No machine on file</p>
              </div>
            )}
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Serial number</p>
              <p className="text-charcoal font-mono break-all">
                {device ? device.serial_number : "No serial on file"}
              </p>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Issued</p>
              <p className="text-charcoal">
                {device ? formatDate(device.setup_date) : "Not recorded"}
              </p>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Replacement due</p>
              <p className="text-charcoal font-medium">
                {machineReplacementDue ? formatDate(machineReplacementDue) : "Not recorded"}
              </p>
            </div>
            {/* Safety check + Water chamber status badges */}
            {maintenance.map((check: any) => (
              <div key={check.check_type}>
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">
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
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Mask</p>
              <p className="text-charcoal font-medium">
                {mask ? mask.name : "No mask on file"}
              </p>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Size</p>
              <p className="text-charcoal font-medium">
                {mask ? mask.size : "Not recorded"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">Last issued</p>
              <p className="text-charcoal">
                {mask ? formatDate(mask.fitted_date) : "Not recorded"}
              </p>
            </div>
          </div>
        </section>

        {/* CARD 2 — RECENT REQUESTS */}
        <section className="rounded-xl border border-[#E6D3A3] bg-white p-5 md:p-6">
          <div className="border-b border-[#E6D3A3] pb-3">
            <h2 className="font-display text-[28px] font-semibold leading-snug text-[#0B2A3C]">Recent Requests</h2>
          </div>
          {currentRequest ? (
            <div className="mt-5 rounded-lg border border-sand bg-[#F5F3EE] p-4">
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-charcoal/60">
                Latest request update
              </p>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-mono text-base font-bold text-[#0B5C6C]">
                  {currentRequest.referenceNumber}
                </p>
                <span className="rounded-full bg-[#74C0A2]/20 px-3 py-1 text-sm font-semibold text-[#0B5C6C]">
                  {STATUS_LABELS[currentRequest.status]}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold leading-7 text-[#0B2A3C]">
                {requestedItems ?? "Supply request"}
              </p>
              <p className="mt-2 text-sm leading-6 text-charcoal/75">
                {currentRequest.updatedAt
                  ? `Last updated: ${formatDate(currentRequest.updatedAt)}`
                  : `Submitted: ${formatDate(currentRequest.createdAt)}`}
              </p>
              <p className="mt-2 text-sm leading-5 text-charcoal/70">
                {getStatusConfig(currentRequest.status).body}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-base leading-7 text-charcoal/75">
              No active supply request.
            </p>
          )}
          <Link
            href="/portal/reorder"
            className="mt-5 inline-flex items-center text-base font-semibold text-[#0B5C6C] hover:underline"
          >
            View supply requests
          </Link>
        </section>

        <div className="space-y-5">
          {/* CARD 2 — SAFETY AND MAINTENANCE */}
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

          {/* CARD 3 — NEED HELP */}
          <section className="relative overflow-hidden rounded-xl border border-[#E6D3A3] bg-white p-5 md:p-6">
            <h2 className="mb-3 border-b border-[#E6D3A3] pb-3 font-display text-[28px] font-semibold leading-snug text-[#0B2A3C]">Need Help?</h2>
            <p className="text-base leading-7 text-charcoal/80">
              Our team is available Monday to Friday, 8:30am to 5pm.
            </p>
            <p className="mt-3 text-base leading-7 text-charcoal/75">
              Need more supplies? You can{" "}
              <Link href="/portal/reorder" className="font-medium text-deep-teal hover:underline">
                submit another request
              </Link>{" "}
              and Midland Sleep staff will review it.
            </p>
            <div className="mt-5 space-y-3 text-lg leading-7">
              <p>Call Midland Sleep on {phoneLink}</p>
              <p>Email {emailLink}</p>
            </div>
          </section>
        </div>

      </div>

      {currentRequest && (
        <section id="request-history" className="mt-5 scroll-mt-6 rounded-xl border border-[#E6D3A3] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6D3A3] pb-3">
            <h2 className="font-display text-[28px] font-semibold leading-snug text-[#0B2A3C]">My Supply Request History</h2>
            <Link href="/portal/reorder" className="text-base font-semibold text-[#0B5C6C] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-base">
              <thead>
                <tr className="border-b border-[#E6D3A3] font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/70">
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Reference</th>
                  <th className="py-3 pr-4 font-medium">Items</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-sand/60 last:border-0">
                  <td className="py-4 pr-4 text-charcoal">{getRequestDate(currentRequest)}</td>
                  <td className="py-4 pr-4 font-mono font-semibold text-[#0B5C6C]">{currentRequest.referenceNumber}</td>
                  <td className="py-4 pr-4 text-charcoal">{requestedItems ?? "Supply request"}</td>
                  <td className="py-4">
                    <span className="inline-flex rounded-full bg-[#74C0A2]/20 px-3 py-1 text-sm font-semibold text-[#0B5C6C]">
                      {STATUS_LABELS[currentRequest.status]}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
