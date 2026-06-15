"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";
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

interface ProfileData {
  name: string;
  email: string;
  msid: string;
  org_id: string;
}

type NhiState =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "revealed"; nhi: string; secondsLeft: number }
  | { status: "error"; message: string };

export default function ProfilePage() {
  const { patient } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [nhiState, setNhiState] = useState<NhiState>({ status: "hidden" });
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(
    EMPTY_DELIVERY_ADDRESS
  );
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      configureCognito();
      const token = await getIdToken();
      if (!token) { setProfileLoading(false); return; }
      const res = await fetch("/api/patient/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfile(await res.json());
      setProfileLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const msid = profile?.msid ?? (patient as { msid?: string })?.msid ?? "";
  const addressStorageKey = getDeliveryAddressStorageKey(patient?.userId);

  useEffect(() => {
    if (!patient?.userId) return;
    const savedAddress = readSavedDeliveryAddress(addressStorageKey);
    if (savedAddress) setDeliveryAddress(savedAddress);
  }, [addressStorageKey, patient?.userId]);

  const handleCopy = async () => {
    if (!msid) return;
    await navigator.clipboard.writeText(msid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateDeliveryAddress = (
    field: keyof DeliveryAddress,
    value: string
  ) => {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
    setAddressMessage(null);
  };

  const handleSaveDeliveryAddress = () => {
    const normalized = normalizeDeliveryAddress(deliveryAddress);
    if (!hasCompleteDeliveryAddress(normalized)) {
      setAddressMessage("Please complete the required address fields first.");
      return;
    }
    saveDeliveryAddress(addressStorageKey, normalized);
    setDeliveryAddress(normalized);
    setAddressMessage("Default delivery address saved for supply requests.");
  };

  const handleRevealNhi = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setNhiState({ status: "loading" });

    configureCognito();
    const token = await getIdToken();
    if (!token) {
      setNhiState({ status: "error", message: "Session expired. Please log in again." });
      return;
    }

    const res = await fetch("/api/patient/nhi-reveal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      setNhiState({ status: "error", message: "Maximum reveals reached. Try again in an hour." });
      return;
    }
    if (res.status === 404) {
      setNhiState({ status: "error", message: "NHI is not available here yet. Please contact Midland Sleep if you need help with your NHI." });
      return;
    }
    if (!res.ok) {
      setNhiState({ status: "error", message: "Something went wrong. Please try again." });
      return;
    }

    const { nhi } = await res.json() as { nhi: string };
    setNhiState({ status: "revealed", nhi, secondsLeft: 30 });

    countdownRef.current = setInterval(() => {
      setNhiState((prev) => {
        if (prev.status !== "revealed") return prev;
        if (prev.secondsLeft <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return { status: "hidden" };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
  };

  return (
    <>
      <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-semibold text-navy mb-2">
        My profile
      </h1>
      <p className="text-base leading-6 text-charcoal/80 mb-3">
        Your account details and Midland Sleep ID.
      </p>

      <div className="space-y-3">

        {/* Row 1: Your details + Portal ID side by side on desktop */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">

          {/* SECTION 1 — Your Details */}
          <section className="bg-white border border-sand rounded-2xl p-4 md:p-5 space-y-3">
            <div className="bg-seafoam-pale border border-seafoam/30 rounded-md px-3 py-2.5">
              <p className="text-sm leading-5 text-charcoal/85">
                Your information is handled in accordance with the Health Information Privacy Code 2020.
              </p>
            </div>

            <h2 className="font-display text-xl font-semibold text-navy leading-snug">Your details</h2>

            {profile && (
              <div className="flex items-center gap-3 rounded-xl border border-sand bg-sand-pale/60 px-4 py-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-deep-teal flex items-center justify-center text-white text-sm font-bold select-none" aria-hidden="true">
                  {profile.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(w => w.charAt(0))
                    .join("")
                    .toUpperCase() || "P"}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-charcoal leading-snug truncate">{profile.name}</p>
                  <p className="font-mono text-xs text-charcoal/60 truncate">{profile.msid}</p>
                </div>
              </div>
            )}

            {profileLoading ? (
              <p className="text-base leading-6 text-charcoal/80">Loading...</p>
            ) : profile ? (
              <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2 text-base leading-6">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Full name
                  </dt>
                  <dd className="font-medium text-charcoal">{profile.name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Email
                  </dt>
                  <dd className="text-charcoal break-words">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Midland Sleep ID
                  </dt>
                  <dd className="font-mono text-charcoal break-all">{profile.msid}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-base leading-6 text-charcoal/80">
                Unable to load your details. Please try again later.
              </p>
            )}
          </section>

          {/* SECTION 2 — Portal ID Card */}
          <section className="bg-navy rounded-2xl p-4 md:p-5 space-y-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-cream leading-snug">Portal ID card</h2>
              <p className="text-sm leading-5 text-cream/80 mt-1">
                Use this ID when contacting Midland Sleep.
              </p>
            </div>

            <div className="bg-deep-teal/40 rounded-md px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-seafoam font-mono mb-1.5">
                Your Midland Sleep ID
              </p>
              <p className="font-mono text-2xl text-cream tracking-widest break-all">
                {msid || "—"}
              </p>
            </div>

            <button
              onClick={handleCopy}
              disabled={!msid}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-colors disabled:cursor-not-allowed min-h-[44px]",
                copied
                  ? "bg-seafoam text-navy"
                  : "bg-cream/10 text-cream hover:bg-cream/20 border border-cream/20"
              )}
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </section>
        </div>

        {/* Row 2: NHI + Notification preferences side by side on desktop */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">

          {/* SECTION 3 — NHI Number */}
          <section className="bg-white border border-sand rounded-2xl p-4 md:p-5 space-y-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy leading-snug">NHI number</h2>
              <p className="text-base leading-6 text-charcoal/80 mt-0.5">
                Your National Health Index number.
              </p>
            </div>

            <div className="bg-sand-pale rounded-md px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                NHI
              </p>
              <p className="text-xl font-mono text-charcoal font-medium tracking-widest break-all">
                {nhiState.status === "revealed" ? nhiState.nhi : "Hidden"}
              </p>
            </div>

            {nhiState.status === "revealed" && (
              <p className="text-sm font-medium text-amber">
                Hiding in {nhiState.secondsLeft}s
              </p>
            )}

            {nhiState.status === "error" && (
              <p className="text-sm leading-5 text-amber">{nhiState.message}</p>
            )}

            {nhiState.status !== "revealed" && (
              <button
                onClick={handleRevealNhi}
                disabled={nhiState.status === "loading"}
                className="bg-[#0B5C6C] text-white px-6 py-2.5 rounded-lg text-base font-medium
                           min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nhiState.status === "loading" ? "Revealing..." : "Reveal NHI"}
              </button>
            )}

            <p className="text-sm leading-5 text-charcoal/80">
              Your NHI is protected. Revealing it is logged for security.
            </p>
          </section>

          {/* SECTION 5 — Notification Preferences */}
          <section className="bg-white border border-sand rounded-2xl p-4 md:p-5 space-y-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy leading-snug">Notification preferences</h2>
              <p className="text-base leading-6 text-charcoal/80 mt-0.5">
                Notification settings are not available yet.
              </p>
            </div>

            <div>
              {[
                { label: "Email notifications", detail: "General portal messages" },
                { label: "SMS notifications", detail: "Urgent clinic updates" },
              ].map(({ label, detail }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 py-3 border-b border-sand last:border-0"
                >
                  <div>
                    <p className="text-base leading-6 font-medium text-charcoal/80">{label}</p>
                    <p className="text-sm leading-5 text-charcoal/70">{detail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-charcoal/70 font-mono whitespace-nowrap">Coming soon</span>
                    <div className="w-10 h-6 rounded-full bg-gray-200 border border-gray-300 flex items-center px-1 cursor-not-allowed">
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* SECTION 4 — Default Delivery Address, full width */}
        <section id="delivery-address" className="bg-white border border-sand rounded-2xl p-4 md:p-5 space-y-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy leading-snug">Default delivery address</h2>
            <p className="text-base leading-6 text-charcoal/80 mt-0.5">
              Used for supply requests unless you choose a different delivery
              address for a specific request.
            </p>
          </div>

          {hasCompleteDeliveryAddress(deliveryAddress) && (
            <div className="rounded-xl border border-deep-teal/20 bg-seafoam-pale/30 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-mono text-xs uppercase tracking-wide text-charcoal/60">
                  Saved address
                </p>
                <span className="shrink-0 rounded-full border border-deep-teal/20 bg-white px-2.5 py-0.5 text-xs font-medium text-deep-teal">
                  Default
                </span>
              </div>
              <div className="space-y-0.5 text-base leading-6 text-charcoal font-medium">
                {formatDeliveryAddress(deliveryAddress).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-charcoal">
                Address line 1
              </span>
              <input
                value={deliveryAddress.line1}
                onChange={(event) => updateDeliveryAddress("line1", event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                placeholder="Street address"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-charcoal">
                Address line 2{" "}
                <span className="font-normal text-charcoal/60">(optional)</span>
              </span>
              <input
                value={deliveryAddress.line2}
                onChange={(event) => updateDeliveryAddress("line2", event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                placeholder="Apartment, unit, or care of"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-charcoal">City</span>
              <input
                value={deliveryAddress.city}
                onChange={(event) => updateDeliveryAddress("city", event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                placeholder="Hamilton"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-charcoal">Region</span>
              <input
                value={deliveryAddress.region}
                onChange={(event) => updateDeliveryAddress("region", event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                placeholder="Waikato"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-charcoal">Postcode</span>
              <input
                value={deliveryAddress.postcode}
                onChange={(event) => updateDeliveryAddress("postcode", event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                inputMode="numeric"
                placeholder="3204"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-charcoal">Country</span>
              <input
                value={deliveryAddress.country}
                onChange={(event) => updateDeliveryAddress("country", event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                placeholder="New Zealand"
              />
            </label>
          </div>

          {addressMessage && (
            <p className="text-sm leading-5 text-charcoal/80">{addressMessage}</p>
          )}

          <button
            onClick={handleSaveDeliveryAddress}
            className="bg-[#0B5C6C] text-white px-6 py-2.5 rounded-lg text-base font-medium
                       min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
          >
            Save default delivery address
          </button>
        </section>

      </div>
    </>
  );
}
