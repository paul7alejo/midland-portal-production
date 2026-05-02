// Demo product catalogue — Phase 1A only.
// In Phase 1B production, shop routes are dormant (src/phase2/).
// Reactivation: Month 12 contract review.

export type ProductCategory = "supplies" | "accessories" | "machines";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  rrp: number;            // RRP in NZD
  patient_price: number;  // 10% off for machines only, same as RRP for others
  has_discount: boolean;  // true only for machines
  description: string;
  features: string[];
  mask_compatible?: string; // if tied to a specific mask type
}

export const DEMO_PRODUCTS: Product[] = [
  // --- SUPPLIES ---
  {
    id: "prod-s01",
    slug: "airfit-f30i-cushion",
    name: "AirFit F30i Cushion",
    brand: "ResMed",
    category: "supplies",
    rrp: 45,
    patient_price: 45,
    has_discount: false,
    description: "Replacement cushion for the AirFit F30i full face mask.",
    features: ["Silicone cushion", "Easy snap-on fit", "Multiple sizes available", "Hypoallergenic material", "6-month recommended replacement", "Compatible with AirFit F30i frame"],
    mask_compatible: "AirFit F30i",
  },
  {
    id: "prod-s02",
    slug: "airfit-f30i-headgear",
    name: "AirFit F30i Headgear",
    brand: "ResMed",
    category: "supplies",
    rrp: 55,
    patient_price: 55,
    has_discount: false,
    description: "Replacement headgear straps for the AirFit F30i.",
    features: ["Soft fabric straps", "Adjustable fit", "Quick-release clips", "Machine washable", "6-month recommended replacement", "Compatible with all F30i frames"],
    mask_compatible: "AirFit F30i",
  },
  {
    id: "prod-s03",
    slug: "airfit-f30i-mask-kit",
    name: "AirFit F30i Complete Kit",
    brand: "ResMed",
    category: "supplies",
    rrp: 189,
    patient_price: 189,
    has_discount: false,
    description: "Complete mask kit including frame, cushion, and headgear.",
    features: ["Full mask frame", "Cushion included", "Headgear included", "Elbow and clip", "Sizing guide included", "12-month recommended replacement"],
    mask_compatible: "AirFit F30i",
  },
  {
    id: "prod-s04",
    slug: "cpap-filters",
    name: "CPAP Filter Pack",
    brand: "ResMed",
    category: "supplies",
    rrp: 25,
    patient_price: 25,
    has_discount: false,
    description: "Standard and hypoallergenic filter pack for ResMed CPAP machines.",
    features: ["2x standard filters", "2x hypoallergenic filters", "3-month replacement cycle", "Fits AirSense 10 and 11", "Reduces dust and allergens", "Easy slide-in installation"],
  },
  // --- ACCESSORIES ---
  {
    id: "prod-a01",
    slug: "cpap-cleaning-wipes",
    name: "CPAP Cleaning Wipes",
    brand: "ResMed",
    category: "accessories",
    rrp: 15,
    patient_price: 15,
    has_discount: false,
    description: "Gentle cleaning wipes for daily mask maintenance.",
    features: ["62 wipes per pack", "Unscented formula", "Safe for silicone", "Quick-drying", "Travel-friendly packaging", "Daily use recommended"],
  },
  {
    id: "prod-a02",
    slug: "mask-liner-pads",
    name: "Mask Liner Pads",
    brand: "Gecko",
    category: "accessories",
    rrp: 25,
    patient_price: 25,
    has_discount: false,
    description: "Soft fabric liners to reduce mask leak and skin irritation.",
    features: ["30-day supply", "Reduces air leak", "Prevents skin marks", "Hypoallergenic fabric", "Fits most full face masks", "Disposable"],
  },
  {
    id: "prod-a03",
    slug: "cpap-travel-bag",
    name: "CPAP Travel Bag",
    brand: "ResMed",
    category: "accessories",
    rrp: 40,
    patient_price: 40,
    has_discount: false,
    description: "Padded travel bag designed for CPAP machines and accessories.",
    features: ["Fits AirSense 10 and 11", "Padded interior", "Accessory pockets", "Carry handle and strap", "Airline carry-on size", "Water-resistant exterior"],
  },
  {
    id: "prod-a04",
    slug: "chin-strap",
    name: "CPAP Chin Strap",
    brand: "ResMed",
    category: "accessories",
    rrp: 35,
    patient_price: 35,
    has_discount: false,
    description: "Adjustable chin strap to prevent mouth breathing during sleep.",
    features: ["Adjustable fit", "Soft neoprene material", "Reduces mouth leak", "Compatible with all masks", "Machine washable", "One size fits most"],
  },
  // --- MACHINES (10% Patient Price discount applies) ---
  {
    id: "prod-m01",
    slug: "airsense-11-autoset",
    name: "AirSense 11 AutoSet",
    brand: "ResMed",
    category: "machines",
    rrp: 2299,
    patient_price: 2069.10,
    has_discount: true,
    description: "The latest auto-adjusting CPAP machine from ResMed with built-in connectivity.",
    features: ["Auto-adjusting pressure", "Built-in WiFi and Bluetooth", "Personal therapy assistant", "Whisper-quiet motor", "Integrated humidifier", "myAir app compatible"],
  },
  {
    id: "prod-m02",
    slug: "airmini-autoset",
    name: "AirMini AutoSet",
    brand: "ResMed",
    category: "machines",
    rrp: 1499,
    patient_price: 1349.10,
    has_discount: true,
    description: "Ultra-compact travel CPAP machine with full auto-adjusting therapy.",
    features: ["Weighs only 300g", "Auto-adjusting pressure", "AirMini app control", "Waterless humidification", "FAA approved for flights", "Compatible with select ResMed masks"],
  },
  {
    id: "prod-m03",
    slug: "dreamstation-2",
    name: "DreamStation 2",
    brand: "Philips",
    category: "machines",
    rrp: 1899,
    patient_price: 1709.10,
    has_discount: true,
    description: "Advanced auto-CPAP with integrated heated humidifier and DreamMapper app.",
    features: ["Auto-adjusting pressure", "Integrated heated humidifier", "Bluetooth connectivity", "DreamMapper app compatible", "Quiet operation", "Easy-to-read display"],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return DEMO_PRODUCTS.filter((p) => p.category === category);
}

export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
