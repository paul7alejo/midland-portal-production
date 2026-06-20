"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePatientData } from "@/hooks/usePatientData";
import { cn } from "@/lib/utils";
import { DEMO_MASKS } from "@/lib/demoData";
import EquipmentVisual from "@/components/portal/EquipmentVisual";
import { getIdToken, configureCognito } from "@/lib/aws/cognito";
import {
  EMPTY_DELIVERY_ADDRESS,
  formatDeliveryAddress,
  getDeliveryAddressStorageKey,
  hasCompleteDeliveryAddress,
  normalizeDeliveryAddress,
  readSavedDeliveryAddress,
  saveDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/patientDeliveryAddress";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data/inventory";

// Count of catalogue items linked to each patient request category (static — sample data only)
const CATALOGUE_COUNTS: Record<string, number> = {
  cushion:  SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "mask_cushion").length,
  headgear: SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "headgear").length,
  mask_kit: SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "complete_mask_kit").length,
  filter:   SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "filters").length,
};

// Patient-safe option names and descriptions (no SKU, stock, price, funding, or supplier data)
const CATEGORY_OPTIONS: Record<string, Array<{ id: string; name: string; description: string }>> = {
  cushion:  SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "mask_cushion").map((p) => ({ id: p.id, name: p.name, description: p.compatibilityNote })),
  headgear: SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "headgear").map((p) => ({ id: p.id, name: p.name, description: p.compatibilityNote })),
  mask_kit: SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "complete_mask_kit").map((p) => ({ id: p.id, name: p.name, description: p.compatibilityNote })),
  filter:   SAMPLE_PRODUCTS.filter((p) => p.requestCategoryKey === "filters").map((p) => ({ id: p.id, name: p.name, description: p.compatibilityNote })),
};

function getOptionLabel(category: string, optionId: string): string {
  if (optionId === "staff_confirm") return "Not sure — staff will confirm";
  return CATEGORY_OPTIONS[category]?.find((o) => o.id === optionId)?.name ?? optionId;
}

const ITEM_LABELS: Record<string, string> = {
  cushion: "Mask cushion",
  headgear: "Headgear",
  mask_kit: "Complete mask kit",
  filter: "Filters",
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  cushion: "Replacement cushion for your current mask",
  headgear: "Replacement headgear straps",
  mask_kit: "Complete mask frame, cushion, and headgear",
  filter: "Standard and hypoallergenic filter pack",
};

const ITEM_ICONS: Record<string, React.ReactNode> = {
  cushion: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <ellipse cx="14" cy="14" rx="11" ry="7" fill="#0B5C6C" fillOpacity="0.12" stroke="#0B5C6C" strokeOpacity="0.30" strokeWidth="1.5"/>
      <ellipse cx="14" cy="14" rx="7" ry="4" fill="#0B5C6C" fillOpacity="0.18"/>
    </svg>
  ),
  headgear: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M4 14 Q4 7 14 7 Q24 7 24 14" stroke="#0B5C6C" strokeOpacity="0.40" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M4 14 Q4 20 7 22" stroke="#0B2A3C" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M24 14 Q24 20 21 22" stroke="#0B2A3C" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <rect x="5" y="20" width="4" height="5" rx="2" fill="#0B5C6C" fillOpacity="0.22"/>
      <rect x="19" y="20" width="4" height="5" rx="2" fill="#0B5C6C" fillOpacity="0.22"/>
    </svg>
  ),
  mask_kit: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <ellipse cx="14" cy="17" rx="10" ry="8" fill="#0B5C6C" fillOpacity="0.09" stroke="#0B5C6C" strokeOpacity="0.28" strokeWidth="1.5"/>
      <path d="M8 12 Q14 8 20 12" stroke="#0B5C6C" strokeOpacity="0.33" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="14" cy="20" rx="6" ry="3.5" fill="#0B5C6C" fillOpacity="0.15"/>
      <path d="M4 15 Q1 12 3 8" stroke="#0B2A3C" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M24 15 Q27 12 25 8" stroke="#0B2A3C" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  filter: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="20" height="20" rx="3" fill="#0B5C6C" fillOpacity="0.08" stroke="#0B5C6C" strokeOpacity="0.24" strokeWidth="1.5"/>
      <line x1="4" y1="11" x2="24" y2="11" stroke="#0B5C6C" strokeOpacity="0.18" strokeWidth="1.2"/>
      <line x1="4" y1="17" x2="24" y2="17" stroke="#0B5C6C" strokeOpacity="0.18" strokeWidth="1.2"/>
      <line x1="11" y1="4" x2="11" y2="24" stroke="#0B5C6C" strokeOpacity="0.18" strokeWidth="1.2"/>
      <line x1="17" y1="4" x2="17" y2="24" stroke="#0B5C6C" strokeOpacity="0.18" strokeWidth="1.2"/>
    </svg>
  ),
};

const REQUEST_TIMING_NOTE =
  "Please allow 5–7 business days from your request for Midland Sleep staff to review and arrange supply delivery.";

const CATALOG_ITEMS = ["cushion", "headgear", "mask_kit", "filter"];

type ReorderStatus =
  | "new"
  | "reviewing"
  | "approved"
  | "sent"
  | "delivered"
  | "declined"
  | "needs_followup";

type RequestAccessStatus = "eligible" | "needs_review" | "not_eligible" | "no_funds";

// Statuses that block the new-request form. delivered is intentionally absent
// so patients can submit a fresh request once the previous one is complete.
const BLOCKING_STATUSES_PATIENT = new Set<ReorderStatus>([
  "new",
  "reviewing",
  "approved",
  "sent",
  "declined",
  "needs_followup",
]);

const CURRENT_REQUEST_HEADING: Record<ReorderStatus, string> = {
  new:            "Your supply request has been received",
  reviewing:      "Staff are reviewing your request",
  approved:       "Approved — staff are preparing your supplies",
  sent:           "On the way",
  delivered:      "Your supply request is complete",
  declined:       "Please contact Midland Sleep about this request",
  needs_followup: "Our team will contact you shortly",
};

const CURRENT_REQUEST_MESSAGE: Record<ReorderStatus, string> = {
  new:            "Staff will check your eligibility and availability before confirming supplies.",
  reviewing:      "Staff are reviewing the details of your request and will be in touch when it progresses.",
  approved:       "Midland Sleep will prepare your supplies.",
  sent:           "Your supplies have been dispatched or are on their way.",
  delivered:      "You can submit a new request when you need supplies again.",
  declined:       "Please call or email Midland Sleep — our team can discuss your options.",
  needs_followup: "Our team will contact you to confirm a few details before your request progresses.",
};

interface CurrentReorderRequest {
  id: string;
  referenceNumber: string;
  requestReference?: string;
  status: ReorderStatus;
  createdAt: string;
  updatedAt?: string;
  itemNames: string[];
  items?: string[];
  itemDescription?: string;
  statusMessage?: string;
  source?: string;
}

const STATUS_LABELS: Record<ReorderStatus, string> = {
  new:            "Received",
  reviewing:      "Being reviewed",
  approved:       "Approved",
  sent:           "Sent",
  delivered:      "Delivered",
  declined:       "Contact us",
  needs_followup: "We'll be in touch",
};

const STATUS_BADGE_CLS: Record<ReorderStatus, string> = {
  new:            "border-amber-200 bg-amber-100 text-amber-800",
  reviewing:      "border-blue-200 bg-blue-100 text-blue-800",
  approved:       "border-emerald-200 bg-emerald-100 text-emerald-800",
  sent:           "border-purple-200 bg-purple-100 text-purple-800",
  delivered:      "border-teal-200 bg-teal-100 text-teal-800",
  declined:       "border-red-200 bg-red-100 text-red-700",
  needs_followup: "border-orange-200 bg-orange-100 text-orange-700",
};

function formatStatus(status: ReorderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DeliveryAddressFields({
  address,
  onChange,
}: {
  address: DeliveryAddress;
  onChange: (field: keyof DeliveryAddress, value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="mb-2 block text-base font-medium text-charcoal">
          Address line 1
        </span>
        <input
          value={address.line1}
          onChange={(event) => onChange("line1", event.target.value)}
          className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
          placeholder="Street address"
        />
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-base font-medium text-charcoal">
          Address line 2 <span className="font-normal text-charcoal/60">(optional)</span>
        </span>
        <input
          value={address.line2}
          onChange={(event) => onChange("line2", event.target.value)}
          className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
          placeholder="Apartment, unit, or care of"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-base font-medium text-charcoal">
          City
        </span>
        <input
          value={address.city}
          onChange={(event) => onChange("city", event.target.value)}
          className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
          placeholder="Hamilton"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-base font-medium text-charcoal">
          Region
        </span>
        <input
          value={address.region}
          onChange={(event) => onChange("region", event.target.value)}
          className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
          placeholder="Waikato"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-base font-medium text-charcoal">
          Postcode
        </span>
        <input
          value={address.postcode}
          onChange={(event) => onChange("postcode", event.target.value)}
          className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
          inputMode="numeric"
          placeholder="3204"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-base font-medium text-charcoal">
          Country
        </span>
        <input
          value={address.country}
          onChange={(event) => onChange("country", event.target.value)}
          className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
          placeholder="New Zealand"
        />
      </label>
    </div>
  );
}

// ─── Option drawer ────────────────────────────────────────────────────────────

interface OptionDrawerProps {
  category: string;
  isSelected: boolean;
  currentOption: string | null;
  maskName: string | null;
  onConfirm: (optionId: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

function OptionDrawer({
  category,
  isSelected,
  currentOption,
  maskName,
  onConfirm,
  onRemove,
  onClose,
}: OptionDrawerProps) {
  const [picked, setPicked] = useState<string | null>(currentOption);
  const options = CATEGORY_OPTIONS[category] ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end lg:items-center lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${ITEM_LABELS[category]} supply options`}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 mb-[calc(4.75rem_+_env(safe-area-inset-bottom))] flex max-h-[calc(100dvh_-_6rem_-_env(safe-area-inset-bottom))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl lg:mb-0 lg:max-h-[min(90dvh,44rem)]">

        {/* Header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-sand bg-white px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-deep-teal sm:text-sm">
              Supply option
            </p>
            <h2 className="font-display text-xl font-semibold leading-snug text-navy sm:text-2xl">
              {ITEM_LABELS[category]}
            </h2>
            <p className="mt-1 text-sm leading-5 text-charcoal/75 sm:text-base sm:leading-6">
              {ITEM_DESCRIPTIONS[category]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-charcoal/50 hover:bg-sand-pale hover:text-charcoal transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>

        {/* Options list */}
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3 pb-5 sm:px-6 sm:py-5 sm:pb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/55 sm:text-sm">
            Staff will confirm suitability before supply
          </p>

          {options.map((opt, idx) => {
            const isRecommended = idx === 0 && maskName !== null;
            const isPicked = picked === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPicked(opt.id)}
                aria-pressed={isPicked}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors sm:p-4",
                  isPicked
                    ? "border-deep-teal bg-seafoam-pale/50"
                    : isRecommended
                    ? "border-seafoam/70 bg-seafoam-pale/25 hover:border-deep-teal/50"
                    : "border-sand bg-white hover:border-deep-teal/40 hover:bg-sand-pale/30"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold leading-snug text-charcoal sm:text-lg">{opt.name}</p>
                      {isRecommended && (
                        <span className="inline-flex rounded-full bg-[#0B5C6C] px-2.5 py-0.5 text-xs font-semibold text-white">
                          Recommended match
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-5 text-charcoal/65">{opt.description}</p>
                    <span className={cn(
                      "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium sm:text-sm",
                      isRecommended
                        ? "bg-white/80 text-deep-teal"
                        : "border border-sand bg-white text-charcoal/60"
                    )}>
                      {isRecommended ? "Recommended for your current mask" : "Alternative option"}
                    </span>
                  </div>
                  <span className={cn(
                    "shrink-0 h-5 w-5 rounded-full border-2 mt-1 flex items-center justify-center",
                    isPicked ? "border-deep-teal bg-deep-teal" : "border-sand"
                  )}>
                    {isPicked && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Not sure option */}
          <button
            type="button"
            onClick={() => setPicked("staff_confirm")}
            aria-pressed={picked === "staff_confirm"}
            className={cn(
              "w-full rounded-xl border p-3 text-left transition-colors sm:p-4",
              picked === "staff_confirm"
                ? "border-deep-teal bg-seafoam-pale/50"
                : "border-sand bg-white hover:border-deep-teal/40 hover:bg-sand-pale/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold leading-snug text-charcoal sm:text-lg">
                  Not sure — let staff choose
                </p>
                <p className="mt-1 text-sm leading-5 text-charcoal/65">
                  Staff will select the most suitable option for your equipment and therapy needs.
                </p>
              </div>
              <span className={cn(
                "shrink-0 h-5 w-5 rounded-full border-2 mt-1 flex items-center justify-center",
                picked === "staff_confirm" ? "border-deep-teal bg-deep-teal" : "border-sand"
              )}>
                {picked === "staff_confirm" && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
              </span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 shrink-0 space-y-2.5 border-t border-sand bg-sand-pale/30 px-4 py-3 pb-[calc(0.875rem_+_env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
          <p className="text-xs leading-5 text-charcoal/60 sm:text-sm">
            Staff will check eligibility, compatibility, and availability before confirming supplies.
            This is a request for review, not a confirmed order.
          </p>
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() => { if (picked) onConfirm(picked); }}
              disabled={!picked}
              className="w-full bg-[#0B5C6C] text-white px-6 py-3 rounded-lg text-base font-medium min-h-[48px] sm:w-auto
                         hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm selection
            </button>
            {isSelected && (
              <button
                type="button"
                onClick={onRemove}
                className="w-full px-6 py-3 rounded-lg text-base font-medium min-h-[48px] border border-red-200 text-red-700 bg-white hover:bg-red-50 transition-colors sm:w-auto"
              >
                Remove item
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full px-6 py-3 rounded-lg text-base font-medium min-h-[48px] border border-sand bg-white text-charcoal hover:border-deep-teal/40 transition-colors sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReorderPage() {
  const { patient } = useAuth();
  const { entitlement, loading } = usePatientData();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [savedAddress, setSavedAddress] = useState<DeliveryAddress | null>(null);
  const [overrideAddress, setOverrideAddress] = useState<DeliveryAddress>(
    EMPTY_DELIVERY_ADDRESS
  );
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [prefilledFromRecord, setPrefilledFromRecord] = useState(false);
  // Set as soon as the patient types into the override address fields, so the
  // async record-prefill below never clobbers something they've already entered.
  const addressEditedRef = useRef(false);
  const [submittedDeliveryAddress, setSubmittedDeliveryAddress] =
    useState<DeliveryAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedSource, setSubmittedSource] = useState<"supply" | "support">("supply");
  const [currentRequest, setCurrentRequest] =
    useState<CurrentReorderRequest | null>(null);
  const [currentRequestLoading, setCurrentRequestLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  // Support fallback form state
  const [supportDescription, setSupportDescription] = useState("");
  const [supportReason, setSupportReason] = useState("");
  const [supportContactPreference, setSupportContactPreference] = useState("either");
  const [drawerCategory, setDrawerCategory] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const addressStorageKey = getDeliveryAddressStorageKey(patient?.userId);

  const handleDrawerConfirm = (optionId: string) => {
    if (drawerCategory) {
      setSelectedItems((prev) =>
        prev.includes(drawerCategory) ? prev : [...prev, drawerCategory]
      );
      setSelectedOptions((prev) => ({ ...prev, [drawerCategory]: optionId }));
    }
    setDrawerCategory(null);
  };

  const handleDrawerRemove = () => {
    if (drawerCategory) {
      setSelectedItems((prev) => prev.filter((i) => i !== drawerCategory));
      setSelectedOptions((prev) => {
        const next = { ...prev };
        delete next[drawerCategory];
        return next;
      });
    }
    setDrawerCategory(null);
  };

  useEffect(() => {
    if (!patient?.userId) return;
    const storedAddress = readSavedDeliveryAddress(addressStorageKey);
    setSavedAddress(storedAddress);
    setUseSavedAddress(Boolean(storedAddress));
  }, [addressStorageKey, patient?.userId]);

  // Best-effort prefill from the patient's record when there is no locally-saved
  // address. Read-only into the editable override form — never auto-submitted.
  useEffect(() => {
    if (!patient?.userId) return;
    if (readSavedDeliveryAddress(addressStorageKey)) return;
    let cancelled = false;

    async function loadRecordAddress() {
      try {
        configureCognito();
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch("/api/patient/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({})) as {
          address_structured?: {
            line1?: string; line2?: string; suburb?: string;
            city?: string; region?: string; postal_code?: string; country?: string;
          } | null;
        };
        if (cancelled || !data.address_structured || addressEditedRef.current) return;
        const a = data.address_structured;
        const mapped = normalizeDeliveryAddress({
          line1: a.line1,
          line2: [a.line2, a.suburb].filter(Boolean).join(", "),
          city: a.city,
          region: a.region,
          postcode: a.postal_code,
          country: a.country,
        });
        if (hasCompleteDeliveryAddress(mapped)) {
          setOverrideAddress(mapped);
          setPrefilledFromRecord(true);
        }
      } catch {
        // Best-effort prefill — patient can still type the address manually.
      }
    }

    void loadRecordAddress();
    return () => {
      cancelled = true;
    };
  }, [addressStorageKey, patient?.userId]);

  useEffect(() => {
    if (!patient?.userId) return;
    let cancelled = false;

    async function loadCurrentRequest() {
      setCurrentRequestLoading(true);
      try {
        configureCognito();
        const token = await getIdToken();
        if (!token) throw new Error("Session expired. Please log in again.");

        const res = await fetch("/api/patient/reorder", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({})) as {
          request?: CurrentReorderRequest | null;
        };
        if (!cancelled && res.ok) {
          setCurrentRequest(data.request ?? null);
        }
      } catch {
        if (!cancelled) setCurrentRequest(null);
      } finally {
        if (!cancelled) setCurrentRequestLoading(false);
      }
    }

    void loadCurrentRequest();
    return () => {
      cancelled = true;
    };
  }, [patient?.userId]);

  if (loading) return <div className="p-8 text-charcoal/80 text-lg leading-7">Loading...</div>;
  if (!patient) return null;

  const items = entitlement?.items ?? [];
  const mask = DEMO_MASKS[patient.userId];
  const eligibleItems = items.filter((item) => item.status === "ELIGIBLE");
  const notYetItems = items.filter((item) => item.status === "NOT_YET");

  // Derive access status — default to needs_review to avoid blocking new patients
  const hasEligible = eligibleItems.length > 0;
  const requestAccessStatus: RequestAccessStatus =
    !entitlement      ? "needs_review"
    : items.length === 0 ? "needs_review"
    : hasEligible        ? "eligible"
    : "not_eligible";

  const canRequestSupply = requestAccessStatus === "eligible" || requestAccessStatus === "needs_review";

  // Newly imported patients with no entitlement record yet see the full catalog
  const showCatalogFallback = eligibleItems.length === 0 && !entitlement;
  const selectableItems = showCatalogFallback
    ? CATALOG_ITEMS.map((type) => ({ item_type: type, status: "ELIGIBLE" as const }))
    : eligibleItems;

  const hasSavedAddress = Boolean(savedAddress);
  const showAddressForm = !hasSavedAddress || !useSavedAddress;
  const activeDeliveryAddress =
    useSavedAddress && savedAddress ? savedAddress : overrideAddress;
  const isRequestBlocking = currentRequest !== null && BLOCKING_STATUSES_PATIENT.has(currentRequest.status);
  const canSendRequest =
    !isRequestBlocking &&
    selectedItems.length > 0 &&
    hasCompleteDeliveryAddress(activeDeliveryAddress);

  const updateOverrideAddress = (
    field: keyof DeliveryAddress,
    value: string
  ) => {
    addressEditedRef.current = true;
    setOverrideAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (currentRequest && BLOCKING_STATUSES_PATIENT.has(currentRequest.status)) return;
    const addressSnapshot = normalizeDeliveryAddress(activeDeliveryAddress);
    if (!hasCompleteDeliveryAddress(addressSnapshot) || selectedItems.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      configureCognito();
      const token = await getIdToken();
      if (!token) throw new Error("Session expired. Please log in again.");

      const res = await fetch("/api/patient/reorder", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "patient_portal",
          itemNames: selectedItems,
          deliveryAddress: addressSnapshot,
        }),
      });

      let data: {
        orderId?: string;
        existing?: boolean;
        request?: CurrentReorderRequest;
        error?: string;
      } = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }

      if (!res.ok) {
        throw new Error(data.error ?? "Unable to submit request. Please try again.");
      }
      if (!data.request) {
        throw new Error("Request submitted but no reference was returned. Please contact Midland Sleep.");
      }

      setCurrentRequest(data.request);

      if (data.existing) {
        setSelectedItems([]);
        setSubmitError(null);
        return;
      }

      if (!useSavedAddress && saveAsDefault) {
        saveDeliveryAddress(addressStorageKey, addressSnapshot);
        setSavedAddress(addressSnapshot);
        setUseSavedAddress(true);
      }

      setConfirmationId(data.request.referenceNumber);
      setSubmittedDeliveryAddress(addressSnapshot);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to submit request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportDescription.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      configureCognito();
      const token = await getIdToken();
      if (!token) throw new Error("Session expired. Please log in again.");

      const res = await fetch("/api/patient/reorder", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "support_request",
          itemDescription: supportDescription.trim(),
          reason: supportReason.trim() || undefined,
          contactPreference: supportContactPreference,
        }),
      });

      let data: { request?: CurrentReorderRequest; existing?: boolean; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON */ }

      if (!res.ok) throw new Error(data.error ?? "Unable to submit request. Please try again.");
      if (!data.request) throw new Error("Request submitted but no reference was returned. Please contact Midland Sleep.");

      setCurrentRequest(data.request);
      setConfirmationId(data.request.referenceNumber);
      setSubmittedSource("support");
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation view — shown only after the reorder record is successfully persisted
  if (isSubmitted) {
    const refDisplay = confirmationId;
    const isSupportConfirmation = submittedSource === "support";
    return (
      <>
        <div className="max-w-2xl mx-auto text-center py-12 space-y-5">
          <div className="h-16 w-16 rounded-full bg-seafoam-pale flex items-center justify-center mx-auto">
            <span className="text-seafoam text-2xl">&#10003;</span>
          </div>
          <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy">
            Your request has been received
          </h1>
          {isSupportConfirmation ? (
            <p className="text-lg leading-7 text-charcoal/80">
              {refDisplay
                ? `Request received — Reference: ${refDisplay}. Midland Sleep staff will review your message and be in touch.`
                : "Midland Sleep staff will review your message and be in touch."}
            </p>
          ) : (
            <p className="text-lg leading-7 text-charcoal/80">
              Midland Sleep staff will review your request and contact you if any further information is needed.
            </p>
          )}
          {refDisplay && (
            <div className="bg-white border border-sand rounded-2xl p-5 text-left">
              <p className="font-mono text-sm uppercase tracking-wide text-charcoal/70 mb-1">
                Reference
              </p>
              <p className="text-2xl font-semibold text-navy font-mono">{refDisplay}</p>
              <p className="mt-1 text-base leading-6 text-charcoal/70">
                Quote this reference if you contact Midland Sleep about this request.
              </p>
            </div>
          )}
          {!isSupportConfirmation && (
            <>
              <div className="bg-seafoam-pale/40 border border-seafoam/20 rounded-2xl p-5 text-left">
                <h2 className="text-xl font-semibold text-charcoal mb-3">What happens next</h2>
                <p className="text-lg leading-7 text-charcoal/85">
                  Please allow 5–7 business days for your request to be reviewed and supply delivery to be arranged.
                </p>
              </div>
              <div className="bg-white border border-sand rounded-2xl p-5 text-left">
                <h2 className="text-xl font-semibold text-charcoal mb-3">Items requested</h2>
                <ul className="space-y-2">
                  {selectedItems.map((itemType) => (
                    <li key={itemType} className="text-lg leading-7 text-charcoal/85">
                      {ITEM_LABELS[itemType]}
                      {selectedOptions[itemType] && (
                        <span className="text-base text-charcoal/60">
                          {" "}— {getOptionLabel(itemType, selectedOptions[itemType])}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {submittedDeliveryAddress && (
                <div className="bg-white border border-sand rounded-2xl p-5 text-left">
                  <h2 className="text-xl font-semibold text-charcoal mb-3">Delivery address</h2>
                  <div className="space-y-1 text-lg leading-7 text-charcoal/85">
                    {formatDeliveryAddress(submittedDeliveryAddress).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSelectedItems([]);
              setSelectedOptions({});
              setSaveAsDefault(false);
              setConfirmationId(null);
              setSubmitError(null);
              setSupportDescription("");
              setSupportReason("");
            }}
            className="text-lg text-deep-teal hover:underline mt-4 font-medium min-h-[44px]"
          >
            Back to requests
          </button>
        </div>
      </>
    );
  }

  // Support fallback form — for not_eligible patients with no pending request
  if (!canRequestSupply && !currentRequest && !currentRequestLoading) {
    return (
      <>
        <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-2">
          Contact Midland Sleep
        </h1>

        <div className="bg-sand-pale border border-sand rounded-2xl p-6 md:p-7 mb-7 space-y-2">
          <p className="text-lg font-semibold text-charcoal leading-snug">
            Funded supply requests are not currently available for your account.
          </p>
          <p className="text-base leading-6 text-charcoal/80">
            You are not currently eligible for funded supply requests through the portal. You can still tell Midland Sleep what you need and staff will review your options.
          </p>
        </div>

        <div className="bg-deep-teal/5 border border-deep-teal/10 rounded-lg px-4 py-4 mb-7">
          <p className="text-base leading-6 text-charcoal/85">
            Your message will be reviewed by Midland Sleep staff. Your information is handled in accordance with the Health Information Privacy Code 2020.
          </p>
        </div>

        <div className="rounded-2xl border border-sand bg-white p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy leading-snug">
            Send a message to Midland Sleep
          </h2>

          <label className="block">
            <span className="mb-2 block text-base font-medium text-charcoal">
              What do you need? <span className="text-deep-teal">*</span>
            </span>
            <textarea
              value={supportDescription}
              onChange={(e) => setSupportDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Describe the supplies or help you need"
              className="w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal
                         placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-base font-medium text-charcoal">
              Any additional context? <span className="font-normal text-charcoal/60">(optional)</span>
            </span>
            <textarea
              value={supportReason}
              onChange={(e) => setSupportReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Any other details that might help staff"
              className="w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal
                         placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-base font-medium text-charcoal">
              Best way to contact you
            </span>
            <select
              value={supportContactPreference}
              onChange={(e) => setSupportContactPreference(e.target.value)}
              className="min-h-[52px] w-full rounded-lg border border-sand bg-white px-4 py-3 text-lg text-charcoal
                         focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
            >
              <option value="email">Email on file</option>
              <option value="phone">Phone on file</option>
              <option value="either">Either</option>
            </select>
          </label>

          <div className="space-y-3">
            <button
              onClick={handleSupportSubmit}
              disabled={!supportDescription.trim() || isSubmitting}
              className="bg-[#0B5C6C] text-white px-7 py-3.5 rounded-lg text-lg
                         font-medium min-h-[52px] hover:bg-[#0B5C6C]/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send request to Midland Sleep"}
            </button>
            {submitError && (
              <p role="alert" className="text-base leading-6 text-[#C0392B] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {submitError}
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[26px] sm:text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-2">
        Request Supplies
      </h1>
      {mask && (
        <div className="mb-5 rounded-xl border border-sand bg-white p-4 sm:p-5">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
            <EquipmentVisual type="mask" className="h-24 sm:h-32 w-full min-w-0" />
            <div className="min-w-0">
              <p className="mb-1 font-mono text-sm uppercase tracking-wide text-gray-700">
                Current mask
              </p>
              <p className="text-2xl font-semibold leading-8 text-charcoal">
                {mask.brand} {mask.name}
              </p>
              <p className="mt-2 text-base leading-7 text-charcoal/75">
                Supply options below are based on this mask record and will be reviewed by Midland Sleep staff.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy notice — HIPC Rule 3: must appear ABOVE any data collection */}
      <div className="bg-deep-teal/5 border border-deep-teal/10 rounded-lg px-4 py-4 mb-7">
        <p className="text-base leading-6 text-charcoal/85">
          Your request will be reviewed by Midland Sleep staff. We collect your
          delivery address so staff can arrange supplies. Your information is handled in
          accordance with the Health Information Privacy Code 2020.
        </p>
      </div>

      {currentRequestLoading && (
        <div className="mb-7 rounded-xl border border-sand bg-white p-5 text-base leading-6 text-charcoal/75">
          Checking current request status...
        </div>
      )}

      {currentRequest && (
        <section className="mb-7 rounded-2xl border border-deep-teal/20 bg-seafoam-pale/35 p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-1 font-mono text-sm font-semibold uppercase tracking-wide text-deep-teal">
                Current request
              </p>
              <h2 className="font-display text-2xl font-semibold leading-snug text-navy">
                {CURRENT_REQUEST_HEADING[currentRequest.status]}
              </h2>
            </div>
            <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_BADGE_CLS[currentRequest.status]}`}>
              {formatStatus(currentRequest.status)}
            </span>
          </div>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="font-mono text-sm uppercase tracking-wide text-charcoal/70">
                Reference ID
              </dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-navy">
                {currentRequest.referenceNumber}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-sm uppercase tracking-wide text-charcoal/70">
                Submitted date
              </dt>
              <dd className="mt-1 text-lg font-semibold text-charcoal">
                {formatDate(currentRequest.createdAt)}
              </dd>
            </div>
            {currentRequest.updatedAt && currentRequest.updatedAt !== currentRequest.createdAt && (
              <div>
                <dt className="font-mono text-sm uppercase tracking-wide text-charcoal/70">
                  Last updated
                </dt>
                <dd className="mt-1 text-lg font-semibold text-charcoal">
                  {formatDate(currentRequest.updatedAt)}
                </dd>
              </div>
            )}
            <div className="md:col-span-2">
              <dt className="font-mono text-sm uppercase tracking-wide text-charcoal/70">
                Items requested
              </dt>
              <dd className="mt-1 text-lg leading-7 text-charcoal">
                {(currentRequest.itemNames ?? currentRequest.items ?? []).map((itemType) => ITEM_LABELS[itemType] ?? itemType).join(", ")}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-base leading-6 text-charcoal/85">
            {CURRENT_REQUEST_MESSAGE[currentRequest.status]}
          </p>
        </section>
      )}

      {isRequestBlocking ? (
        currentRequest?.status === "declined" ? (
          <div className="rounded-2xl border border-sand bg-white p-6 md:p-7 space-y-3">
            <p className="text-lg font-medium leading-7 text-charcoal">
              To discuss your options, please contact Midland Sleep.
            </p>
            <a
              href="tel:0800000000"
              className="inline-flex items-center text-lg text-deep-teal font-medium hover:underline min-h-[44px]"
            >
              Call 0800 000 000
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-sand bg-white p-6 md:p-7 space-y-3">
            <p className="text-lg font-medium leading-7 text-charcoal">
              Your request is being processed. We will be in touch when it progresses.
            </p>
            <p className="text-base leading-6 text-charcoal/75">
              If you need to change or cancel your request, please contact Midland Sleep.
            </p>
          </div>
        )
      ) : selectableItems.length === 0 ? (
        <div className="bg-sand-pale border border-sand rounded-2xl p-6 md:p-7 text-center">
          <p className="text-lg leading-7 text-charcoal font-medium mb-2">
            No supplies are available to request right now
          </p>
          {notYetItems.length > 0 && notYetItems[0].next_eligible_date && (
            <p className="text-base leading-6 text-charcoal/80">
              Your supplies will be available from{" "}
              {formatDate(notYetItems[0].next_eligible_date)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {/* Step 1: Eligible items */}
          <section className="rounded-2xl border border-sand bg-white p-4 sm:p-5 md:p-6">
            <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 font-mono text-sm font-semibold uppercase tracking-wide text-deep-teal">
                  Step 1
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy leading-snug">
                  Choose supplies
                </h2>
                <p className="mt-2 text-base leading-6 text-charcoal/75">
                  Select the items you would like Midland Sleep staff to review.
                </p>
              </div>
              <div className="rounded-xl border border-sand bg-sand-pale/50 px-4 py-3 text-base text-charcoal/80">
                <span className="font-semibold text-charcoal">{selectedItems.length}</span>{" "}
                selected
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {selectableItems.map((item) => {
                const isSelected = selectedItems.includes(item.item_type);
                return (
                  <button
                    key={item.item_type}
                    aria-pressed={isSelected}
                    onClick={() => setDrawerCategory(item.item_type)}
                    className={cn(
                      "w-full border rounded-2xl p-3.5 sm:p-5 text-left transition-colors min-h-[64px] sm:min-h-[190px] focus:outline-none focus:ring-2 focus:ring-deep-teal",
                      isSelected
                        ? "border-deep-teal bg-seafoam-pale/50 shadow-sm"
                        : "border-sand bg-white hover:border-deep-teal/40 hover:bg-sand-pale/30"
                    )}
                  >
                    <div className="flex items-center sm:items-start justify-between gap-3">
                      <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-sand-pale flex items-center justify-center shrink-0">
                        {ITEM_ICONS[item.item_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 sm:block">
                          <p className="text-base sm:text-xl font-semibold text-charcoal leading-snug sm:leading-7">
                            {ITEM_LABELS[item.item_type]}
                          </p>
                          <span
                            className={cn(
                              "sm:hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              isSelected
                                ? "bg-deep-teal text-white"
                                : "border border-sand bg-white text-charcoal/60"
                            )}
                            aria-hidden="true"
                          >
                            {isSelected ? "✓ Added" : "+ Add"}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-charcoal/80 mt-0.5 sm:mt-1 leading-snug sm:leading-6">
                          {ITEM_DESCRIPTIONS[item.item_type]}
                        </p>
                        <p className="hidden sm:block text-sm text-charcoal/55 mt-1 leading-5">
                          {(CATALOGUE_COUNTS[item.item_type] ?? 0) === 1
                            ? "1 related catalogue item — helps staff match your request. Staff will confirm availability during review."
                            : `${CATALOGUE_COUNTS[item.item_type] ?? 0} related catalogue items — help staff match your request. Staff will confirm availability during review.`}
                        </p>
                        {isSelected && selectedOptions[item.item_type] && (
                          <p className="mt-1 text-sm font-medium text-deep-teal">
                            {getOptionLabel(item.item_type, selectedOptions[item.item_type])}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "hidden sm:inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-semibold",
                          isSelected
                            ? "bg-deep-teal text-white"
                            : "border border-sand bg-white text-charcoal/70"
                        )}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </span>
                    </div>
                    <div className="hidden sm:flex mt-4 flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-seafoam-pale px-3 py-1 text-sm font-medium text-deep-teal">
                        Available for staff review
                      </span>
                      <span className="inline-flex rounded-full border border-sand bg-white px-3 py-1 text-sm font-medium text-charcoal/70">
                        Replacement item
                      </span>
                    </div>
                    {!isSelected && (
                      <p className="hidden sm:block mt-3 text-sm text-charcoal/50">
                        Tap to choose a specific option
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedItems.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-deep-teal/15 bg-deep-teal/5 p-4">
                  <p className="text-base font-semibold text-charcoal">Selected for staff review</p>
                  <ul className="mt-2 space-y-2">
                    {selectedItems.map((itemType) => (
                      <li key={itemType} className="flex flex-wrap items-baseline gap-x-1.5 text-base leading-6">
                        <span className="font-medium text-charcoal">{ITEM_LABELS[itemType]}</span>
                        {selectedOptions[itemType] && (
                          <span className="text-charcoal/60">— {getOptionLabel(itemType, selectedOptions[itemType])}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setDrawerCategory(itemType)}
                          className="text-sm text-deep-teal hover:underline"
                        >
                          Change
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-sand bg-sand-pale/40 p-3 sm:p-4">
                  <p className="hidden sm:block mb-2 font-mono text-sm uppercase tracking-wide text-charcoal/70">Staff review</p>
                  <p className="hidden sm:block text-base font-semibold text-charcoal">Available for staff review</p>
                  <p className="text-sm sm:text-base leading-5 sm:leading-6 text-charcoal/75">
                    Staff will confirm eligibility and availability before arranging supply.
                  </p>
                  <p className="hidden sm:block mt-3 text-sm text-charcoal/60">
                    Staff will check your eligibility and availability before confirming supplies.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Not-yet items */}
          {notYetItems.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-navy mb-3">
                Not yet available
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {notYetItems.map((item) => (
                  <div
                    key={item.item_type}
                    className="border border-sand rounded-2xl p-5 bg-sand-pale/50"
                  >
                    <div className="mb-4 h-11 w-11 rounded-xl bg-white/60 flex items-center justify-center opacity-60">
                      {ITEM_ICONS[item.item_type]}
                    </div>
                    <p className="text-xl font-semibold text-charcoal leading-7">
                      {ITEM_LABELS[item.item_type]}
                    </p>
                    <p className="text-base text-charcoal/80 mt-1 leading-6">
                      {ITEM_DESCRIPTIONS[item.item_type]}
                    </p>
                    <span className="inline-flex mt-4 rounded-full border border-sand bg-white px-3 py-1 text-sm font-medium text-charcoal/75">
                      Available from{" "}
                      {item.next_eligible_date
                        ? formatDate(item.next_eligible_date)
                        : "later this year"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Delivery address */}
          <section className="rounded-2xl border border-sand bg-white p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
            <div>
              <p className="mb-1 font-mono text-sm font-semibold uppercase tracking-wide text-deep-teal">
                Step 2
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy leading-snug">
                Confirm delivery address
              </h2>
              <p className="mt-1 text-base leading-6 text-charcoal/75">
                Midland Sleep staff will use this address when reviewing this
                supply request.
              </p>
            </div>

            {savedAddress && (
              <div className="rounded-xl border border-sand bg-sand-pale/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 font-mono text-sm uppercase tracking-wide text-charcoal/80">
                      Default delivery address
                    </p>
                    <div className="space-y-1 text-lg leading-7 text-charcoal">
                      {formatDeliveryAddress(savedAddress).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <span className="rounded-full border border-deep-teal/20 bg-seafoam-pale/40 px-3 py-1 text-sm font-medium text-deep-teal">
                    {useSavedAddress ? "Selected" : "Saved"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {!useSavedAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseSavedAddress(true);
                        setSaveAsDefault(false);
                      }}
                      className="min-h-[48px] rounded-lg border border-deep-teal/30 px-5 py-2.5 text-base font-medium text-deep-teal hover:bg-sky-blue"
                    >
                      Use saved address
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setUseSavedAddress(false)}
                    className="min-h-[48px] rounded-lg border border-sand px-5 py-2.5 text-base font-medium text-charcoal hover:border-deep-teal/40"
                  >
                    Use a different address
                  </button>
                </div>
              </div>
            )}

            {showAddressForm && (
              <div className="space-y-5">
                {!savedAddress && (
                  <div className="rounded-lg border border-dashed border-sand bg-sand-pale/50 p-3 sm:p-5">
                    <p className="text-base font-semibold text-charcoal">
                      {prefilledFromRecord ? "Prefilled from your patient record" : "No default address saved"}
                    </p>
                    <p className="mt-0.5 sm:mt-1 text-sm sm:text-base leading-5 sm:leading-6 text-charcoal/75">
                      {prefilledFromRecord
                        ? "Please confirm this address is correct, or update it before submitting."
                        : "Enter an address for this request."}
                    </p>
                  </div>
                )}

                {savedAddress && (
                  <p className="text-base leading-6 text-charcoal/75">
                    Enter the delivery address to use for this request.
                  </p>
                )}

                <DeliveryAddressFields
                  address={overrideAddress}
                  onChange={updateOverrideAddress}
                />

                <label className="flex items-start gap-3 rounded-xl border border-sand bg-sand-pale/40 p-4">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(event) => setSaveAsDefault(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-sand text-deep-teal focus:ring-deep-teal"
                  />
                  <span className="text-base leading-6 text-charcoal/80">
                    Save this as my default delivery address for future supply
                    requests.
                  </span>
                </label>
              </div>
            )}
          </section>

          {/* Sticky mobile send bar — sits above the bottom nav (fixed bottom-16 = 64px) */}
          <div className="fixed bottom-16 left-0 right-0 z-30 lg:hidden bg-white border-t border-sand shadow-lg px-4 py-3">
            <button
              onClick={handleSubmit}
              disabled={!canSendRequest || isSubmitting}
              className="w-full min-h-[52px] rounded-lg bg-[#0B5C6C] text-white text-base font-medium
                         hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : canSendRequest ? "Send request" : "Select supplies to send"}
            </button>
          </div>

          {/* Step 3: Review and submit */}
          <section className="rounded-2xl border border-sand bg-white p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
            <div>
              <p className="mb-1 font-mono text-sm font-semibold uppercase tracking-wide text-deep-teal">
                Step 3
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy leading-snug">
                Review and send request
              </h2>
              <p className="mt-1 text-base leading-6 text-charcoal/75">
                Midland Sleep staff will review this request before arranging supply delivery.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-sand bg-sand-pale/40 p-4">
                <p className="mb-2 font-mono text-sm uppercase tracking-wide text-charcoal/70">
                  Supplies requested
                </p>
                {selectedItems.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedItems.map((itemType) => (
                      <li key={itemType}>
                        <p className="text-lg leading-7 text-charcoal font-medium">{ITEM_LABELS[itemType]}</p>
                        {selectedOptions[itemType] && (
                          <p className="text-sm text-charcoal/60 leading-5">
                            {getOptionLabel(itemType, selectedOptions[itemType])}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base leading-6 text-charcoal/65">
                    Choose at least one supply item in Step 1.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-sand bg-sand-pale/40 p-4">
                <p className="mb-2 font-mono text-sm uppercase tracking-wide text-charcoal/70">
                  Delivery address
                </p>
                {hasCompleteDeliveryAddress(activeDeliveryAddress) ? (
                  <div className="space-y-1 text-lg leading-7 text-charcoal">
                    {formatDeliveryAddress(activeDeliveryAddress).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-base leading-6 text-charcoal/65">
                    Confirm a complete delivery address in Step 2.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-deep-teal/15 bg-deep-teal/5 p-4">
              <p className="text-base leading-6 text-charcoal/85">
                {REQUEST_TIMING_NOTE}
              </p>
            </div>

            <div className="space-y-3">
              <p className="hidden sm:block text-base leading-6 text-charcoal/75">
                Select at least one item and confirm a delivery address to send your request.
              </p>
              <button
                onClick={handleSubmit}
                disabled={!canSendRequest || isSubmitting}
                className="w-full sm:w-auto bg-[#0B5C6C] text-white px-7 py-3.5 rounded-lg text-lg
                           font-medium min-h-[52px] hover:bg-[#0B5C6C]/90 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send request"}
              </button>
              {submitError && (
                <p role="alert" className="text-base leading-6 text-[#C0392B] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {submitError}
                </p>
              )}
            </div>
          </section>

          {/* Spacer: keeps Step 3 clear of the sticky send bar + bottom nav on mobile */}
          <div className="h-20 lg:hidden" aria-hidden="true" />
        </div>
      )}
      {drawerCategory !== null && (
        <OptionDrawer
          key={drawerCategory}
          category={drawerCategory}
          isSelected={selectedItems.includes(drawerCategory)}
          currentOption={selectedOptions[drawerCategory] ?? null}
          maskName={mask ? `${mask.brand} ${mask.name}` : null}
          onConfirm={handleDrawerConfirm}
          onRemove={handleDrawerRemove}
          onClose={() => setDrawerCategory(null)}
        />
      )}
    </>
  );
}
