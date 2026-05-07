export default function AdminAuditPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Audit Log</h1>
        <p className="text-base text-gray-600">
          Tamper-evident log of all admin actions, NHI access events, and patient record changes.
        </p>
      </div>
      <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-[#0B5C6C]/10 text-[#0B5C6C]">
        Planned module
      </span>
    </div>
  );
}
