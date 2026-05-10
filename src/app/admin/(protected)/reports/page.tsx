export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
          Finance & funding
        </p>
        <h1 className="font-display text-3xl font-bold text-navy">Reports</h1>
        <p className="max-w-3xl text-base leading-6 text-gray-600">
          Management reporting area for operational summaries, funding views, and export-led review.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Reporting workspace</h2>
            <p className="mt-2 max-w-2xl text-base leading-6 text-gray-600">
              This module is not a full analytics dashboard yet. Use the imported
              patient export and import evidence outputs for Phase 1 reporting.
            </p>
          </div>
          <span className="inline-flex text-sm font-medium px-3 py-1 rounded-full bg-[#0B5C6C]/10 text-[#0B5C6C]">
            Planned module
          </span>
        </div>
      </section>
    </div>
  );
}
