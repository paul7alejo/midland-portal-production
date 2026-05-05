"use client";

import { useState, useMemo } from "react";
import { PatientDrawer } from "@/components/admin/PatientDrawer";

type FundingType   = "ACC" | "Private";
type PatientStatus = "eligible" | "not_eligible" | "overdue" | "needs_outreach" | "safety_check_due";
type SortColumn    = "lastOrder" | "nextEligible" | "remainingAmount";
type SortDir       = "asc" | "desc";

interface Patient {
  id: string;
  name: string;
  msid: string;
  phone: string;
  funding: FundingType;
  lastOrder: string;
  nextEligible: string;
  status: PatientStatus;
  annualAllowance: number;
  usedAmount: number;
  remainingAmount: number;
  fundingPeriodStart: string;
  fundingPeriodEnd: string;
  suggestedItemsRemaining: string[];
  fundingNote?: string;
}

const PATIENTS: Patient[] = [
  {
    id: "1",
    name: "Margaret Thompson",
    msid: "MS-238872",
    phone: "021 456 7890",
    funding: "ACC",
    lastOrder: "12 Nov 2025",
    nextEligible: "12 May 2026",
    status: "eligible",
    annualAllowance: 150,
    usedAmount: 70,
    remainingAmount: 80,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Filters"],
    fundingNote: "Patient has remaining allowance. Full mask kit may exceed balance.",
  },
  {
    id: "2",
    name: "Robert Wilson",
    msid: "MS-731204",
    phone: "027 321 9876",
    funding: "ACC",
    lastOrder: "3 Jan 2025",
    nextEligible: "3 Jul 2025",
    status: "needs_outreach",
    annualAllowance: 150,
    usedAmount: 150,
    remainingAmount: 0,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: [],
  },
  {
    id: "3",
    name: "Patricia Davies",
    msid: "MS-956431",
    phone: "022 987 6543",
    funding: "Private",
    lastOrder: "18 Mar 2025",
    nextEligible: "18 Sep 2025",
    status: "safety_check_due",
    annualAllowance: 200,
    usedAmount: 120,
    remainingAmount: 80,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Filters"],
  },
  {
    id: "4",
    name: "John Harding",
    msid: "MS-112358",
    phone: "021 654 3210",
    funding: "ACC",
    lastOrder: "7 Feb 2026",
    nextEligible: "7 Aug 2026",
    status: "not_eligible",
    annualAllowance: 150,
    usedAmount: 110,
    remainingAmount: 40,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Filters"],
    fundingNote: "Remaining balance is sufficient for filters only.",
  },
  {
    id: "5",
    name: "Shirley Bennett",
    msid: "MS-445566",
    phone: "027 111 2233",
    funding: "ACC",
    lastOrder: "15 Aug 2024",
    nextEligible: "15 Feb 2025",
    status: "overdue",
    annualAllowance: 150,
    usedAmount: 150,
    remainingAmount: 0,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: [],
  },
  {
    id: "6",
    name: "Brian Foster",
    msid: "MS-778899",
    phone: "021 778 4455",
    funding: "Private",
    lastOrder: "22 Oct 2025",
    nextEligible: "22 Apr 2026",
    status: "eligible",
    annualAllowance: 200,
    usedAmount: 90,
    remainingAmount: 110,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Headgear", "Filters"],
  },
  {
    id: "7",
    name: "Dorothy Mills",
    msid: "MS-334455",
    phone: "022 334 5566",
    funding: "ACC",
    lastOrder: "9 Apr 2025",
    nextEligible: "9 Oct 2025",
    status: "needs_outreach",
    annualAllowance: 150,
    usedAmount: 130,
    remainingAmount: 20,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Filters"],
    fundingNote: "Low balance — filters only.",
  },
  {
    id: "8",
    name: "Graham Sutton",
    msid: "MS-667788",
    phone: "027 667 8899",
    funding: "ACC",
    lastOrder: "14 Mar 2026",
    nextEligible: "14 Sep 2026",
    status: "not_eligible",
    annualAllowance: 150,
    usedAmount: 100,
    remainingAmount: 50,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion"],
  },
  {
    id: "9",
    name: "Evelyn Price",
    msid: "MS-990011",
    phone: "021 900 1122",
    funding: "ACC",
    lastOrder: "30 Jun 2025",
    nextEligible: "30 Dec 2025",
    status: "safety_check_due",
    annualAllowance: 150,
    usedAmount: 60,
    remainingAmount: 90,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Headgear", "Filters"],
  },
  {
    id: "10",
    name: "Colin Murray",
    msid: "MS-223344",
    phone: "022 223 3445",
    funding: "Private",
    lastOrder: "5 Dec 2025",
    nextEligible: "5 Jun 2026",
    status: "eligible",
    annualAllowance: 200,
    usedAmount: 80,
    remainingAmount: 120,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Headgear", "Filters"],
  },
  {
    id: "11",
    name: "Winifred Jones",
    msid: "MS-556677",
    phone: "027 556 6778",
    funding: "ACC",
    lastOrder: "20 Sep 2024",
    nextEligible: "20 Mar 2025",
    status: "overdue",
    annualAllowance: 150,
    usedAmount: 150,
    remainingAmount: 0,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: [],
  },
  {
    id: "12",
    name: "Arthur Campbell",
    msid: "MS-889900",
    phone: "021 889 9001",
    funding: "Private",
    lastOrder: "1 Apr 2026",
    nextEligible: "1 Oct 2026",
    status: "not_eligible",
    annualAllowance: 200,
    usedAmount: 170,
    remainingAmount: 30,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Filters"],
    fundingNote: "Low balance — filters only.",
  },
];

const STATUS_CONFIG: Record<PatientStatus, { label: string; classes: string }> = {
  eligible:         { label: "Eligible",          classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  not_eligible:     { label: "Not eligible",       classes: "bg-gray-100 text-gray-600 border border-gray-200" },
  overdue:          { label: "Overdue",            classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  needs_outreach:   { label: "Needs outreach",     classes: "bg-orange-100 text-orange-800 border border-orange-200" },
  safety_check_due: { label: "Safety check due",   classes: "bg-amber-100 text-amber-800 border border-amber-200" },
};

const ACTION_CONFIG: Record<PatientStatus, { label: string; disabled: boolean }> = {
  eligible:         { label: "Create order",   disabled: false },
  not_eligible:     { label: "Not eligible",   disabled: true  },
  overdue:          { label: "Start outreach", disabled: false },
  needs_outreach:   { label: "Call patient",   disabled: false },
  safety_check_due: { label: "Book check",     disabled: false },
};

// Month-name → number map for locale-safe date sorting ("12 Nov 2025" format)
const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4,  May: 5,  Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
function parseDateForSort(s: string): number {
  const [d, m, y] = s.split(" ");
  return parseInt(y) * 10000 + (MONTH_NUM[m] ?? 0) * 100 + parseInt(d);
}

const totalPatients  = PATIENTS.length;
const eligibleNow    = PATIENTS.filter((p) => p.status === "eligible").length;
const needsOutreach  = PATIENTS.filter((p) => p.status === "needs_outreach" || p.status === "overdue").length;
const safetyChecksDue = PATIENTS.filter((p) => p.status === "safety_check_due").length;

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-1 min-w-0">
      <span className={`text-3xl font-bold ${accent ?? "text-navy"}`}>{value}</span>
      <span className="text-base font-medium text-gray-600">{label}</span>
    </div>
  );
}

function FundingBadge({ amount }: { amount: number }) {
  const cls =
    amount > 75
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : amount > 0
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-gray-100 text-gray-500 border border-gray-200";
  return (
    <span className={`inline-block text-sm font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      ${amount} left
    </span>
  );
}

function SortableHeader({
  label, column, active, dir, onSort,
}: {
  label: string;
  column: SortColumn;
  active: boolean;
  dir: SortDir;
  onSort: (c: SortColumn) => void;
}) {
  return (
    <button type="button" onClick={() => onSort(column)} className="flex items-center gap-1 group">
      {label}
      <span className={active ? "text-[#0B5C6C]" : "text-gray-400 group-hover:text-gray-600"}>
        {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

export default function AdminPatientsPage() {
  const [search,        setSearch]        = useState("");
  const [sortCol,       setSortCol]       = useState<SortColumn | null>(null);
  const [sortDir,       setSortDir]       = useState<SortDir>("asc");
  const [statusFilter,  setStatusFilter]  = useState<PatientStatus | "all">("all");
  const [fundingFilter, setFundingFilter] = useState<FundingType | "all">("all");
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerMsid,    setDrawerMsid]    = useState<string | null>(null);
  const [drawerName,    setDrawerName]    = useState<string | undefined>(undefined);

  function openDrawer(msid: string, name: string) {
    setDrawerMsid(msid);
    setDrawerName(name);
    setDrawerOpen(true);
  }

  function handleSort(column: SortColumn) {
    if (sortCol === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(column);
      setSortDir("asc");
    }
  }

  const displayedPatients = useMemo(() => {
    let result = [...PATIENTS];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.msid.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (fundingFilter !== "all") {
      result = result.filter((p) => p.funding === fundingFilter);
    }

    if (sortCol) {
      result.sort((a, b) => {
        const aVal = sortCol === "remainingAmount" ? a.remainingAmount : parseDateForSort(a[sortCol]);
        const bVal = sortCol === "remainingAmount" ? b.remainingAmount : parseDateForSort(b[sortCol]);
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [search, statusFilter, fundingFilter, sortCol, sortDir]);

  const selectCls =
    "px-3 py-2.5 border border-gray-300 rounded-lg text-base bg-white text-gray-700 " +
    "focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy">Patients</h1>
        <p className="text-base text-gray-600 mt-1">Active patient register — Midland Sleep</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Patients"    value={totalPatients} />
        <SummaryCard label="Eligible Now"      value={eligibleNow}    accent="text-emerald-700" />
        <SummaryCard label="Needs Outreach"    value={needsOutreach}  accent="text-amber-700" />
        <SummaryCard label="Safety Checks Due" value={safetyChecksDue} accent="text-amber-700" />
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or MSID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base
                       focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                       bg-white placeholder:text-gray-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PatientStatus | "all")}
          className={selectCls}
        >
          <option value="all">All statuses</option>
          <option value="eligible">Eligible</option>
          <option value="not_eligible">Not eligible</option>
          <option value="overdue">Overdue</option>
          <option value="needs_outreach">Needs outreach</option>
          <option value="safety_check_due">Safety check due</option>
        </select>

        <select
          value={fundingFilter}
          onChange={(e) => setFundingFilter(e.target.value as FundingType | "all")}
          className={selectCls}
        >
          <option value="all">All funding</option>
          <option value="ACC">ACC</option>
          <option value="Private">Private</option>
        </select>

        <span className="text-base text-gray-500 whitespace-nowrap">
          {displayedPatients.length} of {PATIENTS.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Patient Name
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  MSID
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Phone
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Funding
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  <SortableHeader label="Last Order" column="lastOrder" active={sortCol === "lastOrder"} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  <SortableHeader label="Next Eligible" column="nextEligible" active={sortCol === "nextEligible"} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Status
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  <SortableHeader label="Remaining Funding" column="remainingAmount" active={sortCol === "remainingAmount"} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-base text-gray-500">
                    No patients match the current filters.
                  </td>
                </tr>
              ) : (
                displayedPatients.map((patient) => {
                  const statusCfg = STATUS_CONFIG[patient.status];
                  const actionCfg = ACTION_CONFIG[patient.status];
                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ minHeight: "64px" }}
                    >
                      <td className="px-5 py-5">
                        <span className="text-base font-semibold text-navy">{patient.name}</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-base font-mono text-gray-700">
                          {patient.msid.replace(/^MS-/, "")}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <a
                          href={`tel:${patient.phone.replace(/\s/g, "")}`}
                          className="text-base text-gray-700 hover:text-[#0B5C6C] transition-colors whitespace-nowrap"
                        >
                          {patient.phone}
                        </a>
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={`inline-block text-sm font-medium px-2.5 py-1 rounded-full ${
                            patient.funding === "ACC"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {patient.funding}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-base text-gray-700 whitespace-nowrap">{patient.lastOrder}</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-base text-gray-700 whitespace-nowrap">{patient.nextEligible}</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className={`inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <FundingBadge amount={patient.remainingAmount} />
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          <button
                            type="button"
                            disabled={actionCfg.disabled}
                            onClick={actionCfg.disabled ? undefined : () => console.log(actionCfg.label, patient)}
                            className={
                              actionCfg.disabled
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed rounded-lg px-4 py-2 min-h-[44px] text-base font-medium whitespace-nowrap"
                                : "bg-[#0B5C6C] text-white text-base font-medium rounded-lg px-4 py-2 min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors whitespace-nowrap"
                            }
                          >
                            {actionCfg.label}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDrawer(patient.msid, patient.name)}
                            className="border border-[#0B5C6C] text-[#0B5C6C] text-base font-medium rounded-lg px-4 py-2 min-h-[44px] hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PatientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        msid={drawerMsid}
        patientName={drawerName}
      />
    </div>
  );
}
