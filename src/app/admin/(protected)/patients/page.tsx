"use client";

import { useState, useMemo, useEffect } from "react";
import { PatientDrawer } from "@/components/admin/PatientDrawer";
import { cn } from "@/lib/utils";

type FundingType       = "ACC" | "Private" | "Health NZ";
type PatientStatus     = "eligible" | "not_eligible" | "overdue" | "needs_outreach" | "safety_check_due" | "pending_review";
type RemainingRange    = "zero" | "low" | "mid" | "high";
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
  source?: "demo" | "admin_csv";
  importBatchId?: string;
  reviewStatus?: string;
  importedAt?: string;
}

interface ImportedPatientSummary {
  patient_id: string;
  portal_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  funded_by?: string;
  import_batch_id?: string;
  import_row_number?: number;
  import_status?: string;
  review_status?: string;
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
  eligible:         { label: "Eligible",        classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  not_eligible:     { label: "Not eligible",     classes: "bg-gray-100 text-gray-600 border border-gray-200" },
  overdue:          { label: "Overdue",          classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  needs_outreach:   { label: "Needs outreach",   classes: "bg-orange-100 text-orange-800 border border-orange-200" },
  safety_check_due: { label: "Safety check due", classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  pending_review:   { label: "Pending review",   classes: "bg-sky-100 text-sky-800 border border-sky-200" },
};

const ACTION_CONFIG: Record<PatientStatus, { label: string; disabled: boolean }> = {
  eligible:         { label: "Create order",   disabled: false },
  not_eligible:     { label: "Not eligible",   disabled: true  },
  overdue:          { label: "Start outreach", disabled: false },
  needs_outreach:   { label: "Call patient",   disabled: false },
  safety_check_due: { label: "Book check",     disabled: false },
  pending_review:   { label: "Review record",  disabled: false },
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

function mapImportedPatient(patient: ImportedPatientSummary): Patient {
  return {
    id: patient.patient_id,
    name: patient.name,
    msid: patient.portal_id,
    phone: formatNzPhone(patient.phone),
    funding: mapFunding(patient.funded_by),
    lastOrder: "—",
    nextEligible: "Review required",
    status: "pending_review",
    annualAllowance: 0,
    usedAmount: 0,
    remainingAmount: 0,
    fundingPeriodStart: "—",
    fundingPeriodEnd: "—",
    suggestedItemsRemaining: [],
    source: "admin_csv",
    importBatchId: patient.import_batch_id,
    reviewStatus: humanizeLabel(patient.review_status),
    importedAt: formatNzDateTime(patient.created_at),
  };
}

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
    amount > 75  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
    amount > 0   ? "bg-amber-50 text-amber-700 border border-amber-200" :
                   "bg-gray-100 text-gray-500 border border-gray-200";
  return (
    <span className={`inline-block text-sm font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      ${amount} left
    </span>
  );
}

// ─── Filter option data ────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: PatientStatus; label: string }[] = [
  { value: "pending_review",   label: "Pending review" },
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
  { value: "zero", label: "$0 left" },
  { value: "low",  label: "$1–$49 left" },
  { value: "mid",  label: "$50–$99 left" },
  { value: "high", label: "$100+ left" },
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
  function toggleFunding(v: FundingType) {
    const next = new Set(fundingFilters);
    next.has(v) ? next.delete(v) : next.add(v);
    setFundingFilters(next);
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

          {/* Funding */}
          <div className={sectionCls}>
            <span className={legendCls}>Funding</span>
            {FUNDING_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowCls}>
                <input
                  type="checkbox"
                  checked={fundingFilters.has(opt.value)}
                  onChange={() => toggleFunding(opt.value)}
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
  const [importedPatients, setImportedPatients] = useState<Patient[]>([]);
  const [importLoading,    setImportLoading]    = useState(true);
  const [importError,      setImportError]      = useState<string | null>(null);
  const [statusFilters,    setStatusFilters]    = useState<Set<PatientStatus>>(new Set());
  const [fundingFilters,   setFundingFilters]   = useState<Set<FundingType>>(new Set());
  const [remainingRange,   setRemainingRange]   = useState<RemainingRange | null>(null);
  const [nextEligRange,    setNextEligRange]    = useState<NextEligibleRange | null>(null);
  const [activeSortOption, setActiveSortOption] = useState<SortOption | null>(null);
  const [filterPanelOpen,  setFilterPanelOpen]  = useState(false);
  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const [drawerMsid,       setDrawerMsid]       = useState<string | null>(null);
  const [drawerName,       setDrawerName]       = useState<string | undefined>(undefined);

  function openDrawer(msid: string, name: string) {
    setDrawerMsid(msid);
    setDrawerName(name);
    setDrawerOpen(true);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadImportedPatients() {
      setImportLoading(true);
      setImportError(null);
      try {
        const res = await fetch("/api/admin/patients", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load imported patients");
        const data = (await res.json()) as { patients?: ImportedPatientSummary[] };
        if (!cancelled) {
          setImportedPatients((data.patients ?? []).map(mapImportedPatient));
        }
      } catch {
        if (!cancelled) {
          setImportedPatients([]);
          setImportError("Imported patients could not be loaded. Demo patients are still shown.");
        }
      } finally {
        if (!cancelled) setImportLoading(false);
      }
    }

    loadImportedPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  function clearAllFilters() {
    setStatusFilters(new Set());
    setFundingFilters(new Set());
    setRemainingRange(null);
    setNextEligRange(null);
    setActiveSortOption(null);
  }

  const displayedPatients = useMemo(() => {
    let result = [...importedPatients, ...PATIENTS];

    if (search.trim()) {
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
        if (remainingRange === "zero") return r === 0;
        if (remainingRange === "low")  return r >= 1  && r <= 49;
        if (remainingRange === "mid")  return r >= 50 && r <= 99;
        return r >= 100;
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
    return result;
  }, [search, statusFilters, fundingFilters, remainingRange, nextEligRange, activeSortOption, importedPatients]);

  const allPatients = useMemo(() => [...importedPatients, ...PATIENTS], [importedPatients]);
  const totalPatients = allPatients.length;
  const eligibleNow = allPatients.filter((p) => p.status === "eligible").length;
  const needsOutreach = allPatients.filter((p) => p.status === "needs_outreach" || p.status === "overdue").length;
  const safetyChecksDue = allPatients.filter((p) => p.status === "safety_check_due").length;

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
      label: remainingRange === "zero" ? "$0 left"
           : remainingRange === "low"  ? "$1–$49"
           : remainingRange === "mid"  ? "$50–$99"
           : "$100+",
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
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base
                       focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                       bg-white placeholder:text-gray-400"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-base
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

        <span className="text-base text-gray-500 whitespace-nowrap">
          {displayedPatients.length} of {totalPatients}
        </span>
        {importLoading && (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
            Loading imported records...
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Patient Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">MSID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Funding</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Last Order</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Next Eligible</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Remaining Funding</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-base text-gray-500">
                    <span className="block font-medium text-gray-700">No patients found</span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Adjust the search or filters to see imported and demo patient records.
                    </span>
                  </td>
                </tr>
              ) : (
                displayedPatients.map((patient) => {
                  const statusCfg = STATUS_CONFIG[patient.status];
                  const actionCfg = ACTION_CONFIG[patient.status];
                  const fundingCls =
                    patient.funding === "ACC"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : patient.funding === "Health NZ"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-purple-50 text-purple-700 border border-purple-200";
                  return (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-navy">{patient.name}</span>
                          {patient.source === "admin_csv" && (
                            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                              Imported
                            </span>
                          )}
                        </div>
                        {patient.source === "admin_csv" && patient.importedAt && patient.importedAt !== "—" && (
                          <span className="mt-1 block text-xs text-gray-500">Imported {patient.importedAt}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[12rem] break-all font-mono text-sm leading-5 text-gray-700">
                          {patient.msid.replace(/^MS-/, "")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <span className={`inline-block text-sm font-medium px-2.5 py-1 rounded-full ${fundingCls}`}>
                          {patient.funding}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 whitespace-nowrap">{patient.lastOrder}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 whitespace-nowrap">{patient.nextEligible}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <FundingBadge amount={patient.remainingAmount} />
                      </td>
                      <td className="px-4 py-3">
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
                            {actionCfg.label}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDrawer(patient.msid, patient.name)}
                            className="border border-[#0B5C6C] text-[#0B5C6C] text-sm font-medium rounded-lg px-3 py-2 min-h-[40px] hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
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
      />
    </div>
  );
}
