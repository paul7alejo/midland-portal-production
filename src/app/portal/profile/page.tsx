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
      setNhiState({ status: "error", message: "NHI not available in this demo. In production, your encrypted NHI will appear here." });
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
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        My profile
      </h1>
      <p className="text-sm text-charcoal/70 mb-6">
        Your account details and preferences.
      </p>

      <div className="space-y-6">

        {/* SECTION 1 — Your Details */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <div className="bg-seafoam-pale border border-seafoam/30 rounded-md px-4 py-3">
            <p className="text-xs text-charcoal/80">
              Your information is handled in accordance with the Health Information Privacy Code 2020.
            </p>
          </div>

          <h2 className="font-display text-xl text-navy">Your details</h2>

          {profileLoading ? (
            <p className="text-sm text-charcoal/60">Loading...</p>
          ) : profile ? (
            <dl className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Full name
                </dt>
                <dd className="font-medium text-charcoal">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Email
                </dt>
                <dd className="text-charcoal">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Midland Sleep ID
                </dt>
                <dd className="font-mono text-charcoal">{profile.msid}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-charcoal/60">
              Unable to load your details. Please try again later.
            </p>
          )}
        </section>

        {/* SECTION 2 — Portal ID Card */}
        <section className="bg-navy rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl text-cream">Portal ID card</h2>
            <p className="text-sm text-cream/60 mt-1">
              Use this ID when contacting Midland Sleep.
            </p>
          </div>

          <div className="bg-deep-teal/40 rounded-md px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-seafoam font-mono mb-2">
              Your Midland Sleep ID
            </p>
            <p className="font-mono text-3xl text-cream tracking-widest">
              {msid || "—"}
            </p>
          </div>

          <button
            onClick={handleCopy}
            disabled={!msid}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed",
              copied
                ? "bg-seafoam text-navy"
                : "bg-cream/10 text-cream hover:bg-cream/20 border border-cream/20"
            )}
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </section>

        {/* SECTION 3 — NHI Number */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl text-navy">NHI number</h2>
            <p className="text-sm text-charcoal/70 mt-1">
              Your National Health Index number.
            </p>
          </div>

          <div className="bg-sand-pale rounded-md px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
              NHI
            </p>
            <p className="text-2xl font-mono text-charcoal font-medium tracking-widest">
              {nhiState.status === "revealed" ? nhiState.nhi : "ZZZ****"}
            </p>
          </div>

          {nhiState.status === "revealed" && (
            <p className="text-sm font-medium text-amber">
              Hiding in {nhiState.secondsLeft}s
            </p>
          )}

          {nhiState.status === "error" && (
            <p className="text-sm text-amber">{nhiState.message}</p>
          )}

          {nhiState.status !== "revealed" && (
            <button
              onClick={handleRevealNhi}
              disabled={nhiState.status === "loading"}
              className="bg-deep-teal text-white px-5 py-2 rounded-full text-sm font-medium
                         hover:bg-deep-teal/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nhiState.status === "loading" ? "Revealing..." : "Reveal NHI"}
            </button>
          )}

          <p className="text-xs text-charcoal/60">
            Your NHI is encrypted. Access is logged for security.
          </p>
        </section>

        {/* SECTION 4 — Notification Preferences */}
        <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl text-navy">Notification preferences</h2>
            <p className="text-sm text-charcoal/70 mt-1">
              Manage how Midland Sleep contacts you.
            </p>
          </div>

          <div>
            {[
              { label: "Email notifications", detail: "Supply requests and appointment reminders" },
              { label: "SMS notifications", detail: "Urgent updates and delivery notifications" },
            ].map(({ label, detail }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 border-b border-sand last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-charcoal/40">{label}</p>
                  <p className="text-xs text-charcoal/30">{detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-charcoal/40 font-mono">Coming soon</span>
                  <div className="w-10 h-6 rounded-full bg-seafoam/40 flex items-center px-1 cursor-not-allowed">
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm translate-x-4" />
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
