"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PatientDrawer } from "@/components/admin/PatientDrawer";
import { cn } from "@/lib/utils";

type FundingType       = "ACC" | "Private" | "Health NZ";
type PatientStatus     = "eligible" | "not_eligible" | "overdue" | "needs_outreach" | "safety_check_due" | "pending_review" | "reviewed";
type RemainingRange    = "critical" | "mid" | "healthy";
type NextEligibleRange = "now" | "30days" | "90days" | "later";
type SortOption        =
  | "lastOrder_newest" | "lastOrder_oldest"
  | "nextEligible_soonest"
  | "remaining_highest" | "remaining_lowest";

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
  source?: "demo" | "admin_csv" | "dynamodb/manual" | "unknown";
  importBatchId?: string;
  reviewStatus?: string;
  needsOutreach?: boolean;
  safetyCheckRequired?: boolean;
  importedAt?: string;
}

interface PatientSummary {
  patient_id: string;
  portal_id: string;
  org_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  funded_by?: string;
  import_source?: string;
  import_batch_id?: string;
  import_row_number?: number;
  import_status?: string;
  review_status?: string;
  needs_outreach?: boolean;
  safety_check_required?: boolean;
  created_at?: string;
  created_by?: string;
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
    annualAllowance: 250,
    usedAmount: 70,
    remainingAmount: 180,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Filters"],
    fundingNote: "Patient has remaining allowance for standard replacement items.",
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
    annualAllowance: 250,
    usedAmount: 250,
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
    annualAllowance: 250,
    usedAmount: 110,
    remainingAmount: 140,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Filters"],
    fundingNote: "Remaining allowance is available for standard replacement items.",
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
    annualAllowance: 250,
    usedAmount: 250,
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
    annualAllowance: 250,
    usedAmount: 130,
    remainingAmount: 120,
    fundingPeriodStart: "1 Jan 2026",
    fundingPeriodEnd: "31 Dec 2026",
    suggestedItemsRemaining: ["Mask cushion", "Filters"],
    fundingNote: "Remaining allowance is available for standard replacement items.",
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
    annualAllowance: 250,
    usedAmount: 100,
    remainingAmount: 150,
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
    annualAllowance: 250,
    usedAmount: 60,
    remainingAmount: 190,
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
    annualAllowance: 250,
    usedAmount: 250,
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

const SHOW_DEMO_PATIENTS = false;

const STATUS_CONFIG: Record<PatientStatus, { label: string; classes: string }> = {
  eligible:         { label: "Eligible",        classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  not_eligible:     { label: "Not eligible",     classes: "bg-gray-100 text-gray-600 border border-gray-200" },
  overdue:          { label: "Overdue",          classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  needs_outreach:   { label: "Needs outreach",   classes: "bg-orange-100 text-orange-800 border border-orange-200" },
  safety_check_due: { label: "Safety check due", classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  pending_review:   { label: "Pending review",   classes: "bg-sky-100 text-sky-800 border border-sky-200" },
  reviewed:         { label: "Reviewed",         classes: "bg-green-100 text-green-800 border border-green-200" },
};

const ACTION_CONFIG: Record<PatientStatus, { label: string; disabled: boolean }> = {
  eligible:         { label: "View patient",   disabled: false },
  not_eligible:     { label: "View patient",   disabled: false },
  overdue:          { label: "Open review",    disabled: false },
  needs_outreach:   { label: "Open review",    disabled: false },
  safety_check_due: { label: "Open review",    disabled: false },
  pending_review:   { label: "Open review",    disabled: false },
  reviewed:         { label: "View patient",   disabled: false },
};

const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4,  May: 5,  Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
function parseDateForSort(s: string): number {
  const [d, m, y] = s.split(" ");
  if (!d || !m || !y) return 0;
  return parseInt(y) * 10000 + (MONTH_NUM[m] ?? 0) * 100 + parseInt(d);
}
function parseToDate(s: string): Date | null {
  const [d, m, y] = s.split(" ");
  const mo = MONTH_NUM[m];
  if (!mo) return null;
  return new Date(parseInt(y), mo - 1, parseInt(d));
}

function humanizeLabel(value?: string): string {
  const normalized = value?.trim();
  if (!normalized) return "—";
  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function formatNzDateTime(value?: string): string {
  if (!value?.trim()) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Pacific/Auckland",
  }).format(date);
}

function formatNzPhone(value?: string): string {
  const raw = value?.trim();
  if (!raw || raw === "—") return "—";

  const hasInternationalPrefix = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  const localDigits = digits.startsWith("64") ? `0${digits.slice(2)}` : digits;
  if (localDigits.length === 10 && /^02\d/.test(localDigits)) {
    return `${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6)}`;
  }
  if (localDigits.length === 9 && /^0[34679]/.test(localDigits)) {
    return `${localDigits.slice(0, 2)} ${localDigits.slice(2, 5)} ${localDigits.slice(5)}`;
  }
  if (hasInternationalPrefix && digits.startsWith("64")) {
    return `+64 ${digits.slice(2)}`;
  }
  return raw;
}

function mapFunding(value?: string): FundingType {
  const normalized = (value ?? "").toLowerCase().replace(/[_-]/g, " ").trim();
  if (normalized.includes("acc")) return "ACC";
  if (normalized.includes("health") || normalized.includes("hnz") || normalized.includes("te whatu")) return "Health NZ";
  return "Private";
}

function mapPatientSource(patient: PatientSummary): Patient["source"] {
  if (patient.import_source === "admin_csv") return "admin_csv";
  if (patient.import_source) return "unknown";
  return "dynamodb/manual";
}

function normalizeMsid(msid: string): string {
  return msid.trim().toLowerCase();
}

function combinePatients(realPatients: Patient[]): Patient[] {
  if (!SHOW_DEMO_PATIENTS) return realPatients;

  const realMsids = new Set(realPatients.map((patient) => normalizeMsid(patient.msid)));
  const demoOnlyPatients = PATIENTS
    .map((patient) => ({ ...patient, source: "demo" as const }))
    .filter((patient) => !realMsids.has(normalizeMsid(patient.msid)));
  return [...realPatients, ...demoOnlyPatients];
}

function mapPatient(patient: PatientSummary): Patient {
  const source = mapPatientSource(patient);
  return {
    id: patient.patient_id,
    name: patient.name,
    msid: patient.portal_id,
    phone: formatNzPhone(patient.phone),
    funding: mapFunding(patient.funded_by),
    lastOrder: "—",
    nextEligible: "Review required",
    status: patient.review_status === "reviewed" ? "reviewed" : "pending_review",
    annualAllowance: 0,
    usedAmount: 0,
    remainingAmount: 0,
    fundingPeriodStart: "—",
    fundingPeriodEnd: "—",
    suggestedItemsRemaining: [],
    source,
    importBatchId: patient.import_batch_id,
    reviewStatus: humanizeLabel(patient.review_status),
    needsOutreach: patient.needs_outreach ?? false,
    safetyCheckRequired: patient.safety_check_required ?? false,
    importedAt: formatNzDateTime(patient.created_at),
  };
}

function SummaryCard({ label, value, accent, href, onClick, active }: {
  label: string; value: number; accent?: string; href?: string;
  onClick?: () => void; active?: boolean;
}) {
  const baseCls = cn(
    "rounded-xl p-5 flex flex-col gap-1 min-w-0 shadow-sm transition-all",
    active
      ? "bg-white border-2 border-[#0B5C6C]/50 ring-2 ring-[#0B5C6C]/10 shadow-md"
      : "bg-white border border-gray-200"
  );
  const inner = (
    <>
      <span className={`text-3xl font-bold tabular-nums ${accent ?? "text-navy"}`}>{value}</span>
      <span className="text-sm font-semibold uppercase tracking-wide text-gray-600">{label}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseCls} cursor-pointer hover:border-[#0B5C6C]/40 hover:shadow-md text-left w-full`}>
        {inner}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={`${baseCls} cursor-pointer hover:border-[#0B5C6C]/30 hover:shadow-md`}>
        {inner}
      </Link>
    );
  }
  return <div className={baseCls}>{inner}</div>;
}

function FundingBadge({ amount }: { amount: number }) {
  const cls =
    amount >= 200 ? "bg-green-50 text-[#0B5C6C] border border-green-200" :
    amount >= 100 ? "bg-amber-50 text-[#D97706] border border-amber-200" :
                   "bg-red-50 text-[#E05252] border border-red-200";
  return (
    <span className={`inline-block text-sm font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      ${amount} left
    </span>
  );
}

function getOperationalCue(patient: Patient): string {
  if (patient.source === "admin_csv" && patient.status === "reviewed") return "Imported record — reviewed";
  if (patient.source === "admin_csv") return "Imported record needs staff review";
  if (patient.source === "dynamodb/manual" && patient.status === "reviewed") return "DynamoDB record — reviewed";
  if (patient.source === "dynamodb/manual") return "DynamoDB patient record";
  if (patient.status === "safety_check_due") return "Safety-check visibility cue";
  if (patient.status === "needs_outreach" || patient.status === "overdue") return "Outreach visibility cue";
  if (patient.status === "eligible") return "Eligible for staff review";
  return "View record details";
}

function getActionLabel(patient: Patient): string {
  if (patient.status === "reviewed") return "View patient";
  if (
    patient.status === "pending_review" ||
    patient.status === "needs_outreach" ||
    patient.status === "overdue" ||
    patient.status === "safety_check_due" ||
    patient.source === "admin_csv" ||
    patient.source === "dynamodb/manual"
  ) {
    return "Open review";
  }
  return "View patient";
}

// ─── Filter option data ────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: PatientStatus; label: string }[] = [
  { value: "pending_review",   label: "Pending review" },
  { value: "reviewed",         label: "Reviewed" },
  { value: "eligible",         label: "Eligible" },
  { value: "needs_outreach",   label: "Needs outreach" },
  { value: "safety_check_due", label: "Safety check due" },
  { value: "overdue",          label: "Overdue" },
  { value: "not_eligible",     label: "Not eligible" },
];

const FUNDING_OPTIONS: { value: FundingType; label: string }[] = [
  { value: "ACC",       label: "ACC" },
  { value: "Health NZ", label: "Health NZ" },
  { value: "Private",   label: "Private" },
];

const REMAINING_OPTIONS: { value: RemainingRange; label: string }[] = [
  { value: "critical", label: "$0–$99 left" },
  { value: "mid",      label: "$100–$199 left" },
  { value: "healthy",  label: "$200–$250 left" },
];

const NEXT_ELIG_OPTIONS: { value: NextEligibleRange; label: string }[] = [
  { value: "now",    label: "Eligible now" },
  { value: "30days", label: "Next 30 days" },
  { value: "90days", label: "Next 90 days" },
  { value: "later",  label: "Later" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "lastOrder_newest",     label: "Last order newest" },
  { value: "lastOrder_oldest",     label: "Last order oldest" },
  { value: "nextEligible_soonest", label: "Next eligible soonest" },
  { value: "remaining_highest",    label: "Remaining funding highest" },
  { value: "remaining_lowest",     label: "Remaining funding lowest" },
];

// ─── FilterPanel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilters: Set<PatientStatus>;
  setStatusFilters: (s: Set<PatientStatus>) => void;
  fundingFilters: Set<FundingType>;
  setFundingFilters: (s: Set<FundingType>) => void;
  remainingRange: RemainingRange | null;
  setRemainingRange: (r: RemainingRange | null) => void;
  nextEligRange: NextEligibleRange | null;
  setNextEligRange: (r: NextEligibleRange | null) => void;
  activeSortOption: SortOption | null;
  setActiveSortOption: (s: SortOption | null) => void;
  resultCount: number;
  onClearAll: () => void;
}

function FilterPanel({
  isOpen, onClose,
  statusFilters, setStatusFilters,
  fundingFilters, setFundingFilters,
  remainingRange, setRemainingRange,
  nextEligRange, setNextEligRange,
  activeSortOption, setActiveSortOption,
  resultCount, onClearAll,
}: FilterPanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  function toggleStatus(v: PatientStatus) {
    const next = new Set(statusFilters);
    next.has(v) ? next.delete(v) : next.add(v);
    setStatusFilters(next);
  }
  const sectionCls = "space-y-1 pb-5 border-b border-gray-100 last:border-0 last:pb-0";
  const legendCls  = "block text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3";
  const rowCls     = "flex items-center gap-3 min-h-[44px] cursor-pointer select-none";
  const inputCls   = "h-5 w-5 rounded accent-[#0B5C6C] cursor-pointer shrink-0";
  const labelCls   = "text-base text-gray-700";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter & Sort"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy">Filter &amp; Sort</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClearAll}
              className="text-base text-[#0B5C6C] hover:underline font-medium min-h-[44px] px-3"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status */}
          <div className={sectionCls}>
            <span className={legendCls}>Status</span>
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="checkbox"
                  checked={statusFilters.has(opt.value)}
                  onChange={() => toggleStatus(opt.value)}
                  className={inputCls}
                />
                <span className={labelCls}>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Remaining Funding */}
          <div className={sectionCls}>
            <span className={legendCls}>Remaining Funding</span>
            {REMAINING_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="radio"
                  name="remainingRange"
                  checked={remainingRange === opt.value}
                  onChange={() => setRemainingRange(opt.value)}
                  onClick={() => { if (remainingRange === opt.value) setRemainingRange(null); }}
                  className={inputCls}
                />
                <span className={labelCls}>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Next Eligible */}
          <div className={sectionCls}>
            <span className={legendCls}>Next Eligible</span>
            {NEXT_ELIG_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="radio"
                  name="nextEligRange"
                  checked={nextEligRange === opt.value}
                  onChange={() => setNextEligRange(opt.value)}
                  onClick={() => { if (nextEligRange === opt.value) setNextEligRange(null); }}
                  className={inputCls}
                />
                <span className={labelCls}>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Sort */}
          <div className={sectionCls}>
            <span className={legendCls}>Sort</span>
            {SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="radio"
                  name="sortOption"
                  checked={activeSortOption === opt.value}
                  onChange={() => setActiveSortOption(opt.value)}
                  onClick={() => { if (activeSortOption === opt.value) setActiveSortOption(null); }}
                  className={inputCls}
                />
                <span className={labelCls}>{opt.label}</span>
              </label>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4 bg-white">
          <p className="text-base font-medium text-gray-600">{resultCount} patients found</p>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0B5C6C] text-white text-base font-medium px-6 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
          >
            Show patients
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPatientsPage() {
  const [search,           setSearch]           = useState("");
  const [dynamoPatients,   setDynamoPatients]   = useState<Patient[]>([]);
  const [importLoading,    setImportLoading]    = useState(true);
  const [importError,      setImportError]      = useState<string | null>(null);
  const [worklistMode,     setWorklistMode]     = useState<"all" | "pending_review" | "needs_outreach" | "safety_checks">("pending_review");
  const [statusFilters,    setStatusFilters]    = useState<Set<PatientStatus>>(new Set());
  const [fundingFilters,   setFundingFilters]   = useState<Set<FundingType>>(new Set());
  const [remainingRange,   setRemainingRange]   = useState<RemainingRange | null>(null);
  const [nextEligRange,    setNextEligRange]    = useState<NextEligibleRange | null>(null);
  const [activeSortOption, setActiveSortOption] = useState<SortOption | null>(null);
  const [tableSortKey,     setTableSortKey]     = useState<string | null>(null);
  const [tableSortDir,     setTableSortDir]     = useState<"asc" | "desc">("asc");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [pageSize,         setPageSize]         = useState(20);
  const [filterPanelOpen,  setFilterPanelOpen]  = useState(false);
  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const [drawerMsid,       setDrawerMsid]       = useState<string | null>(null);
  const [drawerName,       setDrawerName]       = useState<string | undefined>(undefined);

  function toggleTableSort(key: string) {
    if (tableSortKey === key) {
      setTableSortDir(tableSortDir === "asc" ? "desc" : "asc");
    } else {
      setTableSortKey(key);
      setTableSortDir("asc");
    }
  }

  function openDrawer(msid: string, name: string) {
    setDrawerMsid(msid);
    setDrawerName(name);
    setDrawerOpen(true);
  }

  function handleReviewStatusChange(changedMsid: string, reviewStatus: string) {
    setDynamoPatients((prev) =>
      prev.map((p) =>
        p.msid === changedMsid
          ? { ...p, status: reviewStatus === "reviewed" ? "reviewed" : "pending_review", reviewStatus: humanizeLabel(reviewStatus) }
          : p
      )
    );
  }

  function handleOutreachChange(changedMsid: string, needsOutreach: boolean) {
    setDynamoPatients((prev) =>
      prev.map((p) => p.msid === changedMsid ? { ...p, needsOutreach } : p)
    );
  }

  function handleSafetyChange(changedMsid: string, safetyCheckRequired: boolean) {
    setDynamoPatients((prev) =>
      prev.map((p) => p.msid === changedMsid ? { ...p, safetyCheckRequired } : p)
    );
  }

  // Auto-open drawer when ?msid= is present in the URL (e.g. navigating from portal account drawer)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const msidParam = new URLSearchParams(window.location.search).get('msid');
    if (msidParam) openDrawer(msidParam, '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      setImportLoading(true);
      setImportError(null);
      try {
        const res = await fetch("/api/admin/patients", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load patients");
        const data = (await res.json()) as { patients?: PatientSummary[] };
        if (!cancelled) {
          setDynamoPatients((data.patients ?? []).map(mapPatient));
        }
      } catch {
        if (!cancelled) {
          setDynamoPatients([]);
          setImportError("Patient records could not be loaded.");
        }
      } finally {
        if (!cancelled) setImportLoading(false);
      }
    }

    loadPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  function clearAllFilters() {
    setSearch("");
    setStatusFilters(new Set());
    setFundingFilters(new Set());
    setRemainingRange(null);
    setNextEligRange(null);
    setActiveSortOption(null);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [search, worklistMode, statusFilters, fundingFilters, remainingRange, nextEligRange, activeSortOption, tableSortKey, tableSortDir, pageSize]);

  const allPatients = useMemo(() => combinePatients(dynamoPatients), [dynamoPatients]);

  const displayedPatients = useMemo(() => {
    const isSearching = search.trim().length > 0;
    // When a search query is active, scan all patients regardless of the selected segment
    // so that reviewed patients (and any other segment) are always reachable by name or MSID.
    let result = isSearching
      ? [...allPatients]
      : worklistMode === "needs_outreach"
        ? allPatients.filter((p) => p.needsOutreach === true)
        : worklistMode === "safety_checks"
          ? allPatients.filter((p) => p.safetyCheckRequired === true)
          : worklistMode === "all"
            ? [...allPatients]
            : allPatients.filter((p) => p.status === "pending_review");

    if (isSearching) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.msid.toLowerCase().includes(q)
      );
    }
    if (statusFilters.size > 0) {
      result = result.filter((p) => statusFilters.has(p.status));
    }
    if (fundingFilters.size > 0) {
      result = result.filter((p) => fundingFilters.has(p.funding));
    }
    if (remainingRange) {
      result = result.filter((p) => {
        const r = p.remainingAmount;
        if (remainingRange === "critical") return r <= 99;
        if (remainingRange === "mid")      return r >= 100 && r <= 199;
        return r >= 200; // healthy
      });
    }
    if (nextEligRange) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d30 = new Date(today); d30.setDate(d30.getDate() + 30);
      const d90 = new Date(today); d90.setDate(d90.getDate() + 90);
      result = result.filter((p) => {
        const d = parseToDate(p.nextEligible);
        if (!d) return false;
        if (nextEligRange === "now")    return d <= today;
        if (nextEligRange === "30days") return d > today && d <= d30;
        if (nextEligRange === "90days") return d > today && d <= d90;
        return d > d90;
      });
    }
    if (activeSortOption) {
      result.sort((a, b) => {
        switch (activeSortOption) {
          case "lastOrder_newest":     return parseDateForSort(b.lastOrder)    - parseDateForSort(a.lastOrder);
          case "lastOrder_oldest":     return parseDateForSort(a.lastOrder)    - parseDateForSort(b.lastOrder);
          case "nextEligible_soonest": return parseDateForSort(a.nextEligible) - parseDateForSort(b.nextEligible);
          case "remaining_highest":    return b.remainingAmount - a.remainingAmount;
          case "remaining_lowest":     return a.remainingAmount - b.remainingAmount;
          default:                     return 0;
        }
      });
    }
    if (tableSortKey) {
      result.sort((a, b) => {
        let cmp = 0;
        if (tableSortKey === "name")          cmp = a.name.localeCompare(b.name);
        else if (tableSortKey === "lastOrder")    cmp = parseDateForSort(a.lastOrder)    - parseDateForSort(b.lastOrder);
        else if (tableSortKey === "nextEligible") cmp = parseDateForSort(a.nextEligible) - parseDateForSort(b.nextEligible);
        else if (tableSortKey === "status")       cmp = a.status.localeCompare(b.status);
        return tableSortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [search, worklistMode, statusFilters, fundingFilters, remainingRange, nextEligRange, activeSortOption, tableSortKey, tableSortDir, allPatients]);

  const totalPatients = allPatients.length;
  const eligibleNow = allPatients.filter((p) => p.status === "eligible").length;
  const pendingReview = allPatients.filter((p) => p.status === "pending_review").length;
  const needsOutreach = allPatients.filter((p) => p.status === "needs_outreach" || p.status === "overdue" || p.needsOutreach === true).length;
  const safetyChecksDue = allPatients.filter((p) => p.status === "safety_check_due" || p.safetyCheckRequired === true).length;

  const activeFilterCount =
    statusFilters.size +
    fundingFilters.size +
    (remainingRange    ? 1 : 0) +
    (nextEligRange     ? 1 : 0) +
    (activeSortOption  ? 1 : 0);

  const filterChips: { key: string; label: string; onRemove: () => void }[] = [
    ...[...statusFilters].map((s) => ({
      key: `s-${s}`,
      label: STATUS_CONFIG[s].label,
      onRemove: () => { const n = new Set(statusFilters); n.delete(s); setStatusFilters(n); },
    })),
    ...[...fundingFilters].map((f) => ({
      key: `f-${f}`,
      label: f,
      onRemove: () => { const n = new Set(fundingFilters); n.delete(f); setFundingFilters(n); },
    })),
    ...(remainingRange ? [{
      key: "rem",
      label: remainingRange === "critical" ? "$0–$99"
           : remainingRange === "mid"      ? "$100–$199"
           : "$200–$250",
      onRemove: () => setRemainingRange(null),
    }] : []),
    ...(nextEligRange ? [{
      key: "elig",
      label: nextEligRange === "now"    ? "Eligible now"
           : nextEligRange === "30days" ? "Next 30 days"
           : nextEligRange === "90days" ? "Next 90 days"
           : "Later",
      onRemove: () => setNextEligRange(null),
    }] : []),
    ...(activeSortOption ? [{
      key: "sort",
      label: `Sort: ${
        activeSortOption === "lastOrder_newest"     ? "Newest first"     :
        activeSortOption === "lastOrder_oldest"     ? "Oldest first"     :
        activeSortOption === "nextEligible_soonest" ? "Eligible soonest" :
        activeSortOption === "remaining_highest"    ? "Highest balance"  :
                                                      "Lowest balance"
      }`,
      onRemove: () => setActiveSortOption(null),
    }] : []),
  ];

  const filteredCount = displayedPatients.length;
  const totalPages    = Math.max(1, Math.ceil(filteredCount / pageSize));
  const pagedPatients = displayedPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem     = (currentPage - 1) * pageSize + 1;
  const lastItem      = Math.min(currentPage * pageSize, filteredCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
          Patient operations
        </p>
        <h1 className="text-3xl font-bold text-navy">Patients</h1>
        <p className="text-base leading-6 text-gray-600">
          Operational worklist for DynamoDB patient records, imported records, outreach cues, and safety-check visibility.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="Total patients"      value={totalPatients}
          onClick={() => setWorklistMode("all")}
          active={worklistMode === "all"} />
        <SummaryCard label="Pending review"      value={pendingReview}   accent="text-sky-700"
          onClick={() => setWorklistMode("pending_review")}
          active={worklistMode === "pending_review"} />
        <SummaryCard label="Needs outreach"      value={needsOutreach}   accent="text-amber-700"
          onClick={() => setWorklistMode("needs_outreach")}
          active={worklistMode === "needs_outreach"} />
        <SummaryCard label="Safety checks due"   value={safetyChecksDue} accent="text-amber-700"
          onClick={() => setWorklistMode("safety_checks")}
          active={worklistMode === "safety_checks"} />
        <SummaryCard label="Eligible now"        value={eligibleNow}     accent="text-emerald-700" href="/admin/patients?filter=eligible" />
      </div>

      {/* Search + Filter & Sort button */}
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
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-base
                       focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                       bg-white placeholder:text-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFilterPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-base font-medium
                     bg-white text-gray-700 hover:border-[#0B5C6C] min-h-[44px] whitespace-nowrap transition-colors"
        >
          Filter &amp; Sort
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-[#0B5C6C] text-white
                             text-xs font-semibold px-2 py-0.5 min-w-[22px]">
              {activeFilterCount}
            </span>
          )}
        </button>

        <a
          href="/api/admin/patients?export=csv"
          download
          className="flex items-center gap-2 px-4 py-2.5 border border-[#0B5C6C] rounded-lg text-base font-medium
                     bg-white text-[#0B5C6C] hover:bg-[#0B5C6C]/5 min-h-[44px] whitespace-nowrap transition-colors"
          title="Export imported patient operational fields only"
        >
          Export imported
        </a>

        {importLoading && (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
            Loading patient records...
          </span>
        )}
      </div>

      {importError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {importError}
        </div>
      )}

      {/* Applied filter chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 bg-[#0B5C6C]/10 text-[#0B5C6C] text-sm font-medium
                         px-3 py-1.5 rounded-full"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className="hover:text-[#0B5C6C]/60 transition-colors leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline px-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            {worklistMode === "needs_outreach" ? "Needs outreach worklist"
              : worklistMode === "safety_checks" ? "Safety checks worklist"
              : worklistMode === "all" ? "All patients"
              : "Patient review worklist"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {search.trim() && worklistMode !== "all"
              ? "Search results are shown across all patients."
              : worklistMode === "needs_outreach"
                ? "Patients flagged for staff follow-up."
                : worklistMode === "safety_checks"
                  ? "Patient records flagged for admin caution before next action."
                  : worklistMode === "all"
                    ? "All DynamoDB patient records available to admin staff."
                    : "Real DynamoDB patient records, imported records, outreach cues, and safety-check cues are marked for staff review."}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  className={`text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none ${tableSortKey === "name" ? "text-deep-teal" : "text-gray-600"}`}
                  onClick={() => toggleTableSort("name")}
                >
                  Patient Name{" "}
                  <span className={tableSortKey === "name" ? "text-deep-teal" : "text-gray-300"}>
                    {tableSortKey === "name" ? (tableSortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">MSID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Phone</th>
                <th
                  className={`text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none ${tableSortKey === "lastOrder" ? "text-deep-teal" : "text-gray-600"}`}
                  onClick={() => toggleTableSort("lastOrder")}
                >
                  Last Order{" "}
                  <span className={tableSortKey === "lastOrder" ? "text-deep-teal" : "text-gray-300"}>
                    {tableSortKey === "lastOrder" ? (tableSortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </th>
                <th
                  className={`text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none ${tableSortKey === "nextEligible" ? "text-deep-teal" : "text-gray-600"}`}
                  onClick={() => toggleTableSort("nextEligible")}
                >
                  Next Eligible{" "}
                  <span className={tableSortKey === "nextEligible" ? "text-deep-teal" : "text-gray-300"}>
                    {tableSortKey === "nextEligible" ? (tableSortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </th>
                <th
                  className={`text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none ${tableSortKey === "status" ? "text-deep-teal" : "text-gray-600"}`}
                  onClick={() => toggleTableSort("status")}
                >
                  Status{" "}
                  <span className={tableSortKey === "status" ? "text-deep-teal" : "text-gray-300"}>
                    {tableSortKey === "status" ? (tableSortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Remaining Funding</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCount === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-base text-gray-500">
                    <span className="block font-medium text-gray-700">No patients found</span>
                    <span className="mt-1 block text-sm text-gray-500">
                      {search.trim()
                        ? "Check the name or Midland Sleep ID and try again."
                        : "Adjust the search or filters to see DynamoDB patient records."}
                    </span>
                  </td>
                </tr>
              ) : (
                pagedPatients.map((patient) => {
                  const statusCfg = STATUS_CONFIG[patient.status];
                  const actionCfg = ACTION_CONFIG[patient.status];
                  const actionLabel = getActionLabel(patient);
                  const operationalCue = getOperationalCue(patient);
                  return (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={actionCfg.disabled}
                            onClick={actionCfg.disabled ? undefined : () => openDrawer(patient.msid, patient.name)}
                            className="bg-transparent border-0 p-0 text-left cursor-pointer text-base font-semibold text-navy hover:text-[#0B5C6C] hover:underline disabled:cursor-default disabled:hover:text-navy disabled:hover:no-underline"
                          >
                            {patient.name}
                          </button>
                          {patient.source === "admin_csv" && (
                            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                              Imported
                            </span>
                          )}
                          {patient.source === "dynamodb/manual" && (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              DynamoDB
                            </span>
                          )}
                          {patient.needsOutreach && (
                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                              Needs outreach
                            </span>
                          )}
                          {patient.safetyCheckRequired && (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Safety check
                            </span>
                          )}
                        </div>
                        {patient.source === "admin_csv" && patient.importedAt && patient.importedAt !== "—" && (
                          <span className="mt-1 block text-xs text-gray-500">Imported {patient.importedAt}</span>
                        )}
                        <span className="mt-1 block text-xs font-medium text-gray-600">{operationalCue}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="whitespace-nowrap tabular-nums min-w-[80px] font-mono text-sm leading-5 text-gray-700">
                          {patient.msid}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {patient.phone === "—" ? (
                          <span className="text-sm text-gray-500">—</span>
                        ) : (
                          <a
                            href={`tel:${patient.phone.replace(/\s/g, "")}`}
                            className="text-sm text-gray-700 hover:text-[#0B5C6C] transition-colors whitespace-nowrap"
                          >
                            {patient.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 whitespace-nowrap">{patient.lastOrder}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 whitespace-nowrap">{patient.nextEligible}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <FundingBadge amount={patient.remainingAmount} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            disabled={actionCfg.disabled}
                            onClick={actionCfg.disabled ? undefined : () => openDrawer(patient.msid, patient.name)}
                            className={
                              actionCfg.disabled
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed rounded-lg px-3 py-2 min-h-[40px] text-sm font-medium whitespace-nowrap"
                                : "bg-[#0B5C6C] text-white text-sm font-medium rounded-lg px-3 py-2 min-h-[40px] hover:bg-[#0B5C6C]/90 transition-colors whitespace-nowrap"
                            }
                          >
                            {actionLabel}
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
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <label className="flex items-center gap-2 shrink-0">
            Show:
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B5C6C]"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <span className="hidden sm:block">
            {filteredCount === 0
              ? "Showing 0 of 0 patients"
              : `Showing ${firstItem}–${lastItem} of ${filteredCount} patients`}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-[#0B5C6C] hover:underline"}
            >
              Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-[#0B5C6C] hover:underline"}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        statusFilters={statusFilters}
        setStatusFilters={setStatusFilters}
        fundingFilters={fundingFilters}
        setFundingFilters={setFundingFilters}
        remainingRange={remainingRange}
        setRemainingRange={setRemainingRange}
        nextEligRange={nextEligRange}
        setNextEligRange={setNextEligRange}
        activeSortOption={activeSortOption}
        setActiveSortOption={setActiveSortOption}
        resultCount={displayedPatients.length}
        onClearAll={clearAllFilters}
      />

      <PatientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        msid={drawerMsid}
        patientName={drawerName}
        onReviewStatusChange={handleReviewStatusChange}
        onOutreachChange={handleOutreachChange}
        onSafetyChange={handleSafetyChange}
      />
    </div>
  );
}
