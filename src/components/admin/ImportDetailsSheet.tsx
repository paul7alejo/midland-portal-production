"use client";

import type { CompletedBatch } from "@/components/admin/ImportHistoryTable";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CFG: Record<
  CompletedBatch["status"],
  { label: string; badgeCls: string; borderCls: string }
> = {
  success:     { label: "Success",     badgeCls: "bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35", borderCls: "border-l-[#74C0A2]" },
  partial:     { label: "Partial",     badgeCls: "bg-amber-100 text-amber-800 border border-amber-200",       borderCls: "border-l-amber-500"   },
  all_skipped: { label: "All skipped", badgeCls: "bg-amber-100 text-amber-800 border border-amber-200",       borderCls: "border-l-amber-500"   },
  failed:      { label: "Failed",      badgeCls: "bg-red-100 text-red-800 border border-red-200",             borderCls: "border-l-red-500"     },
};

export function ImportDetailsSheet({
  batch,
  onClose,
}: {
  batch: CompletedBatch;
  onClose: () => void;
}) {
  const cfg = STATUS_CFG[batch.status];
  const hasPortalActivity =
    batch.portalUsersCreated.length > 0 ||
    batch.portalUsersAlreadyExisted > 0 ||
    batch.portalUserFailures > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Import batch details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-sand-pale shadow-2xl overflow-y-auto"
      >
        {/* Sheet header */}
        <div className="sticky top-0 bg-white border-b border-sand px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono text-charcoal/55 uppercase tracking-wide">Batch details</p>
            <h2 className="text-base font-semibold text-navy mt-0.5 break-all">{batch.batchId}</h2>
            <p className="text-xs text-charcoal/60 mt-0.5 font-mono">{formatDateTime(batch.executedAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">

          {/* Summary */}
          <div className={`bg-white border border-sand border-l-4 ${cfg.borderCls} rounded-xl p-5 space-y-4 shadow-[0_16px_45px_rgba(11,42,60,0.08)]`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide">Batch summary</p>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badgeCls}`}>{cfg.label}</span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 border-b border-sand pb-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/55">Imported by</dt>
                <dd className="mt-1 text-sm font-medium text-charcoal">{batch.importedBy}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/55">Records</dt>
                <dd className="mt-1 font-mono text-sm font-medium text-charcoal">{batch.totalRows}</dd>
              </div>
            </dl>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className={`text-2xl font-bold font-mono tabular-nums ${batch.created > 0 ? "text-[#0B5C6C]" : "text-gray-400"}`}>
                  {batch.created}
                </span>
                <p className="text-xs text-charcoal/60 mt-0.5">Created</p>
              </div>
              <div>
                <span className={`text-2xl font-bold font-mono tabular-nums ${batch.skipped > 0 ? "text-amber-700" : "text-gray-400"}`}>
                  {batch.skipped}
                </span>
                <p className="text-xs text-charcoal/60 mt-0.5">Skipped</p>
              </div>
              <div>
                <span className={`text-2xl font-bold font-mono tabular-nums ${batch.failed > 0 ? "text-red-700" : "text-gray-400"}`}>
                  {batch.failed}
                </span>
                <p className="text-xs text-charcoal/60 mt-0.5">Failed</p>
              </div>
            </div>
            {hasPortalActivity && (
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-3">
                <div>
                  <span className={`text-2xl font-bold font-mono tabular-nums ${batch.portalUsersCreated.length > 0 ? "text-[#0B5C6C]" : "text-gray-400"}`}>
                    {batch.portalUsersCreated.length}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">Portal users created</p>
                </div>
                <div>
                  <span className={`text-2xl font-bold font-mono tabular-nums ${batch.portalUsersAlreadyExisted > 0 ? "text-charcoal" : "text-gray-400"}`}>
                    {batch.portalUsersAlreadyExisted}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">Already login-enabled</p>
                </div>
                <div>
                  <span className={`text-2xl font-bold font-mono tabular-nums ${batch.portalUserFailures > 0 ? "text-red-700" : "text-gray-400"}`}>
                    {batch.portalUserFailures}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">Portal access failures</p>
                </div>
              </div>
            )}
          </div>

          {/* Temporary passwords */}
          {batch.portalUsersCreated.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-200 space-y-1">
                <h3 className="text-sm font-semibold text-amber-900">Safe credential summary</h3>
                <p className="text-xs text-amber-800 font-semibold">
                  Temporary passwords are only shown because they are available in the current import result.
                </p>
                <p className="text-xs text-amber-700">
                  Patients log in with their number-only username (no MS- prefix). Password must be changed on first login.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-100 border-b border-amber-200">
                      {["Row", "Patient name", "Portal ID", "Login username", "Temporary password"].map((col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-xs font-semibold text-amber-900 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {batch.portalUsersCreated.map((u) => (
                      <tr key={u.rowNumber} className="bg-white">
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{u.rowNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                        <td className="px-4 py-3 font-mono text-gray-700">{u.portalId}</td>
                        <td className="px-4 py-3 font-mono text-gray-700">{u.username}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-amber-900 select-all">
                          {u.temporaryPassword}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed rows */}
          {batch.failedRows.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-red-100">
                <h4 className="text-sm font-semibold text-red-800">Failed rows ({batch.failedRows.length})</h4>
                <p className="text-xs text-red-700 mt-0.5">No patient records were created for these rows.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-100">
                      {["Row", "Patient name", "Machine serial", "Reason"].map((col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-xs font-semibold text-red-800 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {batch.failedRows.map((row, i) => (
                      <tr key={i} className="hover:bg-red-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name || "—"}</td>
                        <td className="px-4 py-3 font-mono text-gray-600">{row.machineSerial || "—"}</td>
                        <td className="px-4 py-3 text-red-700">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skipped rows */}
          {batch.skippedRows.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100">
                <h4 className="text-sm font-semibold text-amber-800">Skipped rows ({batch.skippedRows.length})</h4>
                <p className="text-xs text-amber-700 mt-0.5">These rows were not imported — no records were created for them.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-50 border-b border-amber-100">
                      {["Row", "Patient name", "Machine serial", "Reason"].map((col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-xs font-semibold text-amber-800 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {batch.skippedRows.map((row, i) => (
                      <tr key={i} className="hover:bg-amber-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name || "—"}</td>
                        <td className="px-4 py-3 font-mono text-gray-600">{row.machineSerial || "—"}</td>
                        <td className="px-4 py-3 text-amber-700">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Portal access failures */}
          {batch.portalUserFailureDetails.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-red-100">
                <h4 className="text-sm font-semibold text-red-800">
                  Portal access failures ({batch.portalUserFailureDetails.length})
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Patient records were created, but portal login was not set up for these rows.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-100">
                      {["Row", "Patient name", "Reason"].map((col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-xs font-semibold text-red-800 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {batch.portalUserFailureDetails.map((row, i) => (
                      <tr key={i} className="hover:bg-red-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name || "—"}</td>
                        <td className="px-4 py-3 text-red-700">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
