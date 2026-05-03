"use client";

import { useAuth } from "@/components/AuthProvider";
import {
  DEMO_MACHINES,
  DEMO_MASKS,
  DEMO_MAINTENANCE,
} from "@/lib/demoData";

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

export default function EquipmentPage() {
  const { patient } = useAuth();

  // Auth guard is in portal/layout.tsx — no redirect needed here.
  if (!patient) return null;

  const machine = DEMO_MACHINES[patient.userId];
  const mask = DEMO_MASKS[patient.userId];
  const maintenance = DEMO_MAINTENANCE[patient.userId] ?? [];

  const phoneLink = (
    <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">
      0800 000 000
    </a>
  );

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        My Equipment
      </h1>

      <div className="space-y-6">

        {/* Current Machine */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-3">
          <h2 className="font-display text-xl text-navy">Current machine</h2>
          {machine ? (
            <dl className="grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Brand</dt>
                <dd className="text-charcoal font-medium">{machine.brand}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Model</dt>
                <dd className="text-charcoal font-medium">{machine.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Serial number</dt>
                <dd className="text-charcoal font-mono">{machine.serial_number}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Set up</dt>
                <dd className="text-charcoal">{formatDate(machine.setup_date)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-charcoal/60">No machine on file.</p>
          )}
        </section>

        {/* Current Mask */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-3">
          <h2 className="font-display text-xl text-navy">Current mask</h2>
          {mask ? (
            <dl className="grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Brand</dt>
                <dd className="text-charcoal font-medium">{mask.brand}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Model</dt>
                <dd className="text-charcoal font-medium">{mask.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Type</dt>
                <dd className="text-charcoal">{formatMaskType(mask.type)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Size</dt>
                <dd className="text-charcoal font-medium">{mask.size}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">Fitted</dt>
                <dd className="text-charcoal">{formatDate(mask.fitted_date)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-charcoal/60">No mask on file.</p>
          )}
        </section>

        {/* Maintenance Timeline */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <h2 className="font-display text-xl text-navy">Maintenance timeline</h2>
          {maintenance.length === 0 ? (
            <p className="text-sm text-charcoal/60">No maintenance records on file.</p>
          ) : (
            <ul className="space-y-3">
              {maintenance.map((check) => {
                const isOverdue = check.status === "OVERDUE";
                const isDue = check.status === "DUE";
                return (
                  <li
                    key={check.check_type}
                    className={
                      isOverdue
                        ? "border border-amber/40 bg-sand-pale rounded-md p-3"
                        : "border border-sand rounded-md p-3"
                    }
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{check.label}</p>
                        <p className="text-xs text-charcoal/60 mt-1">
                          Last completed {formatDate(check.last_completed || check.due_date)}
                        </p>
                      </div>
                      <span
                        className={
                          isOverdue
                            ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber/10 text-charcoal border border-amber/40"
                            : isDue
                            ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-sand-pale text-charcoal border border-sand"
                            : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-seafoam-pale text-charcoal border border-seafoam/30"
                        }
                      >
                        {isOverdue ? "Overdue" : isDue ? "Due soon" : "OK"}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/60 mt-2">
                      Next due {formatDate(check.due_date)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-charcoal/60 pt-3 border-t border-sand">
            To arrange overdue checks, call Midland Sleep on {phoneLink}.
          </p>
        </section>

        {/* Previous equipment stub */}
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
