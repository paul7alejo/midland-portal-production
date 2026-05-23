"use client";

export type CompletedBatch = {
  batchId: string;
  executedAt: string;
  importedBy: string;
  totalRows: number;
  created: number;
  skipped: number;
  failed: number;
  status: "success" | "partial" | "all_skipped" | "failed";
  portalUsersCreated: Array<{
    rowNumber: number;
    name: string;
    portalId: string;
    username: string;
  }>;
  portalUsersAlreadyExisted: number;
  portalUserFailures: number;
  failedRows: Array<{ rowNumber: number; name: string; machineSerial: string; reason: string }>;
  skippedRows: Array<{ rowNumber: number; name: string; machineSerial: string; reason: string }>;
  portalUserFailureDetails: Array<{ rowNumber: number; name: string; reason: string }>;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CFG: Record<CompletedBatch["status"], { label: string; className: string }> = {
  success:     { label: "Success",     className: "bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35" },
  partial:     { label: "Partial",     className: "bg-amber-100 text-amber-800 border border-amber-200"    },
  all_skipped: { label: "All skipped", className: "bg-amber-100 text-amber-800 border border-amber-200"    },
  failed:      { label: "Failed",      className: "bg-red-100 text-red-800 border border-red-200"        },
};

export function ImportHistoryTable({
  batches,
  onViewDetails,
}: {
  batches: CompletedBatch[];
  onViewDetails: (batch: CompletedBatch) => void;
}) {
  return (
    <div className="bg-white border border-sand rounded-xl overflow-hidden shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
      <div className="px-5 py-4 border-b border-sand flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-navy">Import History</h2>
          <p className="text-sm text-charcoal/65 mt-0.5">Each row is an executed import batch. Select View Details to see created, skipped, and failed records.</p>
        </div>
        <span className="text-xs font-mono text-charcoal/50">
          {batches.length} batch{batches.length !== 1 ? "es" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-sand-pale/70 border-b border-sand">
              {["Batch ID", "Date / Time", "Imported by", "Records", "Created", "Skipped", "Failed", "Status", "View Details"].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/70">
            {batches.map((batch) => {
              const cfg = STATUS_CFG[batch.status];
              return (
                <tr key={batch.batchId} className="hover:bg-sand-pale/45 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-charcoal whitespace-nowrap max-w-[180px] truncate">
                    {batch.batchId}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal/75 whitespace-nowrap">
                    {formatDateTime(batch.executedAt)}
                  </td>
                  <td className="px-4 py-3 text-charcoal whitespace-nowrap">{batch.importedBy}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-charcoal/75">{batch.totalRows}</td>
                  <td className={`px-4 py-3 font-mono tabular-nums font-semibold ${batch.created > 0 ? "text-[#0B5C6C]" : "text-gray-400"}`}>
                    {batch.created}
                  </td>
                  <td className={`px-4 py-3 font-mono tabular-nums font-semibold ${batch.skipped > 0 ? "text-amber-700" : "text-gray-400"}`}>
                    {batch.skipped}
                  </td>
                  <td className={`px-4 py-3 font-mono tabular-nums font-semibold ${batch.failed > 0 ? "text-red-700" : "text-gray-400"}`}>
                    {batch.failed}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onViewDetails(batch)}
                      className="text-sm text-[#0B5C6C] font-medium hover:underline whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
