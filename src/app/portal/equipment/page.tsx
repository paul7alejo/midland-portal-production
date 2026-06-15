"use client";

import { useEffect, useRef, useState } from "react";
import { usePatientData } from "@/hooks/usePatientData";
import { useAuth } from "@/components/AuthProvider";
import EquipmentVisual from "@/components/portal/EquipmentVisual";

function formatDate(iso?: string): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addYears(iso?: string, years = 5): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}

function formatMaskType(type?: string): string {
  if (!type) return "Not recorded";
  if (type === "full_face") return "Full face";
  if (type === "nasal") return "Nasal";
  if (type === "nasal_pillow") return "Nasal pillow";
  return type;
}

function displayValue(value?: string | null): string {
  return value?.trim() || "Not recorded";
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

type ModalType = "machine" | "mask" | null;

export default function EquipmentPage() {
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

  if (!patient) return null;
  if (loading)
    return (
      <div className="p-8 text-charcoal/70 text-base leading-6">
        Loading equipment...
      </div>
    );

  const machineName = device
    ? device.name ||
      [device.brand, device.model].filter(Boolean).join(" ") ||
      "Machine details not recorded"
    : "";
  const maskName = mask
    ? mask.name || mask.brand || "Mask details not recorded"
    : "";
  const replacementDue = addYears(device?.setup_date);

  return (
    <>
      <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-semibold text-navy mb-2">
        My Equipment
      </h1>
      <p className="text-base leading-6 text-charcoal/80 mb-4">
        These are the current equipment details held by Midland Sleep.
      </p>

      <div className="space-y-4">
        {/* Two-column grid on desktop */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Machine card */}
          <section className="bg-white border border-sand rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-charcoal/70">
                  CPAP machine
                </p>
                <h2 className="font-display text-xl font-semibold text-navy leading-snug">
                  Current machine
                </h2>
              </div>
              {device && (
                <span className="rounded-full border border-deep-teal/20 bg-sky-blue px-3 py-1 text-sm font-medium text-deep-teal">
                  On file
                </span>
              )}
            </div>

            {device ? (
              <>
                <button
                  type="button"
                  onClick={() => setModal("machine")}
                  className="group relative w-full rounded-xl bg-gradient-to-br from-[#f0f4f5] to-[#e8eeef] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
                  aria-label={`View ${machineName || "machine"} details`}
                >
                  <EquipmentVisual type="machine" className="h-48 w-full" />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-navy/20">
                    <span className="bg-navy/80 text-white text-sm px-3 py-1.5 rounded-full">
                      View details
                    </span>
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="font-semibold text-charcoal text-lg leading-snug break-words">
                    {machineName}
                  </p>
                  <p className="text-sm text-charcoal/70 mt-1">
                    Set up {formatDate(device.setup_date)}
                  </p>
                  {replacementDue && (
                    <p className="text-sm text-charcoal/70">
                      Replacement due {formatDate(replacementDue)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setModal("machine")}
                  className="text-sm text-deep-teal font-medium hover:underline focus:outline-none focus-visible:underline self-start"
                >
                  View full details →
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-sand bg-sand-pale/50 p-5 flex-1">
                <p className="font-semibold text-charcoal">
                  No machine is on file
                </p>
                <p className="mt-1 text-base leading-6 text-charcoal/80">
                  If this looks wrong, please contact Midland Sleep so we can
                  check your equipment record.
                </p>
              </div>
            )}
          </section>

          {/* Mask card */}
          <section className="bg-white border border-sand rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-charcoal/70">
                  Mask
                </p>
                <h2 className="font-display text-xl font-semibold text-navy leading-snug">
                  Current mask
                </h2>
              </div>
              {mask && (
                <span className="rounded-full border border-deep-teal/20 bg-sky-blue px-3 py-1 text-sm font-medium text-deep-teal">
                  On file
                </span>
              )}
            </div>

            {mask ? (
              <>
                <button
                  type="button"
                  onClick={() => setModal("mask")}
                  className="group relative w-full rounded-xl bg-gradient-to-br from-[#eef5f0] to-[#e5ede8] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
                  aria-label={`View ${maskName || "mask"} details`}
                >
                  <EquipmentVisual type="mask" className="h-48 w-full" />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-deep-teal/10">
                    <span className="bg-navy/80 text-white text-sm px-3 py-1.5 rounded-full">
                      View details
                    </span>
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="font-semibold text-charcoal text-lg leading-snug break-words">
                    {maskName}
                  </p>
                  <p className="text-sm text-charcoal/70 mt-1">
                    Fitted {formatDate(mask.fitted_date)}
                  </p>
                  <p className="text-sm text-charcoal/70">
                    Size: {displayValue(mask.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModal("mask")}
                  className="text-sm text-deep-teal font-medium hover:underline focus:outline-none focus-visible:underline self-start"
                >
                  View full details →
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-sand bg-sand-pale/50 p-5 flex-1">
                <p className="font-semibold text-charcoal">No mask is on file</p>
                <p className="mt-1 text-base leading-6 text-charcoal/80">
                  If you use a Midland Sleep mask, please contact us so we can
                  check your record.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="bg-white border border-sand rounded-xl p-4">
          <h2 className="font-display text-lg font-semibold text-navy mb-1.5 leading-snug">
            Maintenance timeline
          </h2>
          <p className="text-base leading-6 text-charcoal/80">
            Maintenance records will appear here once connected to Midland Sleep
            records. To arrange checks, call{" "}
            <a
              href="tel:0800000000"
              className="text-deep-teal font-medium hover:underline"
            >
              0800 000 000
            </a>
            .
          </p>
        </section>

        <section className="bg-white border border-dashed border-sand rounded-xl p-4">
          <h2 className="font-display text-lg font-semibold text-navy mb-1.5 leading-snug">
            Previous equipment
          </h2>
          <p className="text-base leading-6 text-charcoal/80">
            Your machine and mask history will appear here in a future update.
          </p>
        </section>
      </div>

      {/* Equipment detail modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={modal === "machine" ? "Machine details" : "Mask details"}
        >
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setModal(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[calc(100dvh-4.5rem)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[min(90dvh,42rem)] sm:max-w-md sm:rounded-2xl">
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

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 pb-8 space-y-4">
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
                    <DetailRow label="Set up" value={formatDate(device.setup_date)} />
                    <DetailRow
                      label="Replacement due"
                      value={
                        replacementDue ? formatDate(replacementDue) : "Not recorded"
                      }
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
                    <DetailRow label="Fitted" value={formatDate(mask.fitted_date)} />
                  </dl>
                </>
              )}
            </div>

            <div className="sticky bottom-0 shrink-0 border-t border-sand bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
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
