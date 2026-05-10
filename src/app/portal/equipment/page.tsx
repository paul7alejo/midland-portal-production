"use client";

import { usePatientData } from "@/hooks/usePatientData";
import { useAuth } from "@/components/AuthProvider";

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

function formatMaskType(type?: string): string {
  if (!type) return "Not recorded";
  if (type === "full_face") return "Full face";
  if (type === "nasal") return "Nasal";
  if (type === "nasal_pillow") return "Nasal pillow";
  return type;
}

function displayValue(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed || "Not recorded";
}

function DetailItem({
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
      <dt className="mb-1.5 font-mono text-sm uppercase text-gray-700">
        {label}
      </dt>
      <dd
        className={`text-lg leading-7 text-charcoal ${
          mono ? "break-all font-mono" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function EquipmentPage() {
  const { patient } = useAuth();
  const { device, mask, loading } = usePatientData();

  if (!patient) return null;
<<<<<<< HEAD
  if (loading) return <div className="p-8 text-gray-700 text-lg leading-7">Loading...</div>;
=======
  if (loading) {
    return <div className="p-8 text-lg text-gray-700">Loading equipment...</div>;
  }

  const machineName = device
    ? [device.brand, device.name ?? device.model].filter(Boolean).join(" ") ||
      "Machine details not recorded"
    : "";
  const maskName = mask
    ? [mask.brand, mask.name].filter(Boolean).join(" ") ||
      "Mask details not recorded"
    : "";
>>>>>>> chore/day-45-cpap-visual-polish

  return (
    <>
      <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-3">
        My Equipment
      </h1>
      <p className="text-lg leading-7 text-charcoal/80 mb-7">
        These are the current equipment details held by Midland Sleep.
      </p>

<<<<<<< HEAD
      <div className="space-y-7">
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-navy leading-snug">Current machine</h2>

          {device ? (
            <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2 text-lg leading-7">
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Brand</dt><dd className="text-charcoal font-medium">{device.brand ?? "Not recorded"}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Model</dt><dd className="text-charcoal font-medium">{device.name ?? device.model ?? "Not recorded"}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Serial number</dt><dd className="text-charcoal font-mono break-all">{device.serial_number ?? "Not recorded"}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Set up</dt><dd className="text-charcoal">{formatDate(device.setup_date)}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Funded by</dt><dd className="text-charcoal font-medium">{device.funding_stream ?? "Not recorded"}</dd></div>
            </dl>
          ) : (
            <p className="text-lg leading-7 text-gray-800">
              No machine is on file. If this looks wrong, please contact Midland Sleep.
            </p>
=======
      <div className="space-y-6">
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 font-mono text-sm uppercase text-gray-700">
                CPAP machine
              </p>
              <h2 className="font-display text-[24px] font-semibold text-navy">
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
            <div className="space-y-5">
              <div className="rounded-xl border border-sand bg-sand-pale/50 p-5">
                <p className="mb-1 font-mono text-sm uppercase text-gray-700">
                  Machine name
                </p>
                <p className="text-2xl font-semibold leading-8 text-charcoal">
                  {machineName}
                </p>
                <p className="mt-3 text-base leading-7 text-charcoal/75">
                  Serial number{" "}
                  <span className="font-mono text-charcoal break-all">
                    {displayValue(device.serial_number)}
                  </span>
                </p>
              </div>

              <dl className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Brand" value={displayValue(device.brand)} />
                <DetailItem
                  label="Model"
                  value={displayValue(device.name ?? device.model)}
                />
                <DetailItem
                  label="Set up"
                  value={formatDate(device.setup_date)}
                />
                <DetailItem
                  label="Funded by"
                  value={displayValue(device.funding_stream)}
                />
              </dl>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-sand bg-sand-pale/50 p-5">
              <p className="text-xl font-semibold text-charcoal">
                No machine is on file
              </p>
              <p className="mt-2 text-lg leading-7 text-gray-700">
                If this looks wrong, contact Midland Sleep so we can check your
                equipment record.
              </p>
            </div>
>>>>>>> chore/day-45-cpap-visual-polish
          )}
        </section>

        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
<<<<<<< HEAD
          <h2 className="font-display text-2xl font-semibold text-navy leading-snug">Current mask</h2>

          {mask ? (
            <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2 text-lg leading-7">
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Brand</dt><dd className="text-charcoal font-medium">{mask.brand ?? "Not recorded"}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Model</dt><dd className="text-charcoal font-medium">{mask.name ?? "Not recorded"}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Type</dt><dd className="text-charcoal">{formatMaskType(mask.type)}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Size</dt><dd className="text-charcoal font-medium">{mask.size ?? "Not recorded"}</dd></div>
              <div><dt className="text-sm uppercase tracking-wide text-gray-700 font-mono mb-1.5">Fitted</dt><dd className="text-charcoal">{formatDate(mask.fitted_date)}</dd></div>
            </dl>
          ) : (
            <p className="text-lg leading-7 text-gray-800">
              No mask is on file. If you use a Midland Sleep mask, please contact us so we can check your record.
            </p>
=======
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 font-mono text-sm uppercase text-gray-700">
                Mask
              </p>
              <h2 className="font-display text-[24px] font-semibold text-navy">
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
            <div className="space-y-5">
              <div className="rounded-xl border border-sand bg-sand-pale/50 p-5">
                <p className="mb-1 font-mono text-sm uppercase text-gray-700">
                  Mask name
                </p>
                <p className="text-2xl font-semibold leading-8 text-charcoal">
                  {maskName}
                </p>
                <p className="mt-3 text-base leading-7 text-charcoal/75">
                  {formatMaskType(mask.type)} mask
                  {mask.size ? `, size ${mask.size}` : ""}
                </p>
              </div>

              <dl className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Brand" value={displayValue(mask.brand)} />
                <DetailItem label="Model" value={displayValue(mask.name)} />
                <DetailItem label="Type" value={formatMaskType(mask.type)} />
                <DetailItem label="Size" value={displayValue(mask.size)} />
                <DetailItem
                  label="Fitted"
                  value={formatDate(mask.fitted_date)}
                />
              </dl>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-sand bg-sand-pale/50 p-5">
              <p className="text-xl font-semibold text-charcoal">
                No mask is on file
              </p>
              <p className="mt-2 text-lg leading-7 text-gray-700">
                Mask details will appear here after Midland Sleep has confirmed
                your current equipment record.
              </p>
            </div>
>>>>>>> chore/day-45-cpap-visual-polish
          )}
        </section>

        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-4">
<<<<<<< HEAD
          <h2 className="font-display text-2xl font-semibold text-navy leading-snug">Maintenance timeline</h2>
          <p className="text-lg leading-7 text-gray-800">
            Maintenance records will appear here once connected to Midland Sleep records.
          </p>
          <p className="text-lg leading-7 text-gray-800 pt-4 border-t border-sand">
=======
          <h2 className="font-display text-[24px] font-semibold text-navy">Maintenance timeline</h2>
          <p className="text-lg leading-7 text-gray-700">
            Maintenance records will appear here once connected to Midland Sleep records.
          </p>
          <p className="text-lg leading-7 text-gray-700 pt-3 border-t border-sand">
>>>>>>> chore/day-45-cpap-visual-polish
            To arrange checks, call Midland Sleep on <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">0800 000 000</a>.
          </p>
        </section>

        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 border-dashed">
<<<<<<< HEAD
          <h2 className="font-display text-2xl font-semibold text-navy mb-3 leading-snug">Previous equipment</h2>
          <p className="text-lg leading-7 text-gray-800">
=======
          <h2 className="font-display text-[24px] font-semibold text-navy mb-2">Previous equipment</h2>
          <p className="text-lg leading-7 text-gray-700">
>>>>>>> chore/day-45-cpap-visual-polish
            Your machine and mask history will appear here in a future update.
          </p>
        </section>
      </div>
    </>
  );
}
