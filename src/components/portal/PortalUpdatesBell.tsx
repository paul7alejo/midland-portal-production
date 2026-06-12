"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";

interface PatientPortalUpdate {
  notification_id: string;
  request_reference?: string;
  title: string;
  message: string;
  created_at: string;
}

function formatUpdateDateTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PortalUpdatesBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<PatientPortalUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasUpdates = updates.length > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadUpdates() {
      setLoading(true);
      try {
        configureCognito();
        const token = await getIdToken();
        if (!token) throw new Error("Session expired.");

        const res = await fetch("/api/patient/data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({})) as {
          updates?: PatientPortalUpdate[];
        };
        if (!cancelled && res.ok) {
          setUpdates(Array.isArray(data.updates) ? data.updates.slice(0, 3) : []);
        }
      } catch {
        if (!cancelled) setUpdates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadUpdates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={popoverRef} className={cn("relative z-[100]", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-charcoal/70 shadow-sm transition-colors hover:bg-sand-pale focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
        aria-label="Request updates"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.25 2.25 0 01-5.714 0m9.607-3.474A7.475 7.475 0 0017.25 9V7.5a5.25 5.25 0 00-10.5 0V9a7.475 7.475 0 00-1.5 4.608l-.36 2.16A1.5 1.5 0 006.37 17.5h11.26a1.5 1.5 0 001.48-1.732l-.36-2.16z" />
        </svg>
        {hasUpdates && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0B5C6C]" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[110] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-sand bg-white shadow-xl">
          <div className="border-b border-sand bg-sand-pale/60 px-4 py-3">
            <p className="text-sm font-semibold text-charcoal">Request updates</p>
            <p className="mt-0.5 text-xs leading-5 text-charcoal/60">
              Updates from Midland Sleep staff will appear here.
            </p>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-4 text-sm leading-6 text-charcoal/60">Checking for updates...</p>
            ) : hasUpdates ? (
              <div className="divide-y divide-sand/70">
                {updates.map((update) => (
                  <article key={update.notification_id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold leading-6 text-[#0B2A3C]">{update.title}</h3>
                      <time className="shrink-0 text-xs leading-6 text-charcoal/45" dateTime={update.created_at}>
                        {formatUpdateDateTime(update.created_at)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-charcoal/70">{update.message}</p>
                    {update.request_reference && (
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-charcoal/45">
                        Request {update.request_reference}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="px-4 py-4 text-sm leading-6 text-charcoal/60">
                No updates yet. Request updates will appear here after staff review.
              </p>
            )}
          </div>

          <div className="border-t border-sand bg-white px-4 py-3">
            <Link
              href="/portal/dashboard#portal-updates"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-[#0B5C6C] hover:underline"
            >
              View all updates
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
