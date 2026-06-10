// Sample-only inventory data — no real products, no stock reservations, no pricing.
// Phase 3 will replace this with real SKU mapping and supplier data.

export type StockStatus = "ok" | "low" | "critical";
export type FundingType = "govt_funded" | "patient_purchase";
export type ProductCategory = "Mask" | "Cushion" | "Device" | "Accessory" | "Consumable";
export type RequestCategory = "Mask cushion" | "Headgear" | "Complete mask kit" | "Filters";

export interface InventoryLocation {
  name: string;
  stock: number;
}

export interface InventoryHistoryEntry {
  type: "stock_adjusted" | "status_changed" | "item_created" | "notes_updated";
  date: string;
  description: string;
  author: string;
}

export interface InventoryNote {
  author: string;
  role: string;
  date: string;
  body: string;
  tags: string[];
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  fundingType: FundingType;
  totalStock: number;
  reorderThreshold: number;
  status: "Active" | "Inactive";
  manufacturer: string;
  barcode: string;
  unit: string;
  locations: InventoryLocation[];
  requestCategory: RequestCategory | null;
  compatibilityNote: string;
  history: InventoryHistoryEntry[];
  notes: InventoryNote[];
}

export function stockStatus(p: InventoryProduct): StockStatus {
  if (p.totalStock <= Math.floor(p.reorderThreshold * 0.5)) return "critical";
  if (p.totalStock <= p.reorderThreshold) return "low";
  return "ok";
}

export const SAMPLE_PRODUCTS: InventoryProduct[] = [
  {
    id: "airfit-f30i-ffm",
    name: "AirFit F30i Full Face Mask",
    sku: "RF-AFITF30I-FFM",
    category: "Mask",
    fundingType: "govt_funded",
    totalStock: 12,
    reorderThreshold: 10,
    status: "Active",
    manufacturer: "ResMed",
    barcode: "9348519000123",
    unit: "Each",
    locations: [
      { name: "Waikato Clinic", stock: 8 },
      { name: "Hamilton Admin", stock: 4 },
    ],
    requestCategory: "Complete mask kit",
    compatibilityNote:
      "Compatible with AirFit F30i headgear and cushion. Suitable for full-face therapy. Prescription required.",
    history: [
      {
        type: "stock_adjusted",
        date: "13 Jun 2026",
        description: "+50 units added to Waikato Clinic.",
        author: "Jordan Williams",
      },
      {
        type: "status_changed",
        date: "5 Jun 2026",
        description: "Inactive → Active",
        author: "Jordan Williams",
      },
      {
        type: "status_changed",
        date: "2 Jun 2026",
        description: "Active → Inactive",
        author: "Paul Alejo",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "Sarah Mitchell",
        role: "Clinical Lead",
        date: "Oct 12, 2023",
        body: "Patient reported minor skin irritation with the standard silicone seal after 3 nights of use. Advised temporary transition to soft-wrap accessory and monitoring for 7 days. Will re-evaluate fit if redness persists.",
        tags: ["Patient Report", "Fit Issue"],
      },
      {
        author: "David Reynolds",
        role: "Inventory Mgr",
        date: "Sep 28, 2023",
        body: "Increased automatic reorder threshold by 15% to account for anticipated winter demand surge. Current supplier lead times are extending slightly.",
        tags: ["Logistics"],
      },
      {
        author: "Sarah Mitchell",
        role: "Clinical Lead",
        date: "Aug 05, 2023",
        body: "New stock batch arrived. Inspected 5 random units; all seals intact and elbow swivels moving freely. Cleared for patient distribution.",
        tags: ["QA Passed"],
      },
    ],
  },

  {
    id: "airfit-p10",
    name: "AirFit P10 Nasal Pillow Mask",
    sku: "RF-AFITP10-NPM",
    category: "Mask",
    fundingType: "govt_funded",
    totalStock: 8,
    reorderThreshold: 10,
    status: "Active",
    manufacturer: "ResMed",
    barcode: "9348519000456",
    unit: "Each",
    locations: [
      { name: "Waikato Clinic", stock: 5 },
      { name: "Hamilton Admin", stock: 3 },
    ],
    requestCategory: "Complete mask kit",
    compatibilityNote:
      "Lightweight nasal pillow design. Compatible with AirSense 10 and 11 CPAP devices. Prescription required.",
    history: [
      {
        type: "stock_adjusted",
        date: "8 Jun 2026",
        description: "15 units received at Waikato Clinic. Stock still below threshold.",
        author: "Jordan Williams",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "Sarah Mitchell",
        role: "Clinical Lead",
        date: "Sep 10, 2023",
        body: "Popular with patients who prefer minimal contact. Ensure correct pillow size is matched to patient anatomy before dispatch.",
        tags: ["Fit Guide"],
      },
    ],
  },

  {
    id: "airfit-f30i-cushion-sm",
    name: "AirFit F30i Cushion Small",
    sku: "RF-AFITF30I-CSH-SM",
    category: "Cushion",
    fundingType: "govt_funded",
    totalStock: 6,
    reorderThreshold: 15,
    status: "Active",
    manufacturer: "ResMed",
    barcode: "9348519000789",
    unit: "Each",
    locations: [{ name: "Waikato Clinic", stock: 6 }],
    requestCategory: "Mask cushion",
    compatibilityNote:
      "Fits AirFit F30i full face mask frame (small size). Replacement component only — frame sold separately.",
    history: [
      {
        type: "stock_adjusted",
        date: "10 Jun 2026",
        description: "4 units issued to patients. Stock now below reorder threshold.",
        author: "Jordan Williams",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "David Reynolds",
        role: "Inventory Mgr",
        date: "Oct 1, 2023",
        body: "Small size is highest demand. Maintain at least 15 units on hand. Medium size tracked separately.",
        tags: ["Logistics", "High Demand"],
      },
    ],
  },

  {
    id: "airfit-f30i-headgear",
    name: "AirFit F30i Headgear",
    sku: "RF-AFITF30I-HG",
    category: "Accessory",
    fundingType: "govt_funded",
    totalStock: 18,
    reorderThreshold: 10,
    status: "Active",
    manufacturer: "ResMed",
    barcode: "9348519001012",
    unit: "Each",
    locations: [
      { name: "Waikato Clinic", stock: 10 },
      { name: "Hamilton Admin", stock: 8 },
    ],
    requestCategory: "Headgear",
    compatibilityNote:
      "Designed exclusively for AirFit F30i mask frame. Available in standard size only.",
    history: [
      {
        type: "stock_adjusted",
        date: "7 Jun 2026",
        description: "8 units transferred from Hamilton Admin to Waikato Clinic to balance stock.",
        author: "Jordan Williams",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "Sarah Mitchell",
        role: "Clinical Lead",
        date: "Aug 15, 2023",
        body: "Recommend replacing headgear every 6 months or when elasticity is visibly reduced. Note for patient communication template.",
        tags: ["Replacement Guidance"],
      },
    ],
  },

  {
    id: "airsense11-filter",
    name: "AirSense 11 Disposable Filter",
    sku: "RF-AS11-FILT-DISP",
    category: "Consumable",
    fundingType: "govt_funded",
    totalStock: 45,
    reorderThreshold: 20,
    status: "Active",
    manufacturer: "ResMed",
    barcode: "9348519001345",
    unit: "Pack (2)",
    locations: [
      { name: "Waikato Clinic", stock: 30 },
      { name: "Hamilton Admin", stock: 15 },
    ],
    requestCategory: "Filters",
    compatibilityNote:
      "Fits AirSense 10 and AirSense 11 series devices. Replace every 1–3 months or as directed.",
    history: [
      {
        type: "stock_adjusted",
        date: "9 Jun 2026",
        description: "20 packs restocked at Waikato Clinic from monthly replenishment order.",
        author: "Jordan Williams",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "David Reynolds",
        role: "Inventory Mgr",
        date: "Sep 5, 2023",
        body: "High-velocity consumable. Monthly order cadence is sufficient at current patient volumes. Review if patient base grows significantly.",
        tags: ["Logistics", "Consumable"],
      },
    ],
  },

  {
    id: "airsense11-autoset",
    name: "AirSense 11 AutoSet CPAP",
    sku: "RF-AS11-AUTO-CPAP",
    category: "Device",
    fundingType: "govt_funded",
    totalStock: 2,
    reorderThreshold: 5,
    status: "Active",
    manufacturer: "ResMed",
    barcode: "9348519001678",
    unit: "Each",
    locations: [{ name: "Waikato Clinic", stock: 2 }],
    requestCategory: null,
    compatibilityNote:
      "AutoSet algorithm adjusts pressure automatically. Requires compatible mask, tubing, and humidifier chamber.",
    history: [
      {
        type: "stock_adjusted",
        date: "6 Jun 2026",
        description: "1 unit dispatched to patient. Stock critically low — contact supplier for urgent reorder.",
        author: "Jordan Williams",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "David Reynolds",
        role: "Inventory Mgr",
        date: "Oct 8, 2023",
        body: "Device orders must go through supplier account manager directly. Do not use the standard stock request workflow for CPAP units. Lead time is approximately 3 weeks.",
        tags: ["Device", "Supplier Contact"],
      },
    ],
  },

  {
    id: "sleepstyle-650",
    name: "SleepStyle 650 Auto CPAP",
    sku: "FP-SS650-AUTO",
    category: "Device",
    fundingType: "patient_purchase",
    totalStock: 1,
    reorderThreshold: 3,
    status: "Active",
    manufacturer: "Fisher & Paykel",
    barcode: "9415401000234",
    unit: "Each",
    locations: [{ name: "Hamilton Admin", stock: 1 }],
    requestCategory: null,
    compatibilityNote:
      "Integrated heated humidifier. Compatible with Fisher & Paykel mask range. Patient-purchase item.",
    history: [
      {
        type: "status_changed",
        date: "12 Jun 2026",
        description: "Inactive → Active",
        author: "Jordan Williams",
      },
      {
        type: "status_changed",
        date: "11 Jun 2026",
        description: "Active → Inactive",
        author: "Paul Alejo",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "David Reynolds",
        role: "Inventory Mgr",
        date: "Sep 20, 2023",
        body: "Patient-purchase item — not covered under standard govt funding. Ensure patient is informed at point of request. Device orders via F&P account rep.",
        tags: ["Patient Purchase", "Device"],
      },
    ],
  },

  {
    id: "eson2-nasal-med",
    name: "Eson 2 Nasal Mask Medium",
    sku: "FP-ESON2-NM-MED",
    category: "Mask",
    fundingType: "govt_funded",
    totalStock: 7,
    reorderThreshold: 10,
    status: "Active",
    manufacturer: "Fisher & Paykel",
    barcode: "9415401000567",
    unit: "Each",
    locations: [
      { name: "Waikato Clinic", stock: 4 },
      { name: "Hamilton Admin", stock: 3 },
    ],
    requestCategory: "Complete mask kit",
    compatibilityNote:
      "Soft-seal nasal mask suitable for side-sleepers. Compatible with SleepStyle 650 and most Fisher & Paykel CPAP range.",
    history: [
      {
        type: "stock_adjusted",
        date: "5 Jun 2026",
        description: "5 units received at Hamilton Admin from F&P distributor.",
        author: "Jordan Williams",
      },
      {
        type: "item_created",
        date: "1 Jun 2026",
        description: "Initial record created in the system.",
        author: "Paul Alejo",
      },
    ],
    notes: [
      {
        author: "Sarah Mitchell",
        role: "Clinical Lead",
        date: "Aug 22, 2023",
        body: "Medium is the most common fit for this model. Small and Large tracked separately. Confirm sizing at clinical assessment before dispatch.",
        tags: ["Fit Guide"],
      },
    ],
  },
];
