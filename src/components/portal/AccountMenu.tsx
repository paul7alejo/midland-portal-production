"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountMenu() {
  const { patient, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (!patient) return null;

  const initials = (patient.name ?? "Patient")
    .split(" ")
    .map((n: string) => n[0])
    .join("");

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sand/30 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="min-w-0 text-right hidden sm:block">
          <p className="text-sm font-semibold text-charcoal leading-tight truncate max-w-[160px]">
            {patient.name}
          </p>
          <p className="text-xs text-charcoal/50 font-mono truncate max-w-[160px]">
            {patient.msid}
          </p>
        </div>
        <div className="h-9 w-9 rounded-full bg-deep-teal flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-deep-teal/20">
          {initials}
        </div>
        <svg
          className={`h-3.5 w-3.5 text-charcoal/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-sand bg-white shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-sand bg-sand-pale/60">
            <p className="text-sm font-semibold text-charcoal truncate">{patient.name}</p>
            <p className="text-xs text-charcoal/50 font-mono truncate">{patient.msid}</p>
          </div>
          <div className="py-1">
            <Link
              href="/portal/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-sand-pale transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 text-charcoal/45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My profile
            </Link>
            <Link
              href="/portal/profile#delivery-address"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-sand-pale transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 text-charcoal/45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery address
            </Link>
            <div className="border-t border-sand my-1" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-charcoal/70 hover:bg-sand-pale hover:text-charcoal transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 text-charcoal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
