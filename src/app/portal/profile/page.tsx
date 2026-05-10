"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";

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

  return (
    <>
      <h1 className="font-display text-[34px] md:text-[38px] leading-tight font-semibold text-navy mb-2">
        My profile
      </h1>
      <p className="text-lg leading-7 text-charcoal/80 mb-7">
        Your account details and Midland Sleep ID.
      </p>

      <div className="space-y-7">

        {/* SECTION 1 — Your Details */}
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <div className="bg-seafoam-pale border border-seafoam/30 rounded-md px-4 py-4">
            <p className="text-base leading-6 text-charcoal/85">
              Your information is handled in accordance with the Health Information Privacy Code 2020.
            </p>
          </div>

          <h2 className="font-display text-2xl font-semibold text-navy leading-snug">Your details</h2>

          {profileLoading ? (
            <p className="text-lg leading-7 text-charcoal/80">Loading...</p>
          ) : profile ? (
            <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2 text-lg leading-7">
              <div>
                <dt className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
                  Full name
                </dt>
                <dd className="font-medium text-charcoal">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
                  Email
                </dt>
                <dd className="text-charcoal break-words">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
                  Midland Sleep ID
                </dt>
                <dd className="font-mono text-charcoal break-all">{profile.msid}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-lg leading-7 text-charcoal/80">
              Unable to load your details. Please try again later.
            </p>
          )}
        </section>

        {/* SECTION 2 — Portal ID Card */}
        <section className="bg-navy rounded-2xl p-6 md:p-7 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-cream leading-snug">Portal ID card</h2>
            <p className="text-base leading-6 text-cream/80 mt-1">
              Use this ID when contacting Midland Sleep.
            </p>
          </div>

          <div className="bg-deep-teal/40 rounded-md px-5 py-4">
            <p className="text-sm uppercase tracking-wide text-seafoam font-mono mb-2">
              Your Midland Sleep ID
            </p>
            <p className="font-mono text-3xl text-cream tracking-widest break-all">
              {msid || "—"}
            </p>
          </div>

          <button
            onClick={handleCopy}
            disabled={!msid}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-base font-medium transition-colors disabled:cursor-not-allowed min-h-[48px]",
              copied
                ? "bg-seafoam text-navy"
                : "bg-cream/10 text-cream hover:bg-cream/20 border border-cream/20"
            )}
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </section>

        {/* SECTION 3 — NHI Number */}
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy leading-snug">NHI number</h2>
            <p className="text-lg leading-7 text-charcoal/80 mt-1">
              Your National Health Index number.
            </p>
          </div>

          <div className="bg-sand-pale rounded-md px-4 py-4">
            <p className="text-sm uppercase tracking-wide text-charcoal/80 font-mono mb-1.5">
              NHI
            </p>
            <p className="text-2xl font-mono text-charcoal font-medium tracking-widest break-all">
              {nhiState.status === "revealed" ? nhiState.nhi : "Hidden"}
            </p>
          </div>

          {nhiState.status === "revealed" && (
            <p className="text-base font-medium text-amber">
              Hiding in {nhiState.secondsLeft}s
            </p>
          )}

          {nhiState.status === "error" && (
            <p className="text-base leading-6 text-amber">{nhiState.message}</p>
          )}

          {nhiState.status !== "revealed" && (
            <button
              onClick={handleRevealNhi}
              disabled={nhiState.status === "loading"}
              className="bg-[#0B5C6C] text-white px-7 py-3.5 rounded-lg text-lg font-medium
                         min-h-[52px] hover:bg-[#0B5C6C]/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nhiState.status === "loading" ? "Revealing..." : "Reveal NHI"}
            </button>
          )}

          <p className="text-base leading-6 text-charcoal/80">
            Your NHI is protected. Revealing it is logged for security.
          </p>
        </section>

        {/* SECTION 4 — Notification Preferences */}
        <section className="bg-white border border-sand rounded-2xl p-6 md:p-7 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy leading-snug">Notification preferences</h2>
            <p className="text-lg leading-7 text-charcoal/80 mt-1">
              Notification settings are not available yet.
            </p>
          </div>

          <div>
            {[
              { label: "Email notifications", detail: "Supply requests and appointment reminders" },
              { label: "SMS notifications", detail: "Urgent updates and delivery notifications" },
            ].map(({ label, detail }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-4 border-b border-sand last:border-0"
              >
                <div>
                  <p className="text-lg leading-7 font-medium text-charcoal/80">{label}</p>
                  <p className="text-base leading-6 text-charcoal/70">{detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-charcoal/70 font-mono whitespace-nowrap">Coming soon</span>
                  <div className="w-10 h-6 rounded-full bg-gray-200 border border-gray-300 flex items-center px-1 cursor-not-allowed">
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}
