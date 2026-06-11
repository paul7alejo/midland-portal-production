"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  stockStatus,
  type InventoryProduct,
  type StockStatus,
} from "@/lib/sample-data/inventory";

type DrawerTab = "general" | "history" | "notes";

interface Props {
  product: InventoryProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Small shared badges ──────────────────────────────────────────────────────

function StockBadge({ status }: { status: StockStatus }) {
  if (status === "ok")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-2.5 py-0.5 text-xs font-medium" style={{ background: "#D1FAE5", color: "#065F46" }}>
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#10B981" }} />
        In Stock
      </span>
    );
  if (status === "low")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 px-2.5 py-0.5 text-xs font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#F59E0B" }} />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-0.5 text-xs font-medium" style={{ background: "#FEE2E2", color: "#991B1B" }}>
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#EF4444" }} />
      Critical
    </span>
  );
}

function FundingBadge({ type }: { type: InventoryProduct["fundingType"] }) {
  if (type === "govt_funded")
    return (
      <span className="inline-flex items-center rounded-full border border-[#0B5C6C]/30 bg-[#0B5C6C]/10 px-2.5 py-0.5 text-xs font-medium text-[#0B5C6C]">
        Govt funded
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
      Patient purchase
    </span>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function GeneralTab({
  product,
  status,
}: {
  product: InventoryProduct;
  status: StockStatus;
}) {
  const isDevice = product.category === "Device";

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Stock summary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Current inventory
        </p>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Total row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Total stock</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {product.totalStock} {product.unit !== "Each" ? product.unit : "units"}
              </span>
              <StockBadge status={status} />
            </div>
          </div>
          {/* Location rows */}
          {product.locations.map((loc) => {
            const locLow = loc.stock <= product.reorderThreshold;
            return (
              <div
                key={loc.name}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-600">{loc.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-gray-700">{loc.stock}</span>
                  {locLow && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Low
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product specifications */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Product specifications
        </p>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {[
            { label: "Manufacturer", value: product.manufacturer },
            { label: "Category", value: product.category },
            { label: "Funding scheme", value: null, badge: <FundingBadge type={product.fundingType} /> },
            {
              label: "Reorder threshold",
              value: `${product.reorderThreshold} ${product.unit !== "Each" ? product.unit : "units"}`,
            },
            { label: "Unit type", value: product.unit },
            { label: "Barcode / GTIN", value: product.barcode, mono: true },
          ].map(({ label, value, badge, mono }, i, arr) => (
            <div
              key={label}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3",
                i < arr.length - 1 && "border-b border-gray-100"
              )}
            >
              <span className="text-sm text-gray-500 shrink-0">{label}</span>
              {badge ?? (
                <span
                  className={cn(
                    "text-sm text-right text-gray-800",
                    mono && "font-mono"
                  )}
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Patient Request Relationship */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[#0B5C6C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Patient Request Relationship
        </p>
        {product.requestCategoryKey ? (
          <div className="rounded-md border p-3 space-y-2.5" style={{ background: "#E6F4F4", borderColor: "rgba(11,92,108,0.20)" }}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm text-gray-500 shrink-0">Request category</span>
              <span className="text-sm font-semibold text-right" style={{ color: "#0B5C6C" }}>{product.requestCategoryLabel}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm text-gray-500 shrink-0">Portal flow</span>
              <span className="text-sm text-right text-gray-700">Request Supplies → Step 1</span>
            </div>
            <div className="border-t pt-2.5" style={{ borderColor: "rgba(11,92,108,0.15)" }}>
              <p className="text-sm leading-5 flex items-start gap-1.5" style={{ color: "#92400E" }}>
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>
                  <span className="font-semibold">Phase 2 note:</span>{" "}
                  Reference linkage only. No stock is reserved or deducted when a patient submits a request. Staff confirm product allocation manually.
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-3" style={{ background: "#E6F4F4", borderColor: "rgba(11,92,108,0.20)" }}>
            <p className="text-sm text-gray-500 leading-5">
              This item has no linked patient request category. It is managed through direct staff ordering only.
            </p>
          </div>
        )}
      </div>

      {/* Compatibility note */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Compatibility
        </p>
        <p className="text-sm text-gray-600 leading-5">{product.compatibilityNote}</p>
      </div>

      {/* Reference-only callout */}
      <div className="rounded-xl border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.04] px-4 py-3">
        <p className="text-xs font-semibold text-[#0B5C6C] mb-1">Sample data — reference only</p>
        <p className="text-xs text-[#0B5C6C]/70 leading-5">
          Stock levels, SKUs, barcodes, and supplier details are illustrative only.
          Real product configuration, pricing, entitlement deduction, and fulfilment are Phase 3 and Phase 4 scope.
          {isDevice && " Device orders must be placed directly with the supplier."}
        </p>
      </div>
    </div>
  );
}

function HistoryTab({ product }: { product: InventoryProduct }) {
  const iconForType: Record<string, React.ReactNode> = {
    stock_adjusted: (
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    status_changed: (
      <svg className="h-4 w-4 text-[#0B5C6C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    item_created: (
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    notes_updated: (
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    ),
  };

  const labelForType: Record<string, string> = {
    stock_adjusted: "Stock adjusted",
    status_changed: "Status changed",
    item_created: "Item created",
    notes_updated: "Notes updated",
  };

  return (
    <div className="px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
        Sample history — illustrative only
      </p>
      <ol className="relative border-l border-gray-200 space-y-0">
        {product.history.map((entry, i) => (
          <li key={i} className="ml-4 pb-6 last:pb-0">
            <div className="absolute -left-2 mt-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-gray-200">
              {iconForType[entry.type]}
            </div>
            <div className="ml-2 pt-0.5">
              <p className="text-sm font-semibold text-gray-800">{labelForType[entry.type]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{entry.date} · {entry.author}</p>
              <p className="text-sm text-gray-600 mt-1 leading-5">{entry.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NotesTab({ product }: { product: InventoryProduct }) {
  const tagColours: Record<string, string> = {
    "Patient Report": "border-rose-200 bg-rose-50 text-rose-700",
    "Fit Issue":      "border-orange-200 bg-orange-50 text-orange-700",
    "Logistics":      "border-sky-200 bg-sky-50 text-sky-700",
    "QA Passed":      "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Fit Guide":      "border-[#0B5C6C]/20 bg-[#0B5C6C]/5 text-[#0B5C6C]",
    "High Demand":    "border-amber-200 bg-amber-50 text-amber-700",
    "Replacement Guidance": "border-purple-200 bg-purple-50 text-purple-700",
    "Device":         "border-gray-200 bg-gray-100 text-gray-600",
    "Supplier Contact": "border-gray-200 bg-gray-100 text-gray-600",
    "Patient Purchase": "border-purple-200 bg-purple-50 text-purple-700",
    "Consumable":     "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className="px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
        Sample notes — illustrative only
      </p>
      <div className="space-y-4">
        {product.notes.map((note, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">{note.author}</p>
                <p className="text-xs text-gray-400">{note.role} · {note.date}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-6">{note.body}</p>
            {note.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      tagColours[tag] ?? "border-gray-200 bg-gray-50 text-gray-500"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function InventoryDrawer({ product, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("general");

  const TABS: { id: DrawerTab; label: string }[] = [
    { id: "general",  label: "General Information" },
    { id: "history",  label: "History" },
    { id: "notes",    label: "Notes" },
  ];

  const status = product ? stockStatus(product) : "ok";
  const isDevice = product?.category === "Device";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ?? "Product details"}
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[680px] sm:max-w-[90vw] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Dark teal image / header area */}
        <div className="relative shrink-0 bg-[#0B2A3C]">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product drawer"
            className="absolute right-4 top-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-white/10 transition-colors"
          >
            <svg
              className="h-5 w-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Product identity */}
          <div className="flex gap-4 px-6 pt-6 pb-4 pr-16">
            {/* Primary image placeholder */}
            <div className="relative shrink-0">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-bold text-white/50">
                    {product?.category?.[0] ?? "—"}
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-widest text-white/30 leading-none">
                    {product?.category ?? ""}
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-[#0B5C6C] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                IMG
              </span>
            </div>

            {/* Name / SKU / badges */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {product && <StockBadge status={status} />}
                {product && <FundingBadge type={product.fundingType} />}
              </div>
              <h2 className="text-lg font-semibold leading-6 text-white">
                {product?.name ?? "—"}
              </h2>
              <p className="mt-1 font-mono text-xs text-white/40">
                {product?.sku ?? "—"}
              </p>
            </div>
          </div>

          {/* Thumbnail image slots (placeholder — replaceable in Phase 3) */}
          <div className="flex items-center gap-2 px-6 pb-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg border transition-colors",
                  i === 0
                    ? "border-white/30 bg-white/15"
                    : "border-white/10 bg-white/5"
                )}
              >
                {i === 0 ? (
                  <svg
                    className="h-4 w-4 text-white/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 9.75h.008v.008H18V9.75zm-12 5.25a.75.75 0 01-.75-.75V6.75a.75.75 0 01.75-.75h16.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6z" />
                  </svg>
                ) : (
                  <svg
                    className="h-3.5 w-3.5 text-white/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>
            ))}
            <p className="ml-1 text-[10px] text-white/25 italic">
              Image slots — replaceable in Phase 3
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 border-b border-gray-200">
          <nav className="flex px-2" role="tablist" aria-label="Product detail tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-sm font-semibold -mb-px border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[#0B5C6C] text-[#0B5C6C]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "general" && product && (
            <GeneralTab product={product} status={status} />
          )}
          {activeTab === "history" && product && (
            <HistoryTab product={product} />
          )}
          {activeTab === "notes" && product && (
            <NotesTab product={product} />
          )}
        </div>

        {/* Footer actions */}
        {product && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled
                className="min-h-[40px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                title="Editing is not available in the sample catalogue."
              >
                Edit Details
              </button>

              <div className="group relative">
                <button
                  type="button"
                  disabled
                  className="min-h-[40px] rounded-lg border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.04] px-4 py-2 text-sm font-medium text-[#0B5C6C]/40 cursor-not-allowed"
                >
                  Order Stock
                </button>
                {isDevice && (
                  <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 w-64 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Contact supplier directly for device orders.
                  </div>
                )}
              </div>

              <span className="ml-auto text-xs italic text-gray-400">
                Sample data — no changes saved
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
