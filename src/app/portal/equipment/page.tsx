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
  if (loading) return <div className="p-8 text-charcoal/60">Loading...</div>;

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        My Equipment
      </h1>

      <div className="space-y-6">
        <section className="bg-white border border-sand rounded-lg p-6 space-y-3">
          <h2 className="font-display text-xl text-navy">Current machine</h2>

          {device ? (
            <dl className="grid gap-3 md:grid-cols-2 text-sm">
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Brand</dt><dd>{device.brand ?? "-"}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Model</dt><dd>{device.name ?? device.model ?? "-"}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Serial number</dt><dd>{device.serial_number ?? "-"}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Set up</dt><dd>{formatDate(device.setup_date)}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Funded by</dt><dd>{device.funding_stream ?? "-"}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-charcoal/60">No machine on file.</p>
          )}
        </section>

        <section className="bg-white border border-sand rounded-lg p-6 space-y-3">
          <h2 className="font-display text-xl text-navy">Current mask</h2>

          {mask ? (
            <dl className="grid gap-3 md:grid-cols-2 text-sm">
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Brand</dt><dd>{mask.brand ?? "-"}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Model</dt><dd>{mask.name ?? "-"}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Type</dt><dd>{formatMaskType(mask.type)}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Size</dt><dd>{mask.size ?? "-"}</dd></div>
              <div><dt className="text-xs uppercase text-charcoal/60 font-mono">Fitted</dt><dd>{formatDate(mask.fitted_date)}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-charcoal/60">No mask on file.</p>
          )}
        </section>

        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <h2 className="font-display text-xl text-navy">Maintenance timeline</h2>
          <p className="text-sm text-charcoal/60">
            Maintenance records will appear here once connected to Midland Sleep records.
          </p>
          <p className="text-xs text-charcoal/60 pt-3 border-t border-sand">
            To arrange checks, call Midland Sleep on <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">0800 000 000</a>.
          </p>
        </section>

        <section className="bg-white border border-sand rounded-lg p-6 border-dashed">
          <h2 className="font-display text-xl text-navy mb-2">Previous equipment</h2>
          <p className="text-sm text-charcoal/60">
            Your machine and mask history will appear here in a future update.
          </p>
        </section>
      </div>
    </>
  );
}
