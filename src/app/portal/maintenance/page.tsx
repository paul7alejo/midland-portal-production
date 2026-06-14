"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePatientData } from "@/hooks/usePatientData";
import { cn } from "@/lib/utils";
import EquipmentVisual from "@/components/portal/EquipmentVisual";

function parseValidDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateValue(value?: string | null, fallback = "—"): string {
  const date = parseValidDate(value);
  return date ? formatDate(date) : fallback;
}

function displayValue(value?: string | null, fallback = "Not recorded"): string {
  return value?.trim() || fallback;
}

function formatMaskType(type?: string): string {
  if (!type) return "Not recorded";
  if (type === "full_face") return "Full face";
  if (type === "nasal") return "Nasal";
  if (type === "nasal_pillow") return "Nasal pillow";
  return type;
}

function addYears(iso?: string | null, years = 5): string | null {
  const date = parseValidDate(iso);
  if (!date) return null;
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}

function addMonths(value: string | undefined, months: number): Date | null {
  const date = parseValidDate(value);
  if (!date) return null;
  date.setMonth(date.getMonth() + months);
  return date;
}

function monthsSince(value: string | undefined): number | null {
  const date = parseValidDate(value);
  if (!date) return null;
  const now = new Date();
  return (
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth())
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 font-mono text-xs uppercase tracking-wide text-charcoal/70">
        {label}
      </dt>
      <dd
        className={`text-base leading-6 text-charcoal ${
          mono ? "break-all font-mono" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

type CheckStatus = "OVERDUE" | "OK";

interface MaintenanceCheck {
  check_type: "safety_check" | "mask_check";
  label: string;
  status: CheckStatus;
  last_completed: string;
  due_date: Date;
}

type ModalType = "machine" | "mask" | null;

export default function MaintenancePage() {
  const { patient } = useAuth();
  const { device, mask, loading } = usePatientData();
  const [modal, setModal] = useState<ModalType>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modal]);

  useEffect(() => {
    if (modal) closeRef.current?.focus();
  }, [modal]);

  if (loading)
    return (
      <div className="p-8 text-charcoal/80 text-base leading-6">Loading...</div>
    );
  if (!patient) return null;

  const machineName = device
    ? device.name ||
      [device.brand, device.model].filter(Boolean).join(" ") ||
      "Machine details not recorded"
    : "";
  const maskName = mask
    ? mask.name || mask.brand || "Mask details not recorded"
    : "";
  const replacementDue = addYears(device?.setup_date);

  const maintenance: MaintenanceCheck[] = [];
  let hasUnscheduledEquipment = false;
  if (device) {
    const elapsedMonths = monthsSince(device.setup_date);
    const dueDate = addMonths(device.setup_date, 12);
    if (elapsedMonths === null || dueDate === null) {
      hasUnscheduledEquipment = true;
    } else {
      maintenance.push({
        check_type: "safety_check",
        label: "Machine safety check",
        status: elapsedMonths >= 12 ? "OVERDUE" : "OK",
        last_completed: device.setup_date,
        due_date: dueDate,
      });
    }
  }
  if (mask) {
    const elapsedMonths = monthsSince(mask.fitted_date);
    const dueDate = addMonths(mask.fitted_date, 6);
    if (elapsedMonths === null || dueDate === null) {
      hasUnscheduledEquipment = true;
    } else {
      maintenance.push({
        check_type: "mask_check",
        label: "Mask check",
        status: elapsedMonths >= 6 ? "OVERDUE" : "OK",
        last_completed: mask.fitted_date,
        due_date: dueDate,
      });
    }
  }

  const phoneLink = (
    <a
      href="tel:0800000000"
      className="text-deep-teal font-medium hover:underline"
    >
      0800 000 000
    </a>
  );

  const emailLink = (
    <a
      href="mailto:hello@midlandsleep.co.nz"
      className="text-deep-teal font-medium hover:underline"
    >
      hello@midlandsleep.co.nz
    </a>
  );

  return (
    <>
      <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-semibold text-navy mb-2">
        Maintenance
      </h1>
      <p className="text-base leading-6 text-charcoal/80 mb-4">
        Check when your CPAP equipment may need a Midland Sleep review.
      </p>

      <div className="space-y-4">
        {device && (
          <div className="bg-white border border-sand rounded-2xl p-4 md:p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(140px,0.6fr)_minmax(0,1.4fr)] sm:items-center">
              <button
                type="button"
                onClick={() => setModal("machine")}
                className="group relative rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2 min-w-0"
                aria-label="View machine details"
              >
                <EquipmentVisual
                  type="machine"
                  className="h-32 w-full min-w-0 sm:h-36"
                />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-navy/20">
                  <span className="bg-navy/80 text-white text-sm px-3 py-1.5 rounded-full">
                    View details
                  </span>
                </span>
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                  Your machine
                </p>
                <p className="text-xl leading-7 text-charcoal font-semibold">
                  {displayValue(device.brand)}{" "}
                  {displayValue(device.model, device.name)}
                </p>
                <p className="mt-1.5 text-base leading-6 text-charcoal/80 break-words">
                  Set up{" "}
                  {formatDateValue(
                    device.setup_date,
                    "Setup date not recorded yet"
                  )}
                </p>
                <p className="mt-0.5 text-base leading-6 text-charcoal/80 break-all">
                  Serial{" "}
                  <span className="font-mono text-charcoal">
                    {displayValue(device.serial_number)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {mask && (
          <div className="bg-white border border-sand rounded-2xl p-4 md:p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(140px,0.6fr)_minmax(0,1.4fr)] sm:items-center">
              <button
                type="button"
                onClick={() => setModal("mask")}
                className="group relative rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2 min-w-0"
                aria-label="View mask details"
              >
                <EquipmentVisual
                  type="mask"
                  className="h-32 w-full min-w-0 sm:h-36"
                />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-deep-teal/10">
                  <span className="bg-navy/80 text-white text-sm px-3 py-1.5 rounded-full">
                    View details
                  </span>
                </span>
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                  Your mask
                </p>
                <p className="text-xl leading-7 text-charcoal font-semibold">
                  {displayValue(mask.brand)} {displayValue(mask.name)}
                </p>
                <p className="mt-1.5 text-base leading-6 text-charcoal/80">
                  Size{" "}
                  <span className="font-medium text-charcoal">
                    {displayValue(mask.size)}
                  </span>
                </p>
                <p className="mt-0.5 text-base leading-6 text-charcoal/80">
                  Fitted{" "}
                  {formatDateValue(mask.fitted_date, "Fit date not recorded yet")}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasUnscheduledEquipment && (
          <div className="bg-white border border-sand rounded-2xl p-5">
            <p className="text-base leading-6 text-charcoal/80">
              Maintenance guidance will appear once your equipment setup date is
              confirmed.
            </p>
          </div>
        )}

        {maintenance.map((check) => {
          const isOverdue = check.status === "OVERDUE";
          const isSafetyCheck = check.check_type === "safety_check";

          return (
            <section
              key={check.check_type}
              className={cn(
                "bg-white border rounded-2xl p-5 md:p-6 space-y-4",
                isOverdue ? "border-amber/40" : "border-sand"
              )}
            >
              <div className="flex flex-col justify-between items-start gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-xl font-semibold text-navy leading-snug">
                    {check.label}
                  </h2>
                  <p className="text-base leading-6 text-charcoal/80 mt-0.5">
                    {isSafetyCheck
                      ? "Midland Sleep can arrange an annual machine safety check."
                      : "Midland Sleep can review your mask and cushion if they need attention."}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap",
                    isOverdue
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : "bg-seafoam-pale text-charcoal border border-seafoam/30"
                  )}
                >
                  {isOverdue ? "Overdue" : "OK"}
                </span>
              </div>

              <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2 text-base leading-6">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Last completed
                  </dt>
                  <dd className="text-charcoal font-medium">
                    {formatDateValue(check.last_completed)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Next due
                  </dt>
                  <dd
                    className={cn(
                      "font-medium",
                      isOverdue ? "text-amber" : "text-charcoal"
                    )}
                  >
                    {formatDate(check.due_date)}
                  </dd>
                </div>
              </dl>

              {isOverdue && (
                <div className="bg-sand-pale border border-amber/20 rounded-md p-4">
                  <p className="text-base leading-6 text-charcoal">
                    {isSafetyCheck
                      ? "This check is overdue. Please contact Midland Sleep to arrange an appointment."
                      : "Your mask is due for a check. Please contact Midland Sleep to arrange a review."}
                  </p>
                  <p className="text-base leading-6 text-charcoal/85 mt-1.5">
                    Call {phoneLink} or email {emailLink}
                  </p>
                </div>
              )}

              {!isOverdue && (
                <p className="text-base leading-6 text-charcoal/80">
                  Nothing to arrange right now. Contact Midland Sleep if your
                  equipment details look wrong.
                </p>
              )}
            </section>
          );
        })}

        {maintenance.length === 0 && !hasUnscheduledEquipment && (
          <div className="bg-white border border-sand rounded-2xl p-5">
            <p className="text-base leading-6 text-charcoal/80">
              No maintenance records are on file. Contact Midland Sleep if you
              think a check is due.
            </p>
          </div>
        )}

        <section className="bg-sand-pale border border-sand rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold text-navy mb-2 leading-snug">
            About CPAP maintenance
          </h2>
          <div className="text-base leading-6 text-charcoal/85 space-y-2">
            <p>
              <span className="font-medium text-charcoal">Safety checks</span>{" "}
              are arranged by Midland Sleep when needed for your machine.
            </p>
            <p>
              <span className="font-medium text-charcoal">Mask checks</span>{" "}
              ensure Midland Sleep can review your mask, cushion, and fit if
              something feels wrong.
            </p>
            <p>For any maintenance questions, call {phoneLink}.</p>
          </div>
        </section>
      </div>

      {/* Equipment detail modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={modal === "machine" ? "Machine details" : "Mask details"}
        >
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setModal(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-sand shrink-0">
              <h2 className="font-display text-xl font-semibold text-navy leading-snug">
                {modal === "machine" ? "Machine details" : "Mask details"}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setModal(null)}
                className="shrink-0 rounded-lg p-2 text-charcoal/60 hover:bg-sand-pale hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal"
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 5L5 15M5 5l10 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {modal === "machine" && device && (
                <>
                  <EquipmentVisual
                    type="machine"
                    className="h-32 w-full rounded-xl border border-sand bg-sand-pale/50"
                  />
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Machine name" value={machineName} />
                    <DetailRow label="Brand" value={displayValue(device.brand)} />
                    <DetailRow
                      label="Model"
                      value={displayValue(device.name ?? device.model)}
                    />
                    <DetailRow
                      label="Serial number"
                      value={displayValue(device.serial_number)}
                      mono
                    />
                    <DetailRow
                      label="Set up"
                      value={formatDateValue(device.setup_date)}
                    />
                    <DetailRow
                      label="Replacement due"
                      value={formatDateValue(replacementDue)}
                    />
                    <DetailRow
                      label="Entitlement"
                      value="Health New Zealand | Te Whatu Ora"
                    />
                  </dl>
                </>
              )}
              {modal === "mask" && mask && (
                <>
                  <EquipmentVisual
                    type="mask"
                    className="h-32 w-full rounded-xl border border-sand bg-deep-teal/5"
                  />
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Mask name" value={maskName} />
                    <DetailRow label="Brand" value={displayValue(mask.brand)} />
                    <DetailRow label="Model" value={displayValue(mask.name)} />
                    <DetailRow label="Type" value={formatMaskType(mask.type)} />
                    <DetailRow label="Size" value={displayValue(mask.size)} />
                    <DetailRow
                      label="Fitted"
                      value={formatDateValue(mask.fitted_date)}
                    />
                  </dl>
                </>
              )}
            </div>

            <div className="px-6 pb-6 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-full rounded-lg bg-navy text-white py-3 text-base font-medium min-h-[48px] hover:bg-navy/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
