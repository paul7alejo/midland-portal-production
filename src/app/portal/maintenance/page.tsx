"use client";

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
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

type CheckStatus = "OVERDUE" | "OK";

interface MaintenanceCheck {
  check_type: "safety_check" | "mask_check";
  label: string;
  status: CheckStatus;
  last_completed: string;
  due_date: Date;
}

export default function MaintenancePage() {
  const { patient } = useAuth();
  const { device, mask, loading } = usePatientData();

  if (loading) return <div className="p-8 text-charcoal/80 text-lg leading-7">Loading...</div>;
  if (!patient) return null;

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
      <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-2">
        Maintenance
      </h1>
      <p className="text-lg leading-7 text-charcoal/80 mb-7">
        Check when your CPAP equipment may need a Midland Sleep review.
      </p>

      <div className="space-y-7">

        {/* Machine info header */}
        {device && (
          <div className="bg-white border border-sand rounded-2xl p-5 md:p-6">
            <div className="grid gap-5 sm:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.3fr)] sm:items-center">
              <EquipmentVisual type="machine" className="h-44 w-full min-w-0 sm:h-52" />
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                  Your machine
                </p>
                <p className="text-2xl leading-8 text-charcoal font-semibold">
                  {displayValue(device.brand)} {displayValue(device.model, device.name)}
                </p>
                <p className="mt-2 text-base leading-6 text-charcoal/80 break-words">
                  Set up {formatDateValue(device.setup_date, "Setup date not recorded yet")}
                </p>
                <p className="mt-1 text-base leading-6 text-charcoal/80 break-all">
                  Serial <span className="font-mono text-charcoal">{displayValue(device.serial_number)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {mask && (
          <div className="bg-white border border-sand rounded-2xl p-5 md:p-6">
            <div className="grid gap-5 sm:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.3fr)] sm:items-center">
              <EquipmentVisual type="mask" className="h-44 w-full min-w-0 sm:h-52" />
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                  Your mask
                </p>
                <p className="text-2xl leading-8 text-charcoal font-semibold">
                  {displayValue(mask.brand)} {displayValue(mask.name)}
                </p>
                <p className="mt-2 text-base leading-6 text-charcoal/80">
                  Size <span className="font-medium text-charcoal">{displayValue(mask.size)}</span>
                </p>
                <p className="mt-1 text-base leading-6 text-charcoal/80">
                  Fitted {formatDateValue(mask.fitted_date, "Fit date not recorded yet")}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasUnscheduledEquipment && (
          <div className="bg-white border border-sand rounded-2xl p-6 md:p-7">
            <p className="text-lg leading-7 text-charcoal/80">
              Maintenance guidance will appear once your equipment setup date is confirmed.
            </p>
          </div>
        )}

        {/* Maintenance checks */}
        {maintenance.map((check) => {
          const isOverdue = check.status === "OVERDUE";
          const isSafetyCheck = check.check_type === "safety_check";

          return (
            <section
              key={check.check_type}
              className={cn(
                "bg-white border rounded-2xl p-6 md:p-7 space-y-5",
                isOverdue ? "border-amber/40" : "border-sand"
              )}
            >
              <div className="flex flex-col justify-between items-start gap-3 sm:flex-row">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-navy leading-snug">
                    {check.label}
                  </h2>
                  <p className="text-lg leading-7 text-charcoal/80 mt-1">
                    {isSafetyCheck
                      ? "Midland Sleep can arrange an annual machine safety check."
                      : "Midland Sleep can review your mask and cushion if they need attention."}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1.5 text-base font-medium whitespace-nowrap",
                    isOverdue
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : "bg-seafoam-pale text-charcoal border border-seafoam/30"
                  )}
                >
                  {isOverdue ? "Overdue" : "OK"}
                </span>
              </div>

              <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2 text-lg leading-7">
                <div>
                  <dt className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
                    Last completed
                  </dt>
                  <dd className="text-charcoal">
                    {formatDateValue(check.last_completed)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
                    Next due
                  </dt>
                  <dd className={cn("font-medium", isOverdue ? "text-amber" : "text-charcoal")}>
                    {formatDate(check.due_date)}
                  </dd>
                </div>
              </dl>

              {isOverdue && (
                <div className="bg-sand-pale border border-amber/20 rounded-md p-4">
                  <p className="text-lg leading-7 text-charcoal">
                    {isSafetyCheck
                      ? "This check is overdue. Please contact Midland Sleep to arrange an appointment."
                      : "Your mask is due for a check. Please contact Midland Sleep to arrange a review."}
                  </p>
                  <p className="text-lg leading-7 text-charcoal/85 mt-2">
                    Call {phoneLink} or email {emailLink}
                  </p>
                </div>
              )}

              {!isOverdue && (
                <p className="text-lg leading-7 text-charcoal/80">
                  Nothing to arrange right now. Contact Midland Sleep if your equipment details look wrong.
                </p>
              )}
            </section>
          );
        })}

        {maintenance.length === 0 && !hasUnscheduledEquipment && (
          <div className="bg-white border border-sand rounded-2xl p-6 md:p-7">
            <p className="text-lg leading-7 text-charcoal/80">
              No maintenance records are on file. Contact Midland Sleep if you think a check is due.
            </p>
          </div>
        )}

        {/* General info */}
        <section className="bg-sand-pale border border-sand rounded-2xl p-6 md:p-7">
          <h2 className="font-display text-2xl font-semibold text-navy mb-3 leading-snug">
            About CPAP maintenance
          </h2>
          <div className="text-lg leading-7 text-charcoal/85 space-y-3">
            <p>
              <span className="font-medium text-charcoal">Safety checks</span> are
              arranged by Midland Sleep when needed for your machine.
            </p>
            <p>
              <span className="font-medium text-charcoal">Mask checks</span> ensure
              Midland Sleep can review your mask, cushion, and fit if something feels wrong.
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
