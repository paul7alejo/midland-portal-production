"use client";

import { usePatientData } from "@/hooks/usePatientData";
import { useAuth } from "@/components/AuthProvider";

function formatDate(iso?: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMaskType(type?: string): string {
  if (!type) return "-";
  if (type === "full_face") return "Full face";
  if (type === "nasal") return "Nasal";
  if (type === "nasal_pillow") return "Nasal pillow";
  return type;
}

export default function EquipmentPage() {
  const { patient } = useAuth();
  const { device, mask, loading } = usePatientData();

  if (!patient) return null;
  if (loading) return <div className="p-8 text-gray-700 text-lg leading-7">Loading...</div>;

  return (
    <>
      <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-3">
        My Equipment
      </h1>
      <p className="text-lg leading-7 text-charcoal/80 mb-7">
        These are the current equipment details held by Midland Sleep.
      </p>

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
          )}
        </section>

        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
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
          )}
        </section>

        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-navy leading-snug">Maintenance timeline</h2>
          <p className="text-lg leading-7 text-gray-800">
            Maintenance records will appear here once connected to Midland Sleep records.
          </p>
          <p className="text-lg leading-7 text-gray-800 pt-4 border-t border-sand">
            To arrange checks, call Midland Sleep on <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">0800 000 000</a>.
          </p>
        </section>

        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 border-dashed">
          <h2 className="font-display text-2xl font-semibold text-navy mb-3 leading-snug">Previous equipment</h2>
          <p className="text-lg leading-7 text-gray-800">
            Your machine and mask history will appear here in a future update.
          </p>
        </section>
      </div>
    </>
  );
}
