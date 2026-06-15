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
        title: "Supply request completed",
        body: "You can request supplies again when needed.",
        steps: [
          { label: "Completed", state: "active" },
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


function RequestStatusBadge({ status }: { status: ReorderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold",
        isCompletedRequestStatus(status)
          ? "border-seafoam/30 bg-seafoam-pale text-[#0B5C6C]"
          : status === "declined"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : status === "needs_followup"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-[#E6D3A3] bg-[#FFF8E7] text-[#0B5C6C]"
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
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
    <div className="relative left-1/2 flex w-[calc(100vw-2rem)] max-w-[82rem] -translate-x-1/2 flex-col gap-5 pb-20 md:w-[calc(100vw-4rem)] md:gap-6 lg:w-[calc(100vw-19rem)] lg:pb-10">
      <section className="relative min-h-[164px] overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_78%_36%,rgba(116,192,162,0.28),transparent_34%),linear-gradient(118deg,#0B2A3C_0%,#0B3348_48%,#0B5C6C_100%)] px-6 py-7 shadow-[0_14px_34px_rgba(11,42,60,0.18)] sm:px-9 sm:py-9 md:min-h-[176px]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-seafoam/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,42,60,0.08),rgba(11,42,60,0.28))]" aria-hidden="true" />
        <div className="relative z-[2] max-w-4xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-seafoam/75">
            Patient Portal
          </p>
          <h1 className="mb-4 font-display text-[34px] font-semibold leading-[1.05] text-cream sm:text-[44px]">
            {greeting}, {firstName}
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/60">
              Sleep ID
            </span>
            <span className="rounded-md border border-white/10 bg-white/10 px-3 py-1 font-mono text-sm font-medium text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              {msid}
            </span>
          </div>
        </div>
      </section>

      <section
        id="supply-request-status"
        className="scroll-mt-24 rounded-[20px] border border-[#E6D3A3] bg-white p-6 shadow-[0_12px_30px_rgba(11,42,60,0.07)] md:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
              {isCompletedRequest && currentRequest ? "Last supply request" : "Supply request status"}
            </p>
            <h2 className="font-display text-[28px] font-semibold leading-[1.12] text-[#0B2A3C] sm:text-[32px]">
              {config.title}
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-charcoal/75">
              {config.body}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            {config.ctaLabel && (
              <Link
                href={config.ctaHref}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-[#0B5C6C] px-6 py-2.5 text-base font-semibold text-white shadow-[0_8px_18px_rgba(11,92,108,0.18)] transition-colors hover:bg-[#094d5a]"
              >
                {isCompletedRequest && currentRequest ? "Request supplies again" : config.ctaLabel}
              </Link>
            )}
            {currentRequest && (
              <Link
                href="#request-history"
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-[#0B5C6C] bg-transparent px-6 py-2.5 text-base font-semibold text-[#0B5C6C] transition-colors hover:bg-[#0B5C6C]/5"
              >
                View request history
              </Link>
            )}
          </div>
        </div>

        {stepCount > 0 && (
          <div aria-label="Supply request progress" className="mx-auto mt-8 max-w-[620px]">
            <div className="grid items-start" style={{ gridTemplateColumns: gridCols }}>
              {config.steps.map((step, index) => (
                <Fragment key={step.label}>
                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2",
                        step.state === "completed" && "border-[#74C0A2] bg-[#74C0A2] text-white",
                        step.state === "active" && toneStyles.activeCircle,
                        step.state === "active" && "text-white",
                        step.state === "future" && "border-[#E6D3A3] bg-transparent"
                      )}
                      aria-hidden="true"
                    >
                      {step.state === "completed" ? (
                        <span className="text-base font-bold leading-none">&#10003;</span>
                      ) : step.state === "active" ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-5 text-charcoal/60",
                        step.state === "completed" && "font-medium text-[#74C0A2]",
                        step.state === "active" && cn("font-semibold", toneStyles.activeLabel)
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

        {currentRequest && (
          <div className="mt-7 grid gap-3 rounded-xl border border-[#E6D3A3] bg-[#F5F3EE] p-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Reference
              </p>
              <p className="font-mono text-sm font-semibold text-[#0B5C6C] sm:text-base">
                {currentRequest.referenceNumber}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Status
              </p>
              <RequestStatusBadge status={currentRequest.status} />
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Requested
              </p>
              <p className="text-sm font-semibold leading-6 text-[#0B2A3C] sm:text-base">
                {requestedItems ?? "Supply request"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Last updated
              </p>
              <p className="text-sm leading-6 text-charcoal/75 sm:text-base">
                {getRequestDate(currentRequest)}
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] md:gap-6">
        <section className="rounded-[20px] border border-[#E6D3A3] bg-white p-6 shadow-[0_10px_26px_rgba(11,42,60,0.045)] md:p-7">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold leading-tight text-[#0B2A3C] sm:text-[28px]">
              My equipment
            </h2>
            <Link
              href="/portal/equipment"
              className="text-sm font-semibold text-[#0B5C6C] hover:underline sm:text-base"
            >
              View full details
            </Link>
          </div>

          <div className="grid gap-4 border-b border-[#E6D3A3] pb-5 sm:grid-cols-2">
            <Link
              href="/portal/equipment"
              aria-label={device ? `View equipment details for ${device.name}` : "View machine details"}
              className="group rounded-[20px] bg-[#EFF5F4] p-5 transition-colors hover:bg-[#EAF3E8] focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]"
            >
              <div className="flex h-20 items-center justify-center rounded-xl border border-[#E6D3A3] bg-white shadow-[0_1px_3px_rgba(11,42,60,0.04)]">
                <EquipmentVisual type="machine" className="h-12 w-20 text-[#0B5C6C]" />
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/55">
                Machine
              </p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-[#0B2A3C] group-hover:text-[#0B5C6C]">
                {device ? device.name : "No machine on file"}
              </p>
            </Link>

            <Link
              href="/portal/equipment"
              aria-label={mask ? `View mask details for ${mask.name}` : "View mask details"}
              className="group rounded-[20px] bg-[#F5F3EE] p-5 transition-colors hover:bg-[#FFF8E7] focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]"
            >
              <div className="flex h-20 items-center justify-center rounded-xl border border-[#E6D3A3] bg-white shadow-[0_1px_3px_rgba(11,42,60,0.04)]">
                <EquipmentVisual type="mask" className="h-12 w-20 text-[#0B5C6C]" />
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/55">
                Mask
              </p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-[#0B2A3C] group-hover:text-[#0B5C6C]">
                {mask ? mask.name : "No mask on file"}
              </p>
            </Link>
          </div>

          <div className="mt-5 grid gap-x-8 gap-y-4 text-base leading-6 md:grid-cols-2">
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Serial number
              </p>
              <p className="break-all font-mono text-charcoal">
                {device ? device.serial_number : "No serial on file"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Issued
              </p>
              <p className="text-charcoal">
                {device ? formatDate(device.setup_date) : "Not recorded"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Replacement due
              </p>
              <p className="font-semibold text-charcoal">
                {machineReplacementDue ? formatDate(machineReplacementDue) : "Not recorded"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Mask size
              </p>
              <p className="font-semibold text-charcoal">
                {mask ? mask.size : "Not recorded"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                Last issued
              </p>
              <p className="text-charcoal">
                {mask ? formatDate(mask.fitted_date) : "Not recorded"}
              </p>
            </div>

            {maintenance.map((check: any) => (
              <div key={check.check_type}>
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                  {check.check_type === "safety_check" ? "Safety check" : "Water chamber"}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold",
                    check.status === "OVERDUE"
                      ? "border-amber/30 bg-amber/10 text-amber"
                      : check.status === "DUE"
                      ? "border-[#E6D3A3] bg-[#FFF8E7] text-charcoal"
                      : "border-seafoam/30 bg-seafoam-pale text-charcoal"
                  )}
                >
                  {check.status === "OVERDUE"
                    ? `Overdue - ${formatDate(check.due_date)}`
                    : check.status === "DUE"
                    ? `Due ${formatDate(check.due_date)}`
                    : "OK"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="relative rounded-[20px] border border-[#E6D3A3] bg-[#FDFCF5] p-6 shadow-[0_10px_26px_rgba(11,42,60,0.045)] md:p-7">
          <h2 className="font-display text-2xl font-semibold leading-tight text-[#0B2A3C] sm:text-[28px]">
            Need help?
          </h2>
          <p className="mt-3 text-base leading-7 text-charcoal/80">
            Our team is available Monday to Friday, 8:30am to 5pm.
          </p>
          <p className="mt-3 text-base leading-7 text-charcoal/75">
            Need more supplies? You can{" "}
            <Link href="/portal/reorder" className="font-semibold text-[#0B5C6C] hover:underline">
              submit another request
            </Link>{" "}
            and Midland Sleep staff will review it.
          </p>

          {(overdueChecks.length > 0 || dueSoonChecks.length > 0) && (
            <div className="mt-5 space-y-3">
              {[...overdueChecks, ...dueSoonChecks].map((check: any) => (
                <div
                  key={check.check_type}
                  className={cn(
                    "rounded-xl border p-4",
                    check.status === "OVERDUE"
                      ? "border-amber/40 bg-white/75"
                      : "border-[#E6D3A3] bg-white/60"
                  )}
                >
                  <p className="text-base font-semibold leading-6 text-charcoal">
                    {check.label} - {check.status === "OVERDUE" ? "Overdue" : "Due soon"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-charcoal/75">
                    Due {formatDate(check.due_date)}. Contact Midland Sleep if you have questions.
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-3 text-base leading-7 text-charcoal">
            <p>Call Midland Sleep on {phoneLink}</p>
            <p>Email {emailLink}</p>
          </div>
        </aside>
      </div>

      {currentRequest && (
        <section
          id="request-history"
          className="scroll-mt-24 rounded-[20px] border border-[#E6D3A3] bg-white p-6 shadow-[0_10px_26px_rgba(11,42,60,0.045)] md:p-7"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold leading-tight text-[#0B2A3C] sm:text-[28px]">
              My supply request history
            </h2>
            <Link href="/portal/reorder" className="text-sm font-semibold text-[#0B5C6C] hover:underline sm:text-base">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[540px] w-full border-collapse text-left text-base">
              <thead>
                <tr className="border-b border-[#E6D3A3] font-mono text-[11px] uppercase tracking-[0.08em] text-charcoal/60">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Reference</th>
                  <th className="pb-3 pr-4 font-medium">Items</th>
                  <th className="pb-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E6D3A3]/70 last:border-0">
                  <td className="py-4 pr-4 text-charcoal whitespace-nowrap">
                    {getRequestDate(currentRequest)}
                  </td>
                  <td className="py-4 pr-4 font-mono font-semibold text-[#0B5C6C] whitespace-nowrap">
                    {currentRequest.referenceNumber}
                  </td>
                  <td className="py-4 pr-4 text-charcoal">
                    {requestedItems ?? "Supply request"}
                  </td>
                  <td className="py-4 text-right">
                    <RequestStatusBadge status={currentRequest.status} />
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
