"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import {
  DEMO_ENTITLEMENTS,
  DEMO_MASKS,
} from "@/lib/demoData";

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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!patient) return null;

  const entitlement = DEMO_ENTITLEMENTS[patient.userId] ?? [];
  const mask = DEMO_MASKS[patient.userId];
  const eligibleItems = entitlement.filter((item) => item.status === "ELIGIBLE");
  const notYetItems = entitlement.filter((item) => item.status === "NOT_YET");

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
        <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
          <div className="h-16 w-16 rounded-full bg-seafoam-pale flex items-center justify-center mx-auto">
            <span className="text-seafoam text-2xl">&#10003;</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">
            Your request has been received
          </h1>
          <p className="text-charcoal/70">
            We will review your request and dispatch your supplies shortly.
            You will receive a confirmation at your email address.
          </p>
          <div className="bg-white border border-sand rounded-lg p-4 text-left mt-6">
            <h2 className="text-sm font-medium text-charcoal mb-2">Items requested</h2>
            <ul className="space-y-1">
              {selectedItems.map((itemType) => (
                <li key={itemType} className="text-sm text-charcoal/80">
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
            className="text-sm text-deep-teal hover:underline mt-4"
          >
            Make another request
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Request Supplies
      </h1>
      {mask && (
        <p className="text-sm text-charcoal/70 mb-6">
          Based on your current mask:{" "}
          <span className="font-medium text-charcoal">
            {mask.brand} {mask.name}
          </span>
        </p>
      )}

      {/* Privacy notice — HIPC Rule 3: must appear ABOVE any data collection */}
      <div className="bg-sky-blue border border-deep-teal/10 rounded-lg px-4 py-3 mb-6">
        <p className="text-xs text-charcoal/80">
          Your request will be reviewed by Midland Sleep staff. We collect your
          delivery address to dispatch supplies. Your information is handled in
          accordance with the Health Information Privacy Code 2020.
        </p>
      </div>

      {eligibleItems.length === 0 ? (
        <div className="bg-sand-pale border border-sand rounded-lg p-6 text-center">
          <p className="text-charcoal font-medium mb-2">
            No supplies are available to request right now
          </p>
          {notYetItems.length > 0 && notYetItems[0].next_eligible_date && (
            <p className="text-sm text-charcoal/70">
              Your supplies will be available from{" "}
              {formatDate(notYetItems[0].next_eligible_date)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Eligible items */}
          <div>
            <h2 className="text-sm font-medium text-charcoal mb-3">
              Available supplies
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {eligibleItems.map((item) => {
                const isSelected = selectedItems.includes(item.item_type);
                return (
                  <button
                    key={item.item_type}
                    onClick={() => toggleItem(item.item_type)}
                    className={cn(
                      "border rounded-lg p-4 text-left transition-colors",
                      isSelected
                        ? "border-deep-teal bg-seafoam-pale/50"
                        : "border-sand bg-white hover:border-deep-teal/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {ITEM_LABELS[item.item_type]}
                        </p>
                        <p className="text-xs text-charcoal/60 mt-1">
                          {ITEM_DESCRIPTIONS[item.item_type]}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "h-5 w-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center",
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
                    <span className="inline-block mt-2 text-xs text-seafoam font-medium">
                      Available
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Not-yet items */}
          {notYetItems.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-charcoal/60 mb-3">
                Not yet available
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {notYetItems.map((item) => (
                  <div
                    key={item.item_type}
                    className="border border-sand rounded-lg p-4 opacity-60"
                  >
                    <p className="text-sm font-medium text-charcoal">
                      {ITEM_LABELS[item.item_type]}
                    </p>
                    <p className="text-xs text-charcoal/60 mt-1">
                      {ITEM_DESCRIPTIONS[item.item_type]}
                    </p>
                    <span className="inline-block mt-2 text-xs text-charcoal/50">
                      From{" "}
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
              className="block text-sm font-medium text-charcoal mb-1"
            >
              Delivery address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your delivery address"
              rows={3}
              className="w-full px-3 py-2 border border-sand rounded-md
                         focus:outline-none focus:ring-2 focus:ring-deep-teal
                         focus:border-transparent bg-white text-charcoal
                         placeholder:text-charcoal/40 text-sm"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || !address.trim() || isSubmitting}
            className="bg-deep-teal text-white px-6 py-2.5 rounded-full text-sm
                       font-medium hover:bg-deep-teal/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Send request"}
          </button>
        </div>
      )}
    </>
  );
}
