"use client";

import { useMemo, useState } from "react";

export type PortalAccount = {
  id: string;
  name: string;
  msid: string;
  nhiMasked: string;
  createdAt: string;
  passwordStatus: "changed" | "temp";
  twoFa: boolean;
  accountStatus: "active" | "locked";
};

export const MOCK_ACCOUNTS: PortalAccount[] = [
  { id: "1",  name: "Generated Final Guard Patient", msid: "MS-525374", nhiMasked: "ZZZ****", createdAt: "2025-12-01", passwordStatus: "temp",    twoFa: false, accountStatus: "locked" },
  { id: "2",  name: "Sarah Chen",        msid: "MS-10052", nhiMasked: "GHT****", createdAt: "2025-12-03", passwordStatus: "temp",    twoFa: false, accountStatus: "active" },
  { id: "3",  name: "Michael Torres",    msid: "MS-10061", nhiMasked: "KRP****", createdAt: "2025-12-08", passwordStatus: "changed", twoFa: false, accountStatus: "locked" },
  { id: "4",  name: "Emily Watson",      msid: "MS-10074", nhiMasked: "LQF****", createdAt: "2026-01-05", passwordStatus: "temp",    twoFa: false, accountStatus: "active" },
  { id: "5",  name: "Robert Kim",        msid: "MS-10089", nhiMasked: "NBM****", createdAt: "2026-01-11", passwordStatus: "changed", twoFa: true,  accountStatus: "active" },
  { id: "6",  name: "Linda Park",        msid: "MS-10092", nhiMasked: "PCS****", createdAt: "2026-01-19", passwordStatus: "changed", twoFa: true,  accountStatus: "active" },
  { id: "7",  name: "David Nguyen",      msid: "MS-10103", nhiMasked: "RDJ****", createdAt: "2026-02-02", passwordStatus: "temp",    twoFa: false, accountStatus: "locked" },
  { id: "8",  name: "Anne Fischer",      msid: "MS-10115", nhiMasked: "TGK****", createdAt: "2026-02-14", passwordStatus: "changed", twoFa: true,  accountStatus: "active" },
  { id: "9",  name: "Tom Bradley",       msid: "MS-10121", nhiMasked: "VHL****", createdAt: "2026-03-01", passwordStatus: "temp",    twoFa: false, accountStatus: "active" },
  { id: "10", name: "Nina Patel",        msid: "MS-10134", nhiMasked: "XJN****", createdAt: "2026-03-15", passwordStatus: "changed", twoFa: false, accountStatus: "active" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

function parseCreatedDate(iso: string): number | null {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

function displayPortalId(msid: string): string {
  return msid.startsWith("MS-") ? msid.slice(3) : msid;
}

export function PortalAccountsTable({
  accounts,
  onResetPassword,
  onUnlockAccount,
}: {
  accounts: PortalAccount[];
  onResetPassword: (account: PortalAccount) => void;
  onUnlockAccount: (account: PortalAccount) => void;
}) {
  const [createdSort, setCreatedSort] = useState<"newest" | "oldest">("newest");

  const sortedAccounts = useMemo(() => {
    return accounts
      .map((account, index) => ({ account, index, createdTime: parseCreatedDate(account.createdAt) }))
      .sort((a, b) => {
        const aValid = a.createdTime !== null;
        const bValid = b.createdTime !== null;
        if (aValid && bValid) {
          const aTime = a.createdTime as number;
          const bTime = b.createdTime as number;
          const diff = createdSort === "newest"
            ? bTime - aTime
            : aTime - bTime;
          return diff || a.index - b.index;
        }
        if (aValid) return -1;
        if (bValid) return 1;
        return a.index - b.index;
      })
      .map(({ account }) => account);
  }, [accounts, createdSort]);

  if (accounts.length === 0) {
    return (
      <div className="bg-white border border-sand rounded-xl px-6 py-12 text-center shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
        <p className="text-sm text-charcoal/60">No accounts match your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-sand rounded-xl overflow-hidden shadow-[0_18px_50px_rgba(11,42,60,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="bg-sand-pale/70 border-b border-sand">
              <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap">MSID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap">NHI</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setCreatedSort((current) => current === "newest" ? "oldest" : "newest")}
                  className="inline-flex items-center gap-1.5 hover:text-[#0B5C6C] transition-colors"
                  aria-label={`Sort created date ${createdSort === "newest" ? "oldest first" : "newest first"}`}
                >
                  Created
                  <span className="text-[10px] text-charcoal/45">{createdSort === "newest" ? "↓" : "↑"}</span>
                </button>
              </th>
              {["Password Status", "2FA", "Account Status", "Actions"].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-charcoal/70 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/70">
            {sortedAccounts.map((acct) => (
              <tr key={acct.id} className="hover:bg-sand-pale/45 transition-colors">
                <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">{acct.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-charcoal/80">{displayPortalId(acct.msid)}</td>
                <td className="px-4 py-3 font-mono text-xs text-charcoal/60 select-none">{acct.nhiMasked}</td>
                <td className="px-4 py-3 text-xs text-charcoal/70 whitespace-nowrap">{formatDate(acct.createdAt)}</td>
                <td className="px-4 py-3">
                  {acct.passwordStatus === "changed" ? (
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35">
                      Changed
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Temp
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {acct.twoFa ? (
                    <span className="text-xs font-semibold text-[#0B5C6C]">Enabled</span>
                  ) : (
                    <span className="text-xs text-charcoal/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {acct.accountStatus === "locked" ? (
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                      Locked
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#74C0A2]/20 text-[#0B5C6C] border border-[#74C0A2]/35">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onResetPassword(acct)}
                      className="text-xs font-medium text-[#0B5C6C] border border-[#0B5C6C]/40 rounded-md px-3 py-1.5 hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
                    >
                      Reset Password
                    </button>
                    {acct.accountStatus === "locked" && (
                      <button
                        type="button"
                        onClick={() => onUnlockAccount(acct)}
                        className="text-xs font-medium text-red-700 border border-red-300 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
