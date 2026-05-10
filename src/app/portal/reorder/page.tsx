"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePatientData } from "@/hooks/usePatientData";
import { cn } from "@/lib/utils";
import { DEMO_MASKS } from "@/lib/demoData";
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
    <div className="grid gap-4 md:grid-cols-2">
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
  const [submittedDeliveryAddress, setSubmittedDeliveryAddress] =
    useState<DeliveryAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const addressStorageKey = getDeliveryAddressStorageKey(patient?.userId);

  useEffect(() => {
    if (!patient?.userId) return;
    const storedAddress = readSavedDeliveryAddress(addressStorageKey);
    setSavedAddress(storedAddress);
    setUseSavedAddress(Boolean(storedAddress));
  }, [addressStorageKey, patient?.userId]);

  if (loading) return <div className="p-8 text-charcoal/80 text-lg leading-7">Loading...</div>;
  if (!patient) return null;

  const items = entitlement?.items ?? [];
  const mask = DEMO_MASKS[patient.userId];
  const eligibleItems = items.filter((item) => item.status === "ELIGIBLE");
  const notYetItems = items.filter((item) => item.status === "NOT_YET");
  const hasSavedAddress = Boolean(savedAddress);
  const showAddressForm = !hasSavedAddress || !useSavedAddress;
  const activeDeliveryAddress =
    useSavedAddress && savedAddress ? savedAddress : overrideAddress;
  const canSendRequest =
    selectedItems.length > 0 && hasCompleteDeliveryAddress(activeDeliveryAddress);

  const toggleItem = (itemType: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemType)
        ? prev.filter((i) => i !== itemType)
        : [...prev, itemType]
    );
  };

  const updateOverrideAddress = (
    field: keyof DeliveryAddress,
    value: string
  ) => {
    setOverrideAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const addressSnapshot = normalizeDeliveryAddress(activeDeliveryAddress);
    if (!hasCompleteDeliveryAddress(addressSnapshot)) return;

    setIsSubmitting(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!useSavedAddress && saveAsDefault) {
      saveDeliveryAddress(addressStorageKey, addressSnapshot);
      setSavedAddress(addressSnapshot);
      setUseSavedAddress(true);
    }
    setSubmittedDeliveryAddress(addressSnapshot);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  // Confirmation view — shown after successful submission
  if (isSubmitted) {
    return (
      <>
        <div className="max-w-2xl mx-auto text-center py-12 space-y-5">
          <div className="h-16 w-16 rounded-full bg-seafoam-pale flex items-center justify-center mx-auto">
            <span className="text-seafoam text-2xl">&#10003;</span>
          </div>
          <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy">
            Your request has been received
          </h1>
          <p className="text-lg leading-7 text-charcoal/80">
            Midland Sleep staff will review your request and contact you if anything else is needed.
          </p>
          <div className="bg-white border border-sand rounded-2xl p-5 text-left mt-6">
            <h2 className="text-xl font-semibold text-charcoal mb-3">Items requested</h2>
            <ul className="space-y-2">
              {selectedItems.map((itemType) => (
                <li key={itemType} className="text-lg leading-7 text-charcoal/85">
                  {ITEM_LABELS[itemType]}
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
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSelectedItems([]);
              setSaveAsDefault(false);
            }}
            className="text-lg text-deep-teal hover:underline mt-4 font-medium min-h-[44px]"
          >
            Make another request
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-2">
        Request Supplies
      </h1>
      {mask && (
        <div className="mb-6 rounded-xl border border-sand bg-white p-5">
          <p className="mb-1 font-mono text-sm uppercase tracking-wide text-gray-700">
            Current mask
          </p>
          <p className="text-xl font-semibold leading-7 text-charcoal">
            {mask.brand} {mask.name}
          </p>
          <p className="mt-2 text-base leading-7 text-charcoal/75">
            Supply options below are based on this mask record.
          </p>
        </div>
      )}

      {/* Privacy notice — HIPC Rule 3: must appear ABOVE any data collection */}
      <div className="bg-sky-blue border border-deep-teal/10 rounded-lg px-4 py-4 mb-7">
        <p className="text-base leading-6 text-charcoal/85">
          Your request will be reviewed by Midland Sleep staff. We collect your
          delivery address so staff can arrange supplies. Your information is handled in
          accordance with the Health Information Privacy Code 2020.
        </p>
      </div>

      {eligibleItems.length === 0 ? (
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
          {/* Eligible items */}
          <div>
            <h2 className="text-2xl font-semibold text-charcoal mb-4 leading-snug">
              Available supplies
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {eligibleItems.map((item) => {
                const isSelected = selectedItems.includes(item.item_type);
                return (
                  <button
                    key={item.item_type}
                    aria-pressed={isSelected}
                    onClick={() => toggleItem(item.item_type)}
                    className={cn(
                      "border rounded-2xl p-5 text-left transition-colors min-h-[160px] focus:outline-none focus:ring-2 focus:ring-deep-teal",
                      isSelected
                        ? "border-deep-teal bg-seafoam-pale/50 shadow-sm"
                        : "border-sand bg-white hover:border-deep-teal/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xl font-semibold text-charcoal leading-7">
                          {ITEM_LABELS[item.item_type]}
                        </p>
                        <p className="text-base text-charcoal/80 mt-1 leading-6">
                          {ITEM_DESCRIPTIONS[item.item_type]}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "h-6 w-6 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center",
                          isSelected
                            ? "border-deep-teal bg-deep-teal"
                            : "border-sand"
                        )}
                      >
                        {isSelected && (
                          <span className="text-white text-xs">&#10003;</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-seafoam-pale px-3 py-1 text-sm font-medium text-deep-teal">
                        Available now
                      </span>
                      <span className="inline-flex rounded-full border border-sand bg-white px-3 py-1 text-sm font-medium text-charcoal/70">
                        Replacement item
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Not-yet items */}
          {notYetItems.length > 0 && (
            <div>
              <h2 className="text-xl font-medium text-charcoal/80 mb-3">
                Not yet available
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {notYetItems.map((item) => (
                  <div
                    key={item.item_type}
                    className="border border-sand rounded-2xl p-5 bg-sand-pale/50"
                  >
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

          {/* Delivery address */}
          <section className="rounded-2xl border border-sand bg-white p-5 md:p-6 space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-charcoal leading-snug">
                Delivery address
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
                  <span className="rounded-full border border-deep-teal/20 bg-sky-blue px-3 py-1 text-sm font-medium text-deep-teal">
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
                  <div className="rounded-xl border border-dashed border-sand bg-sand-pale/50 p-5">
                    <p className="text-lg font-semibold text-charcoal">
                      No default delivery address is saved yet
                    </p>
                    <p className="mt-1 text-base leading-6 text-charcoal/75">
                      Enter an address for this request. You can choose whether
                      to save it as your default.
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

          {/* Submit */}
          <p className="text-base leading-6 text-charcoal/75">
            Select at least one item and confirm a delivery address to send your request.
          </p>
          <button
            onClick={handleSubmit}
            disabled={!canSendRequest || isSubmitting}
            className="bg-[#0B5C6C] text-white px-7 py-3.5 rounded-lg text-lg
                       font-medium min-h-[52px] hover:bg-[#0B5C6C]/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Send request"}
          </button>
        </div>
      )}
    </>
  );
}
