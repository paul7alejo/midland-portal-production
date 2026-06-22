"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";

interface AddressStructured {
  line1?: string;
  line2?: string;
  suburb?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

interface ProfileData {
  name: string;
  email: string;
  msid: string;
  org_id: string;
  date_of_birth?: string | null;
  phone?: string | null;
  address_structured?: AddressStructured | null;
}

type NhiState =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "revealed"; nhi: string; secondsLeft: number }
  | { status: "error"; message: string };

type AddressRequestState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string | null }
  | { status: "error"; message: string };

const NOT_ON_FILE = "Not on file";

function formatNzDate(value?: string | null): string {
  if (!value?.trim()) return NOT_ON_FILE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  }).format(date);
}

function calculateAge(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const birthdayPassed =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!birthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

function hasAddressOnFile(address?: AddressStructured | null): boolean {
  if (!address) return false;
  return Boolean(
    address.line1?.trim() && address.city?.trim() && address.postal_code?.trim() && address.country?.trim()
  );
}

function formatAddressLines(address?: AddressStructured | null): string[] {
  if (!address) return [];
  const line1 = address.line1?.trim();
  const line2Parts = [address.line2, address.suburb]
    .map((part) => part?.trim())
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index);
  const cityRegionPostcode = [address.city, address.region, address.postal_code]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const country = address.country?.trim();
  return [line1, line2Parts.join(", "), cityRegionPostcode, country].filter(
    (line): line is string => Boolean(line)
  );
}

interface AddressFormState {
  line1: string;
  line2: string;
  suburb: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  note: string;
}

function addressToForm(address?: AddressStructured | null): AddressFormState {
  return {
    line1:       address?.line1 ?? "",
    line2:       address?.line2 ?? "",
    suburb:      address?.suburb ?? "",
    city:        address?.city ?? "",
    region:      address?.region ?? "",
    postal_code: address?.postal_code ?? "",
    country:     address?.country?.trim() || "New Zealand",
    note:        "",
  };
}

function AddressChangeModal({
  currentAddress,
  onClose,
  onSubmit,
}: {
  currentAddress?: AddressStructured | null;
  onClose: () => void;
  onSubmit: (form: AddressFormState) => Promise<{ ok: boolean; reference?: string | null; error?: string }>;
}) {
  const [form, setForm] = useState<AddressFormState>(() => addressToForm(currentAddress));
  const [state, setState] = useState<AddressRequestState>({ status: "idle" });

  const update = (field: keyof AddressFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit =
    form.line1.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.postal_code.trim().length > 0 &&
    form.country.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || state.status === "submitting") return;
    setState({ status: "submitting" });
    const result = await onSubmit(form);
    if (result.ok) {
      setState({ status: "success", reference: result.reference ?? null });
    } else {
      setState({ status: "error", message: result.error ?? "Unable to submit your request. Please try again." });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Request address change"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[calc(100dvh_-_3rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-sand px-5 py-4 sm:px-6">
          <h2 className="font-display text-xl font-semibold leading-snug text-navy">
            Request address change
          </h2>
          {state.status !== "success" && (
            <p className="mt-1 text-sm leading-5 text-charcoal/75">
              Submit the corrected delivery address below. Midland Sleep staff will review this before it is used for future deliveries.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {state.status === "success" ? (
            <div className="space-y-3 py-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-seafoam-pale flex items-center justify-center">
                <span className="text-seafoam text-xl">&#10003;</span>
              </div>
              <p className="text-lg font-semibold text-charcoal">Request submitted</p>
              <p className="text-base leading-6 text-charcoal/80">
                Midland Sleep staff will review your requested address before it is used for future deliveries.
              </p>
              {state.reference && (
                <p className="font-mono text-sm text-charcoal/60">Reference: {state.reference}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-charcoal">Address line 1</span>
                <input
                  value={form.line1}
                  onChange={(e) => update("line1", e.target.value)}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                  placeholder="Street address"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-charcoal">
                  Address line 2 <span className="font-normal text-charcoal/60">(optional)</span>
                </span>
                <input
                  value={form.line2}
                  onChange={(e) => update("line2", e.target.value)}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                  placeholder="Apartment, unit, or care of"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-charcoal">
                  Suburb <span className="font-normal text-charcoal/60">(optional)</span>
                </span>
                <input
                  value={form.suburb}
                  onChange={(e) => update("suburb", e.target.value)}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-charcoal">City/Town</span>
                  <input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                    placeholder="Hamilton"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-charcoal">
                    Region <span className="font-normal text-charcoal/60">(optional)</span>
                  </span>
                  <input
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                    placeholder="Waikato"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-charcoal">Postcode</span>
                  <input
                    value={form.postal_code}
                    onChange={(e) => update("postal_code", e.target.value)}
                    inputMode="numeric"
                    className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                    placeholder="3204"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-charcoal">Country</span>
                  <input
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                    placeholder="New Zealand"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-charcoal">
                  Reason / note <span className="font-normal text-charcoal/60">(optional)</span>
                </span>
                <textarea
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Let staff know what changed or why"
                  className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-charcoal placeholder:text-charcoal/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-deep-teal"
                />
              </label>

              {state.status === "error" && (
                <p role="alert" className="text-sm leading-5 text-[#C0392B] bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  {state.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-sand bg-sand-pale/30 px-5 py-3.5 sm:px-6">
          {state.status === "success" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[#0B5C6C] px-5 py-2.5 text-base font-medium text-white min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
            >
              Done
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || state.status === "submitting"}
                className="flex-1 rounded-lg bg-[#0B5C6C] px-5 py-2.5 text-base font-medium text-white min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.status === "submitting" ? "Submitting..." : "Submit change request"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-sand px-5 py-2.5 text-base font-medium text-charcoal min-h-[44px] hover:border-deep-teal/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { patient } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [nhiState, setNhiState] = useState<NhiState>({ status: "hidden" });
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      configureCognito();
      const token = await getIdToken();
      if (!token) { setProfileLoading(false); return; }
      const res = await fetch("/api/patient/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as ProfileData;
        setProfile(data);
      }
      setProfileLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const msid = profile?.msid ?? (patient as { msid?: string })?.msid ?? "";
  const age = calculateAge(profile?.date_of_birth);

  const handleCopy = async () => {
    if (!msid) return;
    await navigator.clipboard.writeText(msid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleSubmitAddressChange = async (
    form: AddressFormState
  ): Promise<{ ok: boolean; reference?: string | null; error?: string }> => {
    try {
      configureCognito();
      const token = await getIdToken();
      if (!token) return { ok: false, error: "Session expired. Please log in again." };

      const requestedAddress: AddressStructured = {
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        suburb: form.suburb.trim() || undefined,
        city: form.city.trim(),
        region: form.region.trim() || undefined,
        postal_code: form.postal_code.trim(),
        country: form.country.trim(),
      };

      const res = await fetch("/api/patient/reorder", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "address_change",
          requestedAddress,
          currentAddressSnapshot: profile?.address_structured ?? null,
          patientNote: form.note.trim() || undefined,
        }),
      });

      let data: { request?: { referenceNumber?: string }; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }

      if (!res.ok) {
        return { ok: false, error: data.error ?? "Unable to submit your request. Please try again." };
      }
      return { ok: true, reference: data.request?.referenceNumber ?? null };
    } catch {
      return { ok: false, error: "Unable to submit your request. Please try again." };
    }
  };

  const addressOnFile = hasAddressOnFile(profile?.address_structured);

  return (
    <>
      <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-semibold text-navy mb-2">
        My profile
      </h1>
      <p className="text-base leading-6 text-charcoal/80 mb-3">
        Review the details Midland Sleep has on record. If something needs correcting, let us know and staff will review it.
      </p>

      <div className="space-y-3">

        {/* Row 1: Your details + Portal ID side by side on desktop */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">

          {/* SECTION 1 — Your Details */}
          <section className="min-w-0 bg-white border border-sand rounded-2xl p-4 md:p-5 space-y-3">
            <div className="bg-seafoam-pale border border-seafoam/30 rounded-md px-3 py-2.5">
              <p className="text-sm leading-5 text-charcoal/85">
                Your information is handled in accordance with the Health Information Privacy Code 2020.
              </p>
            </div>

            <h2 className="font-display text-xl font-semibold text-navy leading-snug">Your details</h2>

            {profile && (
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-sand bg-sand-pale/60 px-4 py-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-deep-teal flex items-center justify-center text-white text-sm font-bold select-none" aria-hidden="true">
                  {profile.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(w => w.charAt(0))
                    .join("")
                    .toUpperCase() || "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="max-w-full truncate text-base font-semibold leading-snug text-charcoal">{profile.name}</p>
                  <p className="max-w-full truncate text-sm text-charcoal/60">Verify these details are correct</p>
                </div>
              </div>
            )}

            {profileLoading ? (
              <p className="text-base leading-6 text-charcoal/80">Loading...</p>
            ) : profile ? (
              <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2 text-base leading-6">
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Full name
                  </dt>
                  <dd className="break-words font-medium text-charcoal">{profile.name}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Midland Sleep ID
                  </dt>
                  <dd className="font-mono text-charcoal break-all">{profile.msid}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Date of birth
                  </dt>
                  <dd className="break-words text-charcoal">{formatNzDate(profile.date_of_birth)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Age
                  </dt>
                  <dd className="break-words text-charcoal">{age !== null ? `${age} years` : NOT_ON_FILE}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Email
                  </dt>
                  <dd className="break-all text-charcoal">{profile.email || NOT_ON_FILE}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-charcoal/80 font-mono mb-1">
                    Phone
                  </dt>
                  <dd className="break-words text-charcoal">{profile.phone?.trim() || NOT_ON_FILE}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-base leading-6 text-charcoal/80">
                Unable to load your details. Please try again later.
              </p>
            )}

            <p className="text-sm leading-5 text-charcoal/70">
              These details are managed by Midland Sleep staff. If anything is incorrect, please contact us.
            </p>
          </section>

          {/* SECTION 2 — Portal ID Card */}
          <section className="min-w-0 bg-navy rounded-2xl p-4 md:p-5 space-y-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-cream leading-snug">Portal ID card</h2>
              <p className="text-sm leading-5 text-cream/80 mt-1">
                Use this ID when contacting Midland Sleep.
              </p>
            </div>

            <div className="min-w-0 bg-deep-teal/40 rounded-md px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-seafoam font-mono mb-1.5">
                Your Midland Sleep ID
              </p>
              <p className="break-all font-mono text-xl text-cream tracking-widest sm:text-2xl">
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

        {/* SECTION 4 — Default Delivery Address (admin-controlled, read-only), full width */}
        <section id="delivery-address" className="bg-white border border-sand rounded-2xl p-4 md:p-5 space-y-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy leading-snug">Default delivery address</h2>
            <p className="text-base leading-6 text-charcoal/80 mt-0.5">
              This is the address Midland Sleep currently has on record for supply deliveries.
            </p>
          </div>

          {addressOnFile ? (
            <div className="rounded-xl border border-deep-teal/20 bg-seafoam-pale/30 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-mono text-xs uppercase tracking-wide text-charcoal/60">
                  On file with Midland Sleep
                </p>
                <span className="shrink-0 rounded-full border border-deep-teal/20 bg-white px-2.5 py-0.5 text-xs font-medium text-deep-teal">
                  Default
                </span>
              </div>
              <div className="space-y-0.5 text-base leading-6 text-charcoal font-medium">
                {formatAddressLines(profile?.address_structured).map((line, i) => (
                  <p key={`${line}-${i}`}>{line}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-sand bg-sand-pale/50 p-4">
              <p className="text-base leading-6 text-charcoal/75">
                No delivery address is currently on file.
              </p>
            </div>
          )}

          <button
            onClick={() => setAddressModalOpen(true)}
            className="bg-[#0B5C6C] text-white px-6 py-2.5 rounded-lg text-base font-medium
                       min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
          >
            Request address change
          </button>
        </section>

      </div>

      {addressModalOpen && (
        <AddressChangeModal
          currentAddress={profile?.address_structured}
          onClose={() => setAddressModalOpen(false)}
          onSubmit={handleSubmitAddressChange}
        />
      )}
    </>
  );
}
