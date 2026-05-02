"use client";

import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import {
  DEMO_MACHINES,
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

export default function MaintenancePage() {
  const { patient } = useAuth();

  if (!patient) return null;

  const machine = DEMO_MACHINES[patient.id];
  const maintenance = DEMO_MAINTENANCE[patient.id] ?? [];

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
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Maintenance
      </h1>
      <p className="text-sm text-charcoal/70 mb-6">
        Keeping your CPAP equipment safe and effective.
      </p>

      <div className="space-y-6">

        {/* Machine info header */}
        {machine && (
          <div className="bg-white border border-sand rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
              Your machine
            </p>
            <p className="text-charcoal font-medium">
              {machine.brand} {machine.name}
            </p>
            <p className="text-xs text-charcoal/60">
              Set up {formatDate(machine.setup_date)} - Serial: {machine.serial_number}
            </p>
          </div>
        )}

        {/* Maintenance checks */}
        {maintenance.map((check) => {
          const isOverdue = check.status === "OVERDUE";
          const isDue = check.status === "DUE";
          const isOk = check.status === "OK";
          const isSafetyCheck = check.check_type === "safety_check";

          return (
            <section
              key={check.check_type}
              className={cn(
                "bg-white border rounded-lg p-6 space-y-4",
                isOverdue ? "border-amber/40" : "border-sand"
              )}
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="font-display text-xl text-navy">
                    {check.label}
                  </h2>
                  <p className="text-sm text-charcoal/70 mt-1">
                    {isSafetyCheck
                      ? "Annual electrical safety check required for all CPAP machines."
                      : "Water chambers should be replaced regularly for hygiene and performance."}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
                    isOverdue
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : isDue
                      ? "bg-sand-pale text-charcoal border border-sand"
                      : "bg-seafoam-pale text-charcoal border border-seafoam/30"
                  )}
                >
                  {isOverdue ? "Overdue" : isDue ? "Due soon" : "OK"}
                </span>
              </div>

              <dl className="grid gap-3 md:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">
                    Last completed
                  </dt>
                  <dd className="text-charcoal">
                    {formatDate(check.last_completed || check.due_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono">
                    Next due
                  </dt>
                  <dd className={cn("font-medium", isOverdue ? "text-amber" : "text-charcoal")}>
                    {formatDate(check.due_date)}
                  </dd>
                </div>
              </dl>

              {/* Action guidance */}
              {isOverdue && (
                <div className="bg-sand-pale border border-amber/20 rounded-md p-3">
                  <p className="text-sm text-charcoal">
                    {isSafetyCheck
                      ? "This check is overdue. Please contact Midland Sleep to arrange an appointment."
                      : "Your water chamber is due for replacement. Water chambers are not available through this portal. Please contact Midland Sleep to arrange replacement."}
                  </p>
                  <p className="text-sm text-charcoal/80 mt-2">
                    Call {phoneLink} or email {emailLink}
                  </p>
                </div>
              )}

              {isDue && (
                <div className="bg-sand-pale border border-sand rounded-md p-3">
                  <p className="text-sm text-charcoal">
                    {isSafetyCheck
                      ? "This check is coming up. Midland Sleep will be in touch to arrange a time."
                      : "Your water chamber is due for replacement soon. Water chambers are not available through this portal. Please contact Midland Sleep to arrange replacement."}
                  </p>
                  <p className="text-sm text-charcoal/80 mt-2">
                    Call {phoneLink} or email {emailLink}
                  </p>
                </div>
              )}

              {isOk && (
                <p className="text-sm text-charcoal/60">
                  Nothing to do right now. We will remind you when this is due.
                </p>
              )}
            </section>
          );
        })}

        {maintenance.length === 0 && (
          <div className="bg-white border border-sand rounded-lg p-6">
            <p className="text-sm text-charcoal/60">
              No maintenance records on file.
            </p>
          </div>
        )}

        {/* General info */}
        <section className="bg-sand-pale border border-sand rounded-lg p-6">
          <h2 className="font-display text-lg text-navy mb-2">
            About CPAP maintenance
          </h2>
          <div className="text-sm text-charcoal/80 space-y-2">
            <p>
              <span className="font-medium text-charcoal">Safety checks</span> are
              required annually for all CPAP machines. These involve an electrical
              safety inspection by a qualified technician.
            </p>
            <p>
              <span className="font-medium text-charcoal">Water chambers</span> should
              be replaced regularly to maintain hygiene and performance. Replacements
              are arranged through Midland Sleep directly.
            </p>
            <p>
              For any maintenance questions, call {phoneLink}.
            </p>
          </div>
        </section>

      </div>
    </>
  );
}
