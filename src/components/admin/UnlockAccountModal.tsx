"use client";

import { useState } from "react";
import type { PortalAccount } from "@/components/admin/PortalAccountsTable";

type ModalState = "confirm" | "loading" | "success" | "error";

export function UnlockAccountModal({
  account,
  onClose,
  onSuccess,
}: {
  account: PortalAccount;
  onClose: () => void;
  onSuccess: (msid: string) => void;
}) {
  const [state, setState]       = useState<ModalState>("confirm");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    setState("loading");
    try {
      const res = await fetch("/api/admin/portal-accounts/unlock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msid: account.msid }),
      });
      const data: unknown = await res.json();
      const payload = data as Record<string, unknown>;
      if (!res.ok) {
        setErrorMsg(typeof payload.error === "string" ? payload.error : "Unlock failed.");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  function handleDone() {
    onSuccess(account.msid);
    onClose();
  }

  const canClose = state !== "loading";
  const closeAction = state === "success" ? handleDone : onClose;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={canClose ? closeAction : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-label="Unlock account"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-navy">Unlock account</h2>
            <p className="text-sm text-charcoal/65 mt-0.5">
              {account.name}&nbsp;·&nbsp;<span className="font-mono">{account.msid}</span>
            </p>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={closeAction}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {state === "confirm" && (
            <>
              <ul className="space-y-3">
                {[
                  "Account access will be restored immediately.",
                  "The patient's existing password is unchanged.",
                  "This action will be logged in the audit trail.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-charcoal/80">
                    <span className="mt-0.5 shrink-0 text-[#0B5C6C] font-bold">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-charcoal/70 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="text-sm font-medium bg-[#0B5C6C] text-white px-5 py-2.5 rounded-lg hover:bg-[#0B5C6C]/90 transition-colors"
                >
                  Confirm Unlock
                </button>
              </div>
            </>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <svg className="h-7 w-7 text-[#0B5C6C] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-charcoal/65">Unlocking account…</p>
            </div>
          )}

          {state === "success" && (
            <>
              <div className="bg-[#74C0A2]/15 border border-[#74C0A2]/40 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-[#0B5C6C]">Account unlocked successfully.</p>
                <p className="text-sm text-charcoal/70">
                  {account.name} can now log in with their existing credentials.
                </p>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleDone}
                  className="text-sm font-medium bg-[#0B5C6C] text-white px-5 py-2.5 rounded-lg hover:bg-[#0B5C6C]/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-red-800">Unlock failed</p>
                <p className="text-sm text-red-700">
                  {errorMsg ?? "An unexpected error occurred. Please try again."}
                </p>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-charcoal/70 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
