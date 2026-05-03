"use client";

import { useAuth } from "@/components/AuthProvider";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { patient } = useAuth();
  if (!patient) return null;

  const phoneLink = (
    <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">
      0800 000 000
    </a>
  );

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        My profile
      </h1>
      <p className="text-sm text-charcoal/70 mb-6">
        Your contact details and funding information.
      </p>

      <div className="space-y-6">

        {/* CARD 1 — YOUR DETAILS */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl text-navy">Your details</h2>
            <p className="text-sm text-charcoal/70 mt-1">
              If anything here is incorrect, please contact Midland Sleep.
            </p>
          </div>

          <dl className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                Full name
              </dt>
              <dd className="font-medium text-charcoal">{patient.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                Midland Sleep ID
              </dt>
              <dd className="font-mono text-charcoal">{patient.msid}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                Email
              </dt>
              <dd className="text-charcoal">{patient.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                Phone
              </dt>
              <dd className="text-charcoal">
                {(patient as any).phone ?? "Not on file"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                Date of birth
              </dt>
              <dd className="text-charcoal">{formatDate((patient as any).dob ?? "")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                Funding stream
              </dt>
              <dd className="text-charcoal font-medium">
                {((patient as any).funding_stream ?? "ACC") === "ACC" ? "ACC" : "Health NZ"}
              </dd>
            </div>
          </dl>

          <div className="pt-3 border-t border-sand">
            <p className="text-xs text-charcoal/60">
              To update your personal or equipment details, call Midland Sleep on {phoneLink}.
            </p>
          </div>
        </section>

        {/* CARD 2 — MASKED NHI */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-3">
          <div>
            <h2 className="font-display text-xl text-navy">NHI number</h2>
            <p className="text-sm text-charcoal/70 mt-1">
              For privacy, your NHI is masked in this view.
            </p>
          </div>

          <div className="bg-sand-pale rounded-md px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
              Masked NHI
            </p>
            <p className="text-lg font-mono text-charcoal font-medium">
              {(patient as any).nhi_masked ?? "ZZZ****"}
            </p>
          </div>

          <p className="text-xs text-charcoal/60">
            In the production system, you will be able to briefly reveal your
            NHI after confirming the reason. The full number will show for 30
            seconds and then automatically hide. For this demo, only the masked
            version is shown.
          </p>
        </section>

      </div>
    </>
  );
}
