// ─── Types ────────────────────────────────────────────────────────────────────

interface ReadinessItem {
  label: string;
  ready: boolean;
  note: string;
}

interface RequestCategory {
  name: string;
  currentState: string;
  phase3Requirement: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const READINESS_ITEMS: ReadinessItem[] = [
  {
    label: "Request categories exist",
    ready: true,
    note: "Four patient-facing request categories are active in the portal.",
  },
  {
    label: "SKU mapping configured",
    ready: false,
    note: "No products or supplier SKUs have been mapped to request categories yet.",
  },
  {
    label: "Supplier pricing configured",
    ready: false,
    note: "Supplier cost data is required before pricing can be applied.",
  },
  {
    label: "Pharmac / schedule pricing configured",
    ready: false,
    note: "Subsidised pricing rules have not been configured.",
  },
  {
    label: "Stock tracking active",
    ready: false,
    note: "No stock levels are tracked. No stock has been reserved or decremented.",
  },
  {
    label: "Entitlement deduction active",
    ready: false,
    note: "Entitlement figures are estimates only. No deduction is applied in Phase 2.",
  },
  {
    label: "Fulfilment reservation active",
    ready: false,
    note: "No inventory is reserved when a request is submitted or approved.",
  },
];

const REQUEST_CATEGORIES: RequestCategory[] = [
  {
    name: "Mask cushion",
    currentState: "Display category only",
    phase3Requirement: "Map to mask model, size, supplier SKU",
  },
  {
    name: "Headgear",
    currentState: "Display category only",
    phase3Requirement: "Map to compatible mask / headgear SKU",
  },
  {
    name: "Complete mask kit",
    currentState: "Display category only",
    phase3Requirement: "Map to full kit / product bundle",
  },
  {
    name: "Filters",
    currentState: "Display category only",
    phase3Requirement: "Map to filter type, pack size, supplier SKU",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const readyCount  = READINESS_ITEMS.filter((i) => i.ready).length;
  const totalCount  = READINESS_ITEMS.length;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Inventory</h1>
        <p className="text-base text-gray-600">
          Reference readiness view for supply inventory and product configuration.
          No stock, pricing, or fulfilment logic is active in Phase 2.
        </p>
      </div>

      {/* Phase 2 scope notice */}
      <div className="rounded-xl border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.05] px-5 py-4">
        <p className="text-sm font-semibold text-[#0B5C6C] mb-1">Phase 2 — Reference only</p>
        <p className="text-sm text-[#0B5C6C]/80">
          This page shows what is required before Phase 3 product, SKU, stock, and fulfilment
          work can begin. No prices, SKUs, stock levels, or reservations are stored or displayed.
          Real SKU mapping, supplier configuration, stock tracking, checkout, and entitlement
          deduction are all Phase 3 and Phase 4 scope.
        </p>
      </div>

      {/* Product readiness audit */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Product readiness audit
          </h2>
          <span className="text-xs font-semibold text-gray-500 tabular-nums">
            {readyCount} / {totalCount} ready
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {READINESS_ITEMS.map((item) => (
              <li key={item.label} className="flex items-start gap-4 px-5 py-4">
                {/* Status indicator */}
                <div className="mt-0.5 shrink-0">
                  {item.ready ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs font-bold">
                      –
                    </span>
                  )}
                </div>
                {/* Label + note */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-5 ${item.ready ? "text-gray-800" : "text-gray-500"}`}>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 leading-5">{item.note}</p>
                </div>
                {/* Phase badge */}
                <div className="shrink-0">
                  {item.ready ? (
                    <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      Live in Phase 2
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
                      Phase 3 / 4
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Request categories + SKU mapping gap */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Current request categories
        </h2>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_160px_1fr] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current state</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase 3 requirement</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {REQUEST_CATEGORIES.map((cat) => (
              <li key={cat.name} className="grid grid-cols-[1fr_160px_1fr] gap-4 items-start px-5 py-4">
                <p className="text-sm font-semibold text-gray-800 leading-5">{cat.name}</p>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200 w-fit">
                  {cat.currentState}
                </span>
                <p className="text-sm text-gray-500 leading-5">{cat.phase3Requirement}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Supplier dependency note */}
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">Supplier spreadsheet required</p>
          <p className="text-sm text-amber-800">
            Supplier spreadsheet required before Phase 3 pricing and SKU mapping. Once the
            Midland / Biomedical supplier spreadsheet is available, each request category can
            be mapped to specific products, SKUs, and pricing tiers.
          </p>
        </div>
      </div>

      {/* Phase 3 / 4 bridge */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Phase 3 and Phase 4 scope
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { phase: "Phase 3", items: ["SKU / product mapping", "Supplier pricing import", "Pharmac subsidy configuration", "Entitlement deduction on order placement", "CPAP store / checkout integration"] },
            { phase: "Phase 4", items: ["Stock level tracking", "Fulfilment reservation on entitlement use", "Reorder threshold alerts", "Inventory period renewal", "Per-item entitlement caps"] },
            { phase: "Supplier dependency", items: ["Midland / Biomedical spreadsheet", "Per-item cost data", "SKU codes per category", "Pack size and unit pricing", "Pharmac schedule alignment"] },
          ].map(({ phase, items }) => (
            <div key={phase} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{phase}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
