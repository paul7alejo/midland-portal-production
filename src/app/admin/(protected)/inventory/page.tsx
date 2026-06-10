"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { InventoryDrawer } from "@/components/admin/InventoryDrawer";
import {
  SAMPLE_PRODUCTS,
  stockStatus,
  type InventoryProduct,
  type ProductCategory,
} from "@/lib/sample-data/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryFilter = "All" | ProductCategory;
type StockFilter    = "All" | "Alert";
type SortKey        = "stock-asc" | "stock-desc" | "name-asc" | "name-desc";

const CATEGORY_CHIPS: CategoryFilter[] = [
  "All", "Mask", "Cushion", "Device", "Accessory", "Consumable",
];

// ─── Small shared UI ──────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: ProductCategory }) {
  const styles: Record<ProductCategory, string> = {
    Mask:        "border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.07] text-[#0B5C6C]",
    Cushion:     "border-purple-200 bg-purple-50 text-purple-700",
    Device:      "border-[#0B2A3C]/20 bg-[#0B2A3C]/[0.07] text-[#0B2A3C]",
    Accessory:   "border-emerald-200 bg-emerald-50 text-emerald-700",
    Consumable:  "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", styles[category])}>
      {category}
    </span>
  );
}

function FundingChip({ type, selected, onClick }: {
  type: "govt_funded" | "patient_purchase";
  selected: boolean;
  onClick: () => void;
}) {
  const label = type === "govt_funded" ? "Govt funded" : "Patient purchase";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors min-h-[32px]",
        selected
          ? type === "govt_funded"
            ? "border-[#0B5C6C] bg-[#0B5C6C] text-white"
            : "border-purple-600 bg-purple-600 text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      )}
    >
      {label}
    </button>
  );
}

function StockDot({ status }: { status: "ok" | "low" | "critical" }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full shrink-0",
        status === "ok"       && "bg-emerald-500",
        status === "low"      && "bg-amber-500",
        status === "critical" && "bg-red-500"
      )}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [stockFilter,    setStockFilter]    = useState<StockFilter>("All");
  const [fundingGovt,    setFundingGovt]    = useState(false);
  const [fundingPatient, setFundingPatient] = useState(false);
  const [sort,           setSort]           = useState<SortKey>("name-asc");
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  function openDrawer(p: InventoryProduct) {
    setSelectedProduct(p);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  const filteredProducts = useMemo(() => {
    let list = SAMPLE_PRODUCTS.slice();

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Category chip
    if (categoryFilter !== "All") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    // Stock alert
    if (stockFilter === "Alert") {
      list = list.filter((p) => stockStatus(p) !== "ok");
    }

    // Funding (OR if both selected → show all; neither → show all)
    if (fundingGovt || fundingPatient) {
      list = list.filter(
        (p) =>
          (fundingGovt    && p.fundingType === "govt_funded") ||
          (fundingPatient && p.fundingType === "patient_purchase")
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case "stock-asc":  return a.totalStock - b.totalStock;
        case "stock-desc": return b.totalStock - a.totalStock;
        case "name-asc":   return a.name.localeCompare(b.name);
        case "name-desc":  return b.name.localeCompare(a.name);
      }
    });

    return list;
  }, [search, categoryFilter, stockFilter, fundingGovt, fundingPatient, sort]);

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-bold text-navy">Supply Catalogue</h1>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                8 sample items
              </span>
            </div>
            <p className="text-base text-gray-500">
              Reference catalogue connecting supply categories to patient request workflow.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed min-h-[44px]"
            title="Product management is not available in the sample catalogue."
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 ml-1">
              sample only
            </span>
          </button>
        </div>

        {/* Reference notice */}
        <div className="rounded-xl border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.04] px-5 py-4">
          <p className="text-sm font-semibold text-[#0B5C6C] mb-1">Phase 2 — Sample reference only</p>
          <p className="text-sm text-[#0B5C6C]/75 leading-5">
            This catalogue uses illustrative sample data to show how patient supply request categories
            connect to future inventory and fulfilment workflows. No real stock is tracked or reserved.
            Real SKU mapping, supplier pricing, stock tracking, entitlement deduction, checkout, and
            fulfilment are Phase 3 and Phase 4 scope.
          </p>
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, SKU, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 focus:border-[#0B5C6C]"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCategoryFilter(chip)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors min-h-[32px]",
                    categoryFilter === chip
                      ? "border-[#0B5C6C] bg-[#0B5C6C] text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

            {/* Stock alert chip */}
            <button
              type="button"
              onClick={() => setStockFilter(stockFilter === "Alert" ? "All" : "Alert")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors min-h-[32px]",
                stockFilter === "Alert"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", stockFilter === "Alert" ? "bg-white" : "bg-amber-500")} />
              Low / Critical
            </button>

            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

            {/* Funding chips */}
            <FundingChip type="govt_funded"    selected={fundingGovt}    onClick={() => setFundingGovt(!fundingGovt)} />
            <FundingChip type="patient_purchase" selected={fundingPatient} onClick={() => setFundingPatient(!fundingPatient)} />

            {/* Sort (right-aligned) */}
            <div className="ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/20 focus:border-[#0B5C6C]"
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="stock-asc">Stock: low to high</option>
                <option value="stock-desc">Stock: high to low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        {filteredProducts.length < SAMPLE_PRODUCTS.length && (
          <p className="text-sm text-gray-400">
            Showing {filteredProducts.length} of {SAMPLE_PRODUCTS.length} items
          </p>
        )}

        {/* Product list */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-500">No products match your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("All");
                setStockFilter("All");
                setFundingGovt(false);
                setFundingPatient(false);
              }}
              className="mt-2 text-sm font-medium text-[#0B5C6C] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const status = stockStatus(product);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => openDrawer(product)}
                      className={cn(
                        "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50",
                        "border-l-4",
                        status === "critical" && "border-l-red-400",
                        status === "low"      && "border-l-amber-400",
                        status === "ok"       && "border-l-transparent"
                      )}
                    >
                      {/* Category icon placeholder */}
                      <div
                        className={cn(
                          "shrink-0 flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                          product.category === "Mask"       && "bg-[#0B5C6C]/10 text-[#0B5C6C]",
                          product.category === "Cushion"    && "bg-purple-100 text-purple-700",
                          product.category === "Device"     && "bg-[#0B2A3C]/10 text-[#0B2A3C]",
                          product.category === "Accessory"  && "bg-emerald-100 text-emerald-700",
                          product.category === "Consumable" && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {product.category[0]}
                      </div>

                      {/* Name + SKU */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 leading-5 truncate">
                          {product.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <CategoryBadge category={product.category} />
                          <span className="font-mono text-xs text-gray-400">{product.sku}</span>
                          {product.fundingType === "govt_funded" ? (
                            <span className="inline-flex items-center rounded-full border border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.06] px-2 py-0.5 text-xs font-medium text-[#0B5C6C]">
                              Govt funded
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                              Patient purchase
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock count + dot */}
                      <div className="shrink-0 flex items-center gap-2 min-w-[56px] justify-end">
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          status === "critical" ? "text-red-600"  :
                          status === "low"      ? "text-amber-600" :
                          "text-gray-700"
                        )}>
                          {product.totalStock}
                        </span>
                        <StockDot status={status} />
                      </div>

                      {/* Chevron */}
                      <div className="shrink-0 ml-1">
                        <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Phase 3/4 bridge note */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            What happens in Phase 3 and Phase 4
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "Phase 3", items: ["SKU / product mapping", "Supplier pricing import", "Pharmac subsidy config", "Entitlement deduction", "CPAP store integration"] },
              { label: "Phase 4", items: ["Real stock tracking", "Fulfilment reservation", "Reorder threshold alerts", "Inventory period renewal", "Per-item entitlement caps"] },
              { label: "Supplier dependency", items: ["Midland / Biomedical spreadsheet", "Per-item cost data", "SKU codes per category", "Pack size and unit pricing", "Pharmac schedule alignment"] },
            ].map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}</p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="h-1 w-1 rounded-full bg-gray-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Drawer — outside main content flow */}
      <InventoryDrawer
        product={selectedProduct}
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
    </>
  );
}
