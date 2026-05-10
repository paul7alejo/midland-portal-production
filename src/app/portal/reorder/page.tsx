"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePatientData } from "@/hooks/usePatientData";
import { cn } from "@/lib/utils";
import { DEMO_MASKS } from "@/lib/demoData";

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

export default function ReorderPage() {
  const { patient } = useAuth();
  const { entitlement, loading } = usePatientData();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (loading) return <div className="p-8 text-charcoal/60">Loading...</div>;
  if (!patient) return null;

  const items = entitlement?.items ?? [];
  const mask = DEMO_MASKS[patient.userId];
  const eligibleItems = items.filter((item) => item.status === "ELIGIBLE");
  const notYetItems = items.filter((item) => item.status === "NOT_YET");

  const toggleItem = (itemType: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemType)
        ? prev.filter((i) => i !== itemType)
        : [...prev, itemType]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
          <h1 className="font-display text-[34px] font-semibold text-navy">
            Your request has been received
          </h1>
          <p className="text-lg leading-7 text-charcoal/75">
            Midland Sleep staff will review your request and contact you if
            anything else is needed.
          </p>
          <div className="bg-white border border-sand rounded-2xl p-5 text-left mt-6">
            <h2 className="text-xl font-semibold text-charcoal mb-3">Items requested</h2>
            <ul className="space-y-2">
              {selectedItems.map((itemType) => (
                <li key={itemType} className="text-lg leading-7 text-charcoal/80">
                  {ITEM_LABELS[itemType]}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSelectedItems([]);
            }}
            className="text-base text-deep-teal hover:underline mt-4"
          >
            Make another request
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[34px] font-semibold text-navy mb-2">
        Request Supplies
      </h1>
      {mask && (
        <div className="mb-6 rounded-xl border border-sand bg-white p-5">
          <p className="mb-1 font-mono text-sm uppercase text-gray-700">
            Current mask
          </p>
          <p className="text-xl font-semibold leading-7 text-charcoal">
            {mask.brand} {mask.name}
          </p>
          <p className="mt-2 text-base leading-7 text-charcoal/70">
            Supply options below are based on this mask record.
          </p>
        </div>
      )}

      {/* Privacy notice — HIPC Rule 3: must appear ABOVE any data collection */}
      <div className="bg-sky-blue border border-deep-teal/10 rounded-xl px-5 py-4 mb-6">
        <p className="text-base leading-7 text-charcoal/80">
          Your request will be reviewed by Midland Sleep staff. We collect your
          delivery address so staff can arrange supplies. Your information is handled in
          accordance with the Health Information Privacy Code 2020.
        </p>
      </div>

      {eligibleItems.length === 0 ? (
        <div className="bg-sand-pale border border-sand rounded-2xl p-7 text-center">
          <p className="text-xl font-semibold text-charcoal mb-2">
            No supplies are available to request right now
          </p>
          {notYetItems.length > 0 && notYetItems[0].next_eligible_date && (
            <p className="text-lg leading-7 text-charcoal/70">
              Your supplies will be available from{" "}
              {formatDate(notYetItems[0].next_eligible_date)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Eligible items */}
          <div>
            <h2 className="text-[22px] font-semibold text-charcoal mb-3">
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
                      "min-h-[160px] border rounded-2xl p-5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-deep-teal",
                      isSelected
                        ? "border-deep-teal bg-seafoam-pale/50 shadow-sm"
                        : "border-sand bg-white hover:border-deep-teal/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xl font-semibold leading-7 text-charcoal">
                          {ITEM_LABELS[item.item_type]}
                        </p>
                        <p className="text-base leading-7 text-charcoal/70 mt-1">
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
              <h2 className="text-xl font-semibold text-charcoal mb-3">
                Not yet available
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {notYetItems.map((item) => (
                  <div
                    key={item.item_type}
                    className="border border-sand rounded-2xl bg-sand-pale/50 p-5"
                  >
                    <p className="text-xl font-semibold leading-7 text-charcoal">
                      {ITEM_LABELS[item.item_type]}
                    </p>
                    <p className="text-base leading-7 text-charcoal/70 mt-1">
                      {ITEM_DESCRIPTIONS[item.item_type]}
                    </p>
                    <span className="inline-flex mt-4 rounded-full border border-sand bg-white px-3 py-1 text-sm font-medium text-charcoal/70">
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
          <div>
            <label
              htmlFor="address"
              className="block text-lg font-semibold text-charcoal mb-2"
            >
              Delivery address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your delivery address"
              rows={4}
              className="w-full px-3 py-3 border border-sand rounded-md
                         focus:outline-none focus:ring-2 focus:ring-deep-teal
                         focus:border-transparent bg-white text-charcoal
                         placeholder:text-charcoal/40 text-lg leading-7 min-h-[132px]"
            />
          </div>

          {/* Submit */}
          <p className="text-base leading-7 text-charcoal/70">
            Select at least one available item and enter your delivery address
            before sending your request.
          </p>
          <button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || !address.trim() || isSubmitting}
            className="bg-[#0B5C6C] text-white px-6 py-3 rounded-lg text-lg
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
