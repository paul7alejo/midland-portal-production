"use client";

import { useState } from "react";
import type { PortalAccount } from "@/components/admin/PortalAccountsTable";

type ModalState = "confirm" | "loading" | "success" | "error";

export function ResetPasswordModal({
  account,
  onClose,
}: {
  account: PortalAccount;
  onClose: () => void;
}) {
  const [state, setState]           = useState<ModalState>("confirm");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);

  async function handleConfirm() {
    setState("loading");
    try {
      const res = await fetch("/api/admin/portal-accounts/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msid: account.msid, nhiMasked: account.nhiMasked }),
      });
      const data: unknown = await res.json();
      const payload = data as Record<string, unknown>;
      if (!res.ok) {
        setErrorMsg(typeof payload.error === "string" ? payload.error : "Password reset failed.");
        setState("error");
        return;
      }
      if (typeof payload.temporaryPassword !== "string") {
        setErrorMsg("Unexpected response from server.");
        setState("error");
        return;
      }
      setTempPassword(payload.temporaryPassword);
      setState("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  function handleCopy() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const canClose = state !== "loading";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={canClose ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-label="Reset temporary password"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-navy">Reset temporary password</h2>
            <p className="text-sm text-charcoal/65 mt-0.5">
              {account.name}&nbsp;·&nbsp;<span className="font-mono">{account.msid}</span>
            </p>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
                <p className="text-sm font-semibold text-amber-900">This will reset the patient's login password.</p>
                <p className="text-sm text-amber-800">
                  A new temporary password will be generated. The patient must change it on their next login.
                </p>
              </div>
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
                  Confirm Reset
                </button>
              </div>
            </>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <svg
                className="h-7 w-7 text-[#0B5C6C] animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm text-charcoal/65">Resetting password…</p>
            </div>
          )}

          {state === "success" && tempPassword && (
            <>
              <div className="bg-amber-50 border border-amber-300 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-200 space-y-0.5">
                  <p className="text-xs font-semibold text-amber-900">New temporary password</p>
                  <p className="text-xs text-amber-700">
                    Not stored. This is your only opportunity to copy it.
                  </p>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="font-mono font-semibold text-amber-900 text-sm select-all break-all">
                    {tempPassword}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 text-xs font-semibold text-amber-800 border border-amber-300 rounded-md px-2.5 py-1 hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-charcoal/60">
                Patient logs in with their number-only username (no MS- prefix). Password must be changed on first login.
              </p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
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
                <p className="text-sm font-semibold text-red-800">Password reset failed</p>
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
