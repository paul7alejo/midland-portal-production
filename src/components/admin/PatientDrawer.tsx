"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabId = "work" | "record" | "notes" | "history";

interface DrawerPatient {
  msid: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  segment: string;
  registrationDate: string;
  machine: {
    brand: string;
    model: string;
    serial: string;
    deviceId: string;
    setupDate: string;
    fundedBy: string;
    safetyCheckOverdue: boolean;
  };
  mask: {
    brand: string;
    model: string;
    size: string;
    lastIssued: string;
  } | null;
  entitlement: EntitlementItem[];
  funding: DrawerFunding;
  orders: DrawerOrder[];
  nhiMasked: string;
  // nhiActual is never logged — only displayed after explicit reveal with audit trail
  nhiActual: string;
  imported?: boolean;
  importBatchId?: string;
  reviewStatus?: string;
  needsOutreach?: boolean;
  safetyCheckRequired?: boolean;
  safetyCautionReason?: string;
  safetySeverity?: 'low' | 'medium' | 'high';
  safetyDueDate?: string;
  safetyAssignedTo?: string;
  safetyResolvedNote?: string;
  safetyUpdatedAt?: string;
  safetyUpdatedByEmail?: string;
  fundedBy?: string;
}

interface ImportedPatientDetail {
  patient: {
    patient_id: string;
    portal_id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    funded_by?: string;
    import_batch_id?: string;
    review_status?: string;
    needs_outreach?: boolean;
    safety_check_required?: boolean;
    safety_caution_reason?: string;
    safety_severity?: 'low' | 'medium' | 'high';
    safety_due_date?: string;
    safety_assigned_to?: string;
    safety_resolved_note?: string;
    safety_updated_at?: string;
    safety_updated_by_email?: string;
    created_at?: string;
  };
  devices: Array<{
    device_id: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    setup_date?: string;
    funded_by?: string;
  }>;
  mask: {
    mask_id: string;
    brand?: string;
    model?: string;
    size?: string;
    fitted_date?: string;
  } | null;
}

interface EntitlementItem {
  item: string;
  lastReorder: string;
  nextEligible: string;
  usageVsCap: string;
}

interface DrawerFunding {
  annualAllowance: number;
  usedAmount: number;
  remainingAmount: number;
  fundingPeriodStart: string;
  fundingPeriodEnd: string;
  suggestedItemsRemaining: string[];
  fundingNote?: string;
}

interface DrawerOrder {
  id: string;
  date: string;
  items: string;
  status: string;
  dispatched: string;
}

interface PersistedNote {
  note_id: string;
  patient_msid: string;
  body: string;
  created_at: string;
  created_by_email: string | null;
  is_owner: boolean;
  updated_at: string | null;
  is_edited: boolean;
}

interface PatientActivityEvent {
  timestamp: string;
  label: string;
  action: string;
  adminEmail: string | null;
  result: string | null;
  details?: string;
}

export interface PatientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  msid: string | null;
  patientName?: string;
  onReviewStatusChange?: (msid: string, reviewStatus: string) => void;
  onOutreachChange?: (msid: string, needsOutreach: boolean) => void;
  onSafetyChange?: (msid: string, safetyCheckRequired: boolean) => void;
}

const DEMO_DATA: Record<string, DrawerPatient> = {
  "MS-238872": {
    msid: "MS-238872",
    name: "Paul Moreno",
    dob: "14 March 1962",
    phone: "021 456 7890",
    email: "p.moreno@email.com",
    address: "12 Hamilton Gardens Drive, Hamilton 3216",
    segment: "Active",
    registrationDate: "3 June 2022",
    machine: {
      brand: "ResMed",
      model: "AirSense 11 AutoSet",
      serial: "RS-2024-001",
      deviceId: "DEV-238872",
      setupDate: "3 June 2022",
      fundedBy: "ACC",
      safetyCheckOverdue: false,
    },
    mask: {
      brand: "ResMed",
      model: "AirFit F30i",
      size: "Small",
      lastIssued: "12 November 2025",
    },
    entitlement: [
      { item: "Mask cushion",    lastReorder: "12 Nov 2025", nextEligible: "12 May 2026", usageVsCap: "1 / 2 per year" },
      { item: "Headgear",        lastReorder: "12 Nov 2025", nextEligible: "12 May 2026", usageVsCap: "1 / 1 per year" },
      { item: "Complete mask kit", lastReorder: "12 Nov 2024", nextEligible: "12 Nov 2026", usageVsCap: "1 / 1 per 2 years" },
      { item: "Filters",         lastReorder: "12 Nov 2025", nextEligible: "12 May 2026", usageVsCap: "1 / 2 per year" },
    ],
    orders: [
      { id: "ORD-001", date: "1 May 2026",   items: "Mask cushion + Headgear", status: "Pending",   dispatched: "—" },
      { id: "ORD-005", date: "12 Nov 2025",  items: "Mask cushion + Headgear", status: "Completed", dispatched: "15 Nov 2025" },
    ],
    funding: {
      annualAllowance: 250,
      usedAmount: 70,
      remainingAmount: 180,
      fundingPeriodStart: "1 Jan 2026",
      fundingPeriodEnd: "31 Dec 2026",
      suggestedItemsRemaining: ["Mask cushion", "Filters"],
      fundingNote: "Patient has remaining allowance for standard replacement items.",
    },
    nhiMasked: "ZZZ****",
    nhiActual: "ZZZ1234",
  },
};

function safeValue(value?: string): string {
  return value?.trim() || "—";
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

function formatNzDate(value?: string): string {
  if (!value?.trim()) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  }).format(date);
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

function formatNzDateTimeShort(value?: string): string {
  if (!value?.trim()) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
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

function makeImportedPatient(detail: ImportedPatientDetail): DrawerPatient {
  const imported = detail.patient;
  const device = detail.devices[0];
  return {
    msid: imported.portal_id,
    name: imported.name,
    dob: formatNzDate(imported.date_of_birth),
    phone: formatNzPhone(imported.phone),
    email: safeValue(imported.email),
    address: safeValue(imported.address),
    segment: "Imported",
    registrationDate: formatNzDateTime(imported.created_at),
    machine: {
      brand: safeValue(device?.brand),
      model: safeValue(device?.model),
      serial: safeValue(device?.serial_number),
      deviceId: safeValue(device?.device_id),
      setupDate: formatNzDate(device?.setup_date),
      fundedBy: safeValue(device?.funded_by ?? imported.funded_by),
      safetyCheckOverdue: false,
    },
    mask: detail.mask
      ? {
          brand: safeValue(detail.mask.brand),
          model: safeValue(detail.mask.model),
          size: safeValue(detail.mask.size),
          lastIssued: formatNzDate(detail.mask.fitted_date),
        }
      : null,
    entitlement: [],
    funding: {
      annualAllowance: 0,
      usedAmount: 0,
      remainingAmount: 0,
      fundingPeriodStart: "—",
      fundingPeriodEnd: "—",
      suggestedItemsRemaining: [],
      fundingNote: "Imported record requires admin review before entitlement data is available.",
    },
    orders: [],
    nhiMasked: "Stored securely",
    nhiActual: "",
    imported: true,
    importBatchId: imported.import_batch_id,
    reviewStatus: humanizeLabel(imported.review_status),
    needsOutreach: imported.needs_outreach ?? false,
    safetyCheckRequired: imported.safety_check_required ?? false,
    safetyCautionReason: imported.safety_caution_reason,
    safetySeverity: imported.safety_severity,
    safetyDueDate: imported.safety_due_date,
    safetyAssignedTo: imported.safety_assigned_to,
    safetyResolvedNote: imported.safety_resolved_note,
    safetyUpdatedAt: imported.safety_updated_at,
    safetyUpdatedByEmail: imported.safety_updated_by_email,
    fundedBy: imported.funded_by,
  };
}

const TABS: { id: TabId; label: string }[] = [
  { id: "work",    label: "Work" },
  { id: "record",  label: "Record" },
  { id: "notes",   label: "Notes" },
  { id: "history", label: "History" },
];

const NHI_REASONS = [
  "Clinical review",
  "Identity verification",
  "Privacy request",
  "Other",
];

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-base leading-6 text-gray-800 mt-1 min-w-0 break-words">{value}</dd>
    </div>
  );
}

function MonoValue({ value }: { value: string }) {
  return <span className="block max-w-full break-all font-mono leading-6">{value}</span>;
}

function getReviewCues(patient: DrawerPatient): string[] {
  const cues: string[] = [];
  if (patient.imported) cues.push("Imported record requires staff review before operational use.");
  if (patient.reviewStatus && patient.reviewStatus !== "—") cues.push(`Review status: ${humanizeLabel(patient.reviewStatus)}.`);
  if (patient.machine.safetyCheckOverdue) cues.push("Machine safety-check cue is present.");
  if (!patient.mask) cues.push("No mask record is on file for this patient.");
  if (patient.funding.fundingNote) cues.push(patient.funding.fundingNote);
  return cues;
}

interface SafetyDetailPayload {
  reason: string;
  severity: string;
  dueDate: string;
  assignedTo: string;
}

const SEVERITY_LABELS: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const SEVERITY_CHIP: Record<string, string> = {
  low:    'border-yellow-300 bg-yellow-50 text-yellow-800',
  medium: 'border-orange-300 bg-orange-100 text-orange-900',
  high:   'border-red-300 bg-red-100 text-red-900',
};

function activityArea(action: string): string {
  if (action.startsWith('PATIENT_REVIEW')) return 'Review';
  if (action.startsWith('PATIENT_OUTREACH')) return 'Outreach';
  if (action.startsWith('PATIENT_SAFETY')) return 'Admin Caution';
  if (action.startsWith('NOTE')) return 'Notes';
  if (action.includes('PASSWORD') || action.includes('UNLOCK')) return 'Portal Account';
  if (action.startsWith('IMPORT')) return 'Import';
  return 'Other';
}

const AREA_CHIP: Record<string, string> = {
  'Review':         'border-sky-200 bg-sky-50 text-sky-700',
  'Outreach':       'border-orange-200 bg-orange-50 text-orange-700',
  'Admin Caution':  'border-amber-200 bg-amber-50 text-amber-700',
  'Notes':          'border-purple-200 bg-purple-50 text-purple-700',
  'Portal Account': 'border-blue-200 bg-blue-50 text-blue-700',
  'Import':         'border-gray-200 bg-gray-50 text-gray-600',
  'Other':          'border-gray-200 bg-gray-50 text-gray-600',
};

function AdminCautionSection({
  patient,
  loading,
  error,
  onToggleRequired,
  onSaveDetails,
}: {
  patient: DrawerPatient;
  loading: boolean;
  error: string | null;
  onToggleRequired: (required: boolean, resolvedNote?: string) => void;
  onSaveDetails: (details: SafetyDetailPayload) => void;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'clear'>('view');
  const [reason, setReason]       = useState('');
  const [severity, setSeverity]   = useState('');
  const [dueDate, setDueDate]     = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolvedNote, setResolvedNote] = useState('');

  function enterEdit() {
    setReason(patient.safetyCautionReason ?? '');
    setSeverity(patient.safetySeverity ?? '');
    setDueDate(patient.safetyDueDate ?? '');
    setAssignedTo(patient.safetyAssignedTo ?? '');
    setMode('edit');
  }

  function cancelEdit() {
    setMode('view');
  }

  function enterClear() {
    setResolvedNote('');
    setMode('clear');
  }

  function cancelClear() {
    setMode('view');
  }

  const hasDetails = patient.safetyCautionReason || patient.safetySeverity || patient.safetyDueDate || patient.safetyAssignedTo;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">Admin caution</h3>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
          patient.safetyCheckRequired
            ? "border border-amber-400 bg-amber-100 text-amber-900"
            : "border border-gray-200 bg-gray-100 text-gray-600"
        )}>
          {patient.safetyCheckRequired ? "Safety check required" : "No safety check required"}
        </span>
        {patient.safetyCheckRequired && patient.safetySeverity && (
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
            SEVERITY_CHIP[patient.safetySeverity] ?? 'border-gray-200 bg-gray-100 text-gray-600'
          )}>
            {SEVERITY_LABELS[patient.safetySeverity]}
          </span>
        )}
      </div>

      {/* Current details — view mode only, when required=true */}
      {patient.safetyCheckRequired && mode === 'view' && hasDetails && (
        <div className="space-y-1.5 text-sm text-amber-900">
          {patient.safetyCautionReason && (
            <p className="leading-6">{patient.safetyCautionReason}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-amber-800">
            {patient.safetyDueDate && (
              <span>Due: {formatNzDate(patient.safetyDueDate)}</span>
            )}
            {patient.safetyAssignedTo && (
              <span>Assigned: {patient.safetyAssignedTo}</span>
            )}
          </div>
        </div>
      )}

      {/* Edit form */}
      {mode === 'edit' && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-amber-900">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Describe the admin caution (optional)…"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm text-gray-800 bg-white
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-amber-900">Severity:</span>
            {(['low', 'medium', 'high'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(severity === s ? '' : s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  severity === s
                    ? SEVERITY_CHIP[s]
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                )}
              >
                {SEVERITY_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-amber-900">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm text-gray-800 bg-white
                           focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-amber-900">Assigned to</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                maxLength={100}
                placeholder="Name or team…"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm text-gray-800 bg-white
                           focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => { onSaveDetails({ reason, severity, dueDate, assignedTo }); setMode('view'); }}
              className="bg-[#0B5C6C] text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[36px]
                         hover:bg-[#0B4A57] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save details"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={cancelEdit}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 min-h-[36px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clear/resolve panel */}
      {mode === 'clear' && (
        <div className="space-y-3 border-t border-amber-200 pt-3">
          <p className="text-sm text-amber-900">Clearing this flag removes the patient from the Safety Checks worklist.</p>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-amber-900">Resolution note (optional)</label>
            <textarea
              value={resolvedNote}
              onChange={(e) => setResolvedNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Note what was resolved or actioned…"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm text-gray-800 bg-white
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => { onToggleRequired(false, resolvedNote); setMode('view'); }}
              className="border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg min-h-[36px]
                         hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Clearing…" : "Confirm clear"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={cancelClear}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 min-h-[36px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action row (view mode) */}
      {mode === 'view' && (
        <div className="flex flex-wrap items-center gap-3">
          {!patient.safetyCheckRequired ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => onToggleRequired(true)}
              className="bg-[#0B5C6C] text-white text-sm font-medium px-3 py-1.5 rounded-lg
                         hover:bg-[#0B4A57] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Mark safety check required"}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={enterEdit}
                className="border border-amber-300 bg-white text-amber-900 text-sm font-medium px-3 py-1.5 rounded-lg
                           hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                Edit details
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={enterClear}
                className="border border-gray-300 bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg
                           hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Clear safety check
              </button>
            </>
          )}
        </div>
      )}

      {/* Last resolved — visible when not required and a resolved note exists */}
      {!patient.safetyCheckRequired && patient.safetyResolvedNote && (
        <div className="border-t border-amber-200 pt-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Last resolved</p>
          <p className="text-sm text-amber-900 leading-6">{patient.safetyResolvedNote}</p>
          {patient.safetyUpdatedAt && (
            <p className="text-xs text-amber-700">
              {formatNzDateTime(patient.safetyUpdatedAt)}
              {patient.safetyUpdatedByEmail ? ` · ${patient.safetyUpdatedByEmail}` : ''}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

function WorkTab({
  patient,
  reviewLoading,
  reviewError,
  onSetReviewStatus,
  outreachLoading,
  outreachError,
  onSetOutreachStatus,
  safetyLoading,
  safetyError,
  onSetSafetyStatus,
  onSaveSafetyDetails,
}: {
  patient: DrawerPatient;
  reviewLoading: boolean;
  reviewError: string | null;
  onSetReviewStatus: (status: string) => void;
  outreachLoading: boolean;
  outreachError: string | null;
  onSetOutreachStatus: (needsOutreach: boolean) => void;
  safetyLoading: boolean;
  safetyError: string | null;
  onSetSafetyStatus: (safetyCheckRequired: boolean, resolvedNote?: string) => void;
  onSaveSafetyDetails: (details: SafetyDetailPayload) => void;
}) {
  const cues = getReviewCues(patient);
  return (
    <div className="space-y-5">
      {/* Review cues + action */}
      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-sky-900 uppercase tracking-wide">Review cues</h3>
        {cues.length > 0 ? (
          <ul className="space-y-2">
            {cues.map((cue) => (
              <li key={cue} className="flex gap-2 text-sm leading-6 text-sky-900">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-sky-900">No immediate review cues are shown for this record.</p>
        )}
        {patient.imported && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-sky-200">
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              patient.reviewStatus === "Reviewed"
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-amber-200 bg-amber-50 text-amber-800"
            )}>
              {patient.reviewStatus || "Pending review"}
            </span>
            <button
              type="button"
              disabled={reviewLoading}
              onClick={() => { onSetReviewStatus(patient.reviewStatus !== "Reviewed" ? "reviewed" : "pending_review"); }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                patient.reviewStatus !== "Reviewed"
                  ? "bg-[#0B5C6C] text-white hover:bg-[#0B4A57]"
                  : "border border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100"
              )}
            >
              {reviewLoading ? "Saving…" : patient.reviewStatus !== "Reviewed" ? "Mark as reviewed" : "Set back to pending review"}
            </button>
            {reviewError && (
              <p className="w-full text-sm text-red-600">{reviewError}</p>
            )}
          </div>
        )}
      </section>

      {/* Outreach flag */}
      {patient.imported && (
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-orange-900 uppercase tracking-wide">Outreach</h3>
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              patient.needsOutreach
                ? "border border-orange-300 bg-orange-100 text-orange-900"
                : "border border-gray-200 bg-gray-100 text-gray-600"
            )}>
              {patient.needsOutreach ? "Needs outreach" : "No outreach needed"}
            </span>
            <button
              type="button"
              disabled={outreachLoading}
              onClick={() => onSetOutreachStatus(!patient.needsOutreach)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                patient.needsOutreach
                  ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  : "bg-[#0B5C6C] text-white hover:bg-[#0B4A57]"
              )}
            >
              {outreachLoading ? "Saving…" : patient.needsOutreach ? "Clear outreach flag" : "Mark needs outreach"}
            </button>
            {outreachError && (
              <p className="w-full text-sm text-red-600">{outreachError}</p>
            )}
          </div>
        </section>
      )}

      {/* Admin caution / safety check */}
      {patient.imported && (
        <AdminCautionSection
          key={patient.msid}
          patient={patient}
          loading={safetyLoading}
          error={safetyError}
          onToggleRequired={onSetSafetyStatus}
          onSaveDetails={onSaveSafetyDetails}
        />
      )}
    </div>
  );
}

function RecordTab({
  patient,
  nhiVisible,
  nhiReason,
  setNhiReason,
  onReveal,
}: {
  patient: DrawerPatient;
  nhiVisible: boolean;
  nhiReason: string;
  setNhiReason: (v: string) => void;
  onReveal: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Patient details</h3>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">MSID</dt>
            <dd className="mt-1 max-w-full break-all font-mono text-base text-[#0B5C6C]">{patient.msid}</dd>
          </div>
          <FieldRow label="Date of birth" value={patient.dob} />
          <FieldRow label="Phone" value={patient.phone} />
          <FieldRow label="Email" value={patient.email} />
          <div className="sm:col-span-2">
            <FieldRow label="Address" value={patient.address} />
          </div>
          <FieldRow
            label="Segment"
            value={
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                {patient.segment}
              </span>
            }
          />
          <FieldRow label="Registration date" value={patient.registrationDate} />
          {patient.imported && (
            <>
              <FieldRow label="Entitlement programme" value={safeValue(patient.fundedBy)} />
              <FieldRow label="Import batch ID" value={<MonoValue value={safeValue(patient.importBatchId)} />} />
              <FieldRow label="Review status" value={safeValue(patient.reviewStatus)} />
            </>
          )}
        </dl>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Equipment</h3>
        <EquipmentTab patient={patient} />
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Entitlement &amp; funding</h3>
        <EntitlementTab patient={patient} />
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Orders</h3>
        <OrdersTab patient={patient} />
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">NHI</h3>
        <NhiTab
          patient={patient}
          nhiVisible={nhiVisible}
          nhiReason={nhiReason}
          setNhiReason={setNhiReason}
          onReveal={onReveal}
        />
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Portal account</h3>
        <AccountTab msid={patient.msid} />
      </section>
    </div>
  );
}

const AREA_OPTIONS = ["All", "Review", "Outreach", "Admin Caution", "Notes", "Portal Account", "Import", "Other"] as const;

function HistoryTab({
  patientActivity,
  patientActivityState,
}: {
  patientActivity: PatientActivityEvent[];
  patientActivityState: "idle" | "loading" | "loaded" | "error";
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [areaFilter, setAreaFilter]   = useState<string>("All");
  const [timeFilter, setTimeFilter]   = useState<string>("all");
  const [sortOrder, setSortOrder]     = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize]       = useState<number>(20);
  const [page, setPage]               = useState<number>(1);

  function resetPage() { setPage(1); setExpandedIndex(null); }

  const now = new Date();

  const filtered = patientActivity.filter((event) => {
    if (areaFilter !== "All" && activityArea(event.action) !== areaFilter) return false;
    if (timeFilter !== "all" && event.timestamp) {
      const d = new Date(event.timestamp);
      if (timeFilter === "today") {
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === "7d") {
        const cut = new Date(now); cut.setDate(cut.getDate() - 7);
        if (d < cut) return false;
      } else if (timeFilter === "30d") {
        const cut = new Date(now); cut.setDate(cut.getDate() - 30);
        if (d < cut) return false;
      }
    }
    return true;
  });

  const sorted = sortOrder === "newest" ? filtered : [...filtered].reverse();
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const displaySlice = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectCls = "px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 focus:border-[#0B5C6C]/50";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Area</label>
          <select value={areaFilter} onChange={(e) => { setAreaFilter(e.target.value); resetPage(); }} className={selectCls}>
            {AREA_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Period</label>
          <select value={timeFilter} onChange={(e) => { setTimeFilter(e.target.value); resetPage(); }} className={selectCls}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Sort</label>
          <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as "newest" | "oldest"); resetPage(); }} className={selectCls}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Per page</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }} className={selectCls}>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <p className="text-xs text-gray-400 self-end pb-2">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {(patientActivityState === "idle" || patientActivityState === "loading") && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm text-gray-400">Loading activity…</p>
        </div>
      )}
      {patientActivityState === "error" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm text-amber-800">Activity temporarily unavailable.</p>
        </div>
      )}
      {patientActivityState === "loaded" && patientActivity.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm text-gray-400">No activity recorded for this patient yet.</p>
        </div>
      )}
      {patientActivityState === "loaded" && patientActivity.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
          <p className="text-sm text-gray-500">No events match the current filters.</p>
          <button
            type="button"
            onClick={() => { setAreaFilter("All"); setTimeFilter("all"); resetPage(); }}
            className="text-sm font-medium text-[#0B5C6C] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {patientActivityState === "loaded" && displaySlice.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Table header */}
              <div className="grid grid-cols-[120px_110px_170px_1fr_140px_80px_20px] gap-x-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                {["When", "Area", "Activity", "Details", "By", "Result", ""].map((h) => (
                  <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</span>
                ))}
              </div>

              <ul className="divide-y divide-gray-100">
                {displaySlice.map((event, i) => {
                  const area = activityArea(event.action);
                  const isExpanded = expandedIndex === i;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : i)}
                        className="w-full grid grid-cols-[120px_110px_170px_1fr_140px_80px_20px] gap-x-3 items-center px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatNzDateTimeShort(event.timestamp)}
                        </span>
                        <span>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border whitespace-nowrap",
                            AREA_CHIP[area] ?? AREA_CHIP['Other']
                          )}>
                            {area}
                          </span>
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {event.label}
                        </span>
                        <span className="text-xs text-gray-600 truncate">
                          {event.details ?? <span className="text-gray-400 italic">—</span>}
                        </span>
                        <span
                          className="text-xs text-gray-500 truncate"
                          title={event.adminEmail ?? undefined}
                        >
                          {event.adminEmail ?? "—"}
                        </span>
                        <span>
                          {event.result && (
                            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
                              {event.result}
                            </span>
                          )}
                        </span>
                        <svg
                          className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", isExpanded && "rotate-180")}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pt-2 pb-3 bg-gray-50 border-t border-gray-100">
                          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-xs">
                            <div>
                              <dt className="font-medium text-gray-500 uppercase tracking-wide">Action code</dt>
                              <dd className="text-gray-700 font-mono mt-0.5 break-all">{event.action}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500 uppercase tracking-wide">Timestamp</dt>
                              <dd className="text-gray-700 mt-0.5">{formatNzDateTime(event.timestamp)}</dd>
                            </div>
                            {event.adminEmail && (
                              <div>
                                <dt className="font-medium text-gray-500 uppercase tracking-wide">Admin</dt>
                                <dd className="text-gray-700 mt-0.5 break-all">{event.adminEmail}</dd>
                              </div>
                            )}
                            {event.result && (
                              <div>
                                <dt className="font-medium text-gray-500 uppercase tracking-wide">Result</dt>
                                <dd className="text-gray-700 mt-0.5">{event.result}</dd>
                              </div>
                            )}
                            <div className="sm:col-span-2">
                              <dt className="font-medium text-gray-500 uppercase tracking-wide">Details</dt>
                              <dd className="text-gray-700 mt-0.5 whitespace-pre-wrap">
                                {event.details ?? "No extra details captured."}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Pagination footer — outside overflow-x-auto */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 gap-4">
            <p className="text-xs text-gray-500 shrink-0">
              Page {currentPage} of {totalPages}
              {filtered.length !== patientActivity.length
                ? ` · ${filtered.length} filtered`
                : ` · ${patientActivity.length} total`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600
                           hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600
                           hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
            <a
              href="/admin/audit"
              className="text-xs font-medium text-[#0B5C6C] hover:underline shrink-0 hidden sm:block"
            >
              Full audit log →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function EquipmentTab({ patient }: { patient: DrawerPatient }) {
  const { machine, mask } = patient;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Machine</h3>
        <dl className="grid gap-5 sm:grid-cols-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <FieldRow label="Brand"      value={machine.brand} />
          <FieldRow label="Model"      value={machine.model} />
          <FieldRow label="Serial"     value={machine.serial} />
          <FieldRow label="Device ID"  value={<MonoValue value={machine.deviceId} />} />
          <FieldRow label="Setup date" value={machine.setupDate} />
          <FieldRow label="Entitlement programme" value={machine.fundedBy} />
          {machine.safetyCheckOverdue && (
            <div className="sm:col-span-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Safety check overdue
              </span>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Use this as a staff visibility cue during patient review. No booking or outreach automation is triggered here.
              </p>
            </div>
          )}
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Mask</h3>
        {mask ? (
          <dl className="grid gap-5 sm:grid-cols-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <FieldRow label="Brand"       value={mask.brand} />
            <FieldRow label="Model"       value={mask.model} />
            <FieldRow label="Size"        value={mask.size} />
            <FieldRow label="Last issued" value={mask.lastIssued} />
          </dl>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
            <p className="text-base font-medium text-gray-700">No mask record imported</p>
            <p className="mt-1 text-sm text-gray-500">Review the import source or update the record when mask details are available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EntitlementTab({ patient }: { patient: DrawerPatient }) {
  const { funding } = patient;
  const pendingReview = funding.annualAllowance === 0 && patient.entitlement.length === 0;
  const remainingColor =
    funding.remainingAmount > 75
      ? "text-emerald-700"
      : funding.remainingAmount > 0
      ? "text-amber-700"
      : "text-gray-500";

  return (
    <div className="space-y-5">
      {pendingReview ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-900 uppercase tracking-wide">Funding review required</p>
          <p className="text-sm text-amber-800">
            Entitlement data is not yet available for this record. Staff review is required before funding amounts can be confirmed.
          </p>
          <p className="text-sm text-amber-700">
            Default Midland/Biomed allowance is $250 per eligible patient. Deduction and store ordering are Phase 3 — no amounts are applied automatically in this phase.
          </p>
        </div>
      ) : (
        /* Funding summary */
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Annual allowance</dt>
              <dd className="text-base font-semibold text-gray-800 mt-0.5">${funding.annualAllowance}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Used to date</dt>
              <dd className="text-base font-semibold text-gray-800 mt-0.5">${funding.usedAmount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Remaining</dt>
              <dd className={`text-base font-semibold mt-0.5 ${remainingColor}`}>${funding.remainingAmount}</dd>
            </div>
          </dl>
          <FieldRow
            label="Funding period"
            value={`${funding.fundingPeriodStart} – ${funding.fundingPeriodEnd}`}
          />
        </div>
      )}

      {/* Suggested remaining items */}
      {funding.suggestedItemsRemaining.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Can still supply</p>
          <div className="flex flex-wrap gap-2">
            {funding.suggestedItemsRemaining.map((item) => (
              <span
                key={item}
                className="inline-block text-sm font-medium px-3 py-1 rounded-full border border-[#0B5C6C] text-[#0B5C6C] bg-[#0B5C6C]/5"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Funding note — only shown when entitlement data is present */}
      {!pendingReview && funding.fundingNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-800">{funding.fundingNote}</p>
        </div>
      )}

      {/* Staff-only notice */}
      {!pendingReview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1">
          <p className="text-sm text-gray-600">
            Funding balance is visible to staff only and is not shown to patients.
          </p>
          <p className="text-sm text-gray-500">
            Store deduction and checkout are Phase 3 — no amounts are applied automatically in this phase.
          </p>
        </div>
      )}

      {!pendingReview && patient.entitlement.length > 0 && (
        <>
          <hr className="border-gray-200" />

          {/* Per-item entitlement cards */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Item entitlement</p>
            {patient.entitlement.map((item) => (
              <div key={item.item} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-base font-semibold text-gray-800">{item.item}</p>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <FieldRow label="Last reorder"  value={item.lastReorder} />
                  <FieldRow label="Next eligible" value={item.nextEligible} />
                  <FieldRow label="Usage / cap"   value={item.usageVsCap} />
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrdersTab({ patient }: { patient: DrawerPatient }) {
  if (patient.orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base text-gray-500">No orders yet</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {["Date", "Items", "Status", "Dispatched"].map((col) => (
              <th key={col} className="text-left py-3 pr-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {patient.orders.map((order) => (
            <tr key={order.id}>
              <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">{order.date}</td>
              <td className="py-3 pr-4 text-gray-700">{order.items}</td>
              <td className="py-3 pr-4">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
                  order.status === "Completed" ? "bg-emerald-100 text-emerald-800"
                  : order.status === "Pending"   ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-700"
                )}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 text-gray-700 whitespace-nowrap">{order.dispatched}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotesTab({
  noteText,
  setNoteText,
  notes,
  notesLoading,
  notesError,
  noteSaving,
  editingNoteId,
  editText,
  setEditText,
  deletingNoteId,
  deleteConfirm,
  setDeleteConfirm,
  noteActionLoading,
  noteActionError,
  onAdd,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  notes: PersistedNote[];
  notesLoading: boolean;
  notesError: string | null;
  noteSaving: boolean;
  editingNoteId: string | null;
  editText: string;
  setEditText: (v: string) => void;
  deletingNoteId: string | null;
  deleteConfirm: string;
  setDeleteConfirm: (v: string) => void;
  noteActionLoading: boolean;
  noteActionError: string | null;
  onAdd: () => void;
  onStartEdit: (noteId: string, body: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onStartDelete: (noteId: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const remaining = 1000 - noteText.length;
  return (
    <div className="space-y-5">
      {/* Add note input */}
      <div className="space-y-2">
        <label className="block text-base font-medium text-gray-700">Add a note</label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              if (noteText.trim() && !noteSaving) onAdd();
            }
          }}
          placeholder="Enter a staff note…"
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base text-gray-800
                     focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                     placeholder:text-gray-400 min-h-[100px]"
        />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className={cn("block text-xs", remaining < 100 ? "text-amber-600" : "text-gray-400")}>
              {remaining} characters remaining
            </span>
            <span className="block text-xs text-gray-400">Press Cmd/Ctrl + Enter to add.</span>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={!noteText.trim() || noteSaving}
            className="bg-[#0B5C6C] text-white text-base font-medium px-5 py-2.5 rounded-lg min-h-[44px]
                       hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {noteSaving ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>

      {/* Note list */}
      {notesLoading ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm text-gray-500">Loading notes…</p>
        </div>
      ) : notesError && notes.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm text-amber-800">Notes temporarily unavailable.</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm text-gray-500">No admin notes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Staff notes</h4>

          {noteActionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{noteActionError}</p>
            </div>
          )}

          {notes.map((note) => {
            const isEditing = editingNoteId === note.note_id;
            const isDeleting = deletingNoteId === note.note_id;

            return (
              <div key={note.note_id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-800
                                 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onSaveEdit}
                        disabled={!editText.trim() || noteActionLoading}
                        className="bg-[#0B5C6C] text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[36px]
                                   hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {noteActionLoading ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        disabled={noteActionLoading}
                        className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 min-h-[36px] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Read / delete-confirm mode ── */
                  <>
                    <p className="text-base text-gray-800 whitespace-pre-wrap">{note.body}</p>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">
                        {note.created_by_email ?? "Staff"} · {formatNzDateTime(note.created_at)}
                        {note.is_edited && note.updated_at && (
                          <span className="ml-1 text-gray-400">· Edited {formatNzDateTime(note.updated_at)}</span>
                        )}
                      </p>
                      {note.is_owner && !isDeleting && (
                        <div className="flex gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => onStartEdit(note.note_id, note.body)}
                            className="text-sm font-medium text-[#0B5C6C] hover:text-[#0B5C6C]/80 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartDelete(note.note_id)}
                            className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {isDeleting && (
                      /* ── Delete confirmation panel ── */
                      <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-3 space-y-3">
                        <p className="text-sm font-medium text-red-800">
                          This note will be removed from the Notes tab. A deletion record is retained for audit/history.
                        </p>
                        <label className="block text-sm text-red-700">
                          Type <span className="font-mono font-semibold">DELETE</span> to confirm:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          autoFocus
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-gray-800
                                     focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={onConfirmDelete}
                            disabled={deleteConfirm !== "DELETE" || noteActionLoading}
                            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[36px]
                                       hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {noteActionLoading ? "Deleting…" : "Delete note"}
                          </button>
                          <button
                            type="button"
                            onClick={onCancelDelete}
                            disabled={noteActionLoading}
                            className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 min-h-[36px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NhiTab({
  patient,
  nhiVisible,
  nhiReason,
  setNhiReason,
  onReveal,
}: {
  patient: DrawerPatient;
  nhiVisible: boolean;
  nhiReason: string;
  setNhiReason: (v: string) => void;
  onReveal: () => void;
}) {
  if (patient.imported) {
    return (
      <div className="space-y-5">
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">NHI</p>
          <p className="text-base text-gray-700">
            NHI is stored securely. Admin reveal is not enabled in this MVP.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-5">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">NHI</p>
        <p className="text-3xl font-mono font-semibold text-gray-800 tracking-widest">
          {nhiVisible ? patient.nhiActual : patient.nhiMasked}
        </p>
      </div>

      {!nhiVisible && (
        <div className="space-y-3">
          <div>
            <label htmlFor="nhi-reason" className="block text-base font-medium text-gray-700 mb-1">
              Reason for access
            </label>
            <select
              id="nhi-reason"
              value={nhiReason}
              onChange={(e) => setNhiReason(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent bg-white"
            >
              <option value="">Select a reason</option>
              {NHI_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onReveal}
            disabled={!nhiReason}
            className="bg-[#0B5C6C] text-white text-base font-medium px-5 py-2.5 rounded-lg min-h-[44px]
                       hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reveal NHI
          </button>
        </div>
      )}

      <p className="text-sm text-gray-500">Your NHI is encrypted. Access is logged.</p>
    </div>
  );
}

interface PortalAccountLink {
  username:       string;
  accountStatus:  string;
  passwordStatus: string;
  twoFa:          boolean;
  createdAt:      string;
}

type AccountLoadState = "loading" | "loaded" | "none" | "error";

function AccountTab({ msid }: { msid: string }) {
  const [state, setState]   = useState<AccountLoadState>("loading");
  const [account, setAccount] = useState<PortalAccountLink | null>(null);

  useEffect(() => {
    setState("loading");
    fetch(`/api/admin/portal-accounts?msid=${encodeURIComponent(msid)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const payload = data as Record<string, unknown>;
        if (payload.account === null) {
          setState("none");
        } else if (payload.account && typeof payload.account === "object") {
          const a = payload.account as Record<string, unknown>;
          setAccount({
            username:       typeof a.id === "string" ? a.id : "",
            accountStatus:  typeof a.accountStatus === "string" ? a.accountStatus : "unknown",
            passwordStatus: typeof a.passwordStatus === "string" ? a.passwordStatus : "unknown",
            twoFa:          a.twoFa === true,
            createdAt:      typeof a.createdAt === "string" ? a.createdAt : "",
          });
          setState("loaded");
        } else {
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }, [msid]);

  if (state === "loading") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-base font-medium text-gray-700">Loading portal account…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-base font-medium text-amber-900">Portal account status temporarily unavailable.</p>
      </div>
    );
  }

  if (state === "none" || !account) {
    return (
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1">
        <p className="text-sm font-medium text-gray-700">No portal account linked.</p>
        <p className="text-sm text-gray-500">This patient does not have a portal login account.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Username</dt>
          <dd className="mt-0.5 font-mono text-sm text-gray-800">{account.username}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account</dt>
          <dd className="mt-1">
            {account.accountStatus === "active" ? (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>
            ) : account.accountStatus === "locked" ? (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">Locked</span>
            ) : (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Unknown</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Password</dt>
          <dd className="mt-1">
            {account.passwordStatus === "temp" ? (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Temp</span>
            ) : account.passwordStatus === "changed" ? (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Changed</span>
            ) : (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Unknown</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">2FA</dt>
          <dd className="mt-1">
            {account.twoFa ? (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Enabled</span>
            ) : (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Not enabled</span>
            )}
          </dd>
        </div>
        {account.createdAt && (
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account created</dt>
            <dd className="mt-0.5 text-sm text-gray-700">{account.createdAt}</dd>
          </div>
        )}
      </dl>
      {account.passwordStatus === "temp" && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-amber-900">Temporary password active</p>
          <p className="text-xs text-amber-800">
            Original temporary password cannot be retrieved. Use Reset Password to generate a new temporary password.
          </p>
        </div>
      )}
      <div className="pt-1">
        <a
          href={`/admin/portal-accounts?msid=${encodeURIComponent(msid)}`}
          className="inline-block text-sm font-medium text-[#0B5C6C] border border-[#0B5C6C]/40 rounded-lg px-4 py-2 hover:bg-[#0B5C6C]/5 transition-colors"
        >
          Open Portal Account
        </a>
      </div>
    </section>
  );
}

export function PatientDrawer({ isOpen, onClose, msid, patientName, onReviewStatusChange, onOutreachChange, onSafetyChange }: PatientDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("work");
  const [nhiVisible, setNhiVisible]   = useState(false);
  const [nhiReason, setNhiReason]     = useState("");
  const [noteText, setNoteText]       = useState("");
  const [persistedNotes, setPersistedNotes] = useState<PersistedNote[]>([]);
  const [notesLoading, setNotesLoading]     = useState(false);
  const [notesError, setNotesError]         = useState<string | null>(null);
  const [noteSaving, setNoteSaving]         = useState(false);
  const [editingNoteId, setEditingNoteId]   = useState<string | null>(null);
  const [editText, setEditText]             = useState("");
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [noteActionLoading, setNoteActionLoading] = useState(false);
  const [noteActionError, setNoteActionError]     = useState<string | null>(null);
  const [importedPatient, setImportedPatient] = useState<DrawerPatient | null>(null);
  const [importedLoading, setImportedLoading] = useState(false);
  const [importedError, setImportedError]     = useState<string | null>(null);
  const [reviewLoading, setReviewLoading]     = useState(false);
  const [reviewError, setReviewError]         = useState<string | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError]     = useState<string | null>(null);
  const [safetyLoading, setSafetyLoading]     = useState(false);
  const [safetyError, setSafetyError]         = useState<string | null>(null);
  const [patientActivity, setPatientActivity]           = useState<PatientActivityEvent[]>([]);
  const [patientActivityState, setPatientActivityState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const nhiTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityFetchedRef       = useRef(false);

  const demoData = msid ? (DEMO_DATA[msid] ?? null) : null;
  const patient: DrawerPatient | null = msid
    ? importedPatient ?? (!importedLoading && demoData ? { ...demoData, name: patientName ?? demoData.name } : null)
    : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setNhiVisible(false);
      setNhiReason("");
      setActiveTab("work");
      setEditingNoteId(null);
      setEditText("");
      setDeletingNoteId(null);
      setDeleteConfirm("");
      setNoteActionError(null);
      setReviewError(null);
      setReviewLoading(false);
      setOutreachError(null);
      setOutreachLoading(false);
      setSafetyError(null);
      setSafetyLoading(false);
      if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    setNoteText("");
    setPersistedNotes([]);
    setNotesError(null);
    setEditingNoteId(null);
    setEditText("");
    setDeletingNoteId(null);
    setDeleteConfirm("");
    setNoteActionError(null);
    setImportedPatient(null);
    setImportedError(null);
    setReviewError(null);
    setReviewLoading(false);
    setOutreachError(null);
    setOutreachLoading(false);
    setSafetyError(null);
    setSafetyLoading(false);
    setPatientActivity([]);
    setPatientActivityState("idle");
    activityFetchedRef.current = false;
  }, [msid]);

  useEffect(() => {
    if (!isOpen || !msid) return;
    let cancelled = false;
    const selectedMsid = msid;

    async function loadImportedPatient() {
      setImportedLoading(true);
      setImportedError(null);
      try {
        const res = await fetch(`/api/admin/patients?msid=${encodeURIComponent(selectedMsid)}`, { cache: "no-store", credentials: "include" });
        if (!res.ok) throw new Error("Unable to load patient");
        const detail = (await res.json()) as ImportedPatientDetail;
        if (!cancelled) setImportedPatient(makeImportedPatient(detail));
      } catch {
        if (!cancelled) {
          setImportedPatient(null);
          setImportedError(demoData ? null : "Patient details could not be loaded.");
        }
      } finally {
        if (!cancelled) setImportedLoading(false);
      }
    }

    loadImportedPatient();
    return () => {
      cancelled = true;
    };
  }, [isOpen, msid, demoData]);

  useEffect(() => {
    return () => { if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!isOpen || !msid || (activeTab !== "work" && activeTab !== "history")) return;
    if (activityFetchedRef.current) return;
    activityFetchedRef.current = true;
    let cancelled = false;
    setPatientActivityState("loading");
    fetch(`/api/admin/patients/activity?msid=${encodeURIComponent(msid)}&limit=100`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const payload = data as Record<string, unknown>;
        if (Array.isArray(payload.activity)) {
          setPatientActivity(payload.activity as PatientActivityEvent[]);
          setPatientActivityState("loaded");
        } else {
          setPatientActivityState("error");
        }
      })
      .catch(() => { if (!cancelled) setPatientActivityState("error"); });
    return () => { cancelled = true; };
  }, [isOpen, msid, activeTab]);

  useEffect(() => {
    if (!isOpen || !msid || activeTab !== "notes") return;
    let cancelled = false;
    setNotesLoading(true);
    setNotesError(null);
    fetch(`/api/admin/patients/notes?msid=${encodeURIComponent(msid)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const payload = data as Record<string, unknown>;
        if (Array.isArray(payload.notes)) {
          setPersistedNotes(payload.notes as PersistedNote[]);
        } else {
          setNotesError("Notes could not be loaded.");
        }
      })
      .catch(() => { if (!cancelled) setNotesError("Notes could not be loaded."); })
      .finally(() => { if (!cancelled) setNotesLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, msid, activeTab]);

  function handleRevealNhi() {
    if (!nhiReason || !patient || patient.imported) return;
    setNhiVisible(true);
    if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current);
    nhiTimerRef.current = setTimeout(() => setNhiVisible(false), 30000);
  }

  function addOptimisticActivity(label: string, action: string, details?: string) {
    const event: PatientActivityEvent = {
      timestamp: new Date().toISOString(),
      label,
      action,
      adminEmail: null,
      result: 'attempted',
      ...(details !== undefined && { details }),
    };
    setPatientActivity((prev) => [event, ...prev]);
    setPatientActivityState('loaded');
    activityFetchedRef.current = true;
  }

  async function handleAddNote() {
    if (!noteText.trim() || !patient || noteSaving) return;
    setNoteSaving(true);
    setNotesError(null);
    try {
      const res = await fetch("/api/admin/patients/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ msid: patient.msid, body: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = (await res.json()) as Record<string, unknown>;
      const note = data.note as PersistedNote;
      setPersistedNotes((prev) => [note, ...prev]);
      setNoteText("");
    } catch {
      setNotesError("Note could not be saved. Please try again.");
    } finally {
      setNoteSaving(false);
    }
  }

  function handleStartEdit(noteId: string, body: string) {
    setEditingNoteId(noteId);
    setEditText(body);
    setDeletingNoteId(null);
    setDeleteConfirm("");
    setNoteActionError(null);
  }

  function handleCancelEdit() {
    setEditingNoteId(null);
    setEditText("");
    setNoteActionError(null);
  }

  async function handleSaveEdit() {
    if (!patient || !editingNoteId || !editText.trim() || noteActionLoading) return;
    setNoteActionLoading(true);
    setNoteActionError(null);
    try {
      const res = await fetch("/api/admin/patients/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ msid: patient.msid, note_id: editingNoteId, body: editText.trim() }),
      });
      if (!res.ok) {
        const err = (await res.json()) as Record<string, unknown>;
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      const now = new Date().toISOString();
      setPersistedNotes((prev) =>
        prev.map((n) =>
          n.note_id === editingNoteId
            ? { ...n, body: editText.trim(), is_edited: true, updated_at: now }
            : n
        )
      );
      setEditingNoteId(null);
      setEditText("");
    } catch (err) {
      setNoteActionError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setNoteActionLoading(false);
    }
  }

  function handleStartDelete(noteId: string) {
    setDeletingNoteId(noteId);
    setDeleteConfirm("");
    setEditingNoteId(null);
    setEditText("");
    setNoteActionError(null);
  }

  function handleCancelDelete() {
    setDeletingNoteId(null);
    setDeleteConfirm("");
    setNoteActionError(null);
  }

  async function handleConfirmDelete() {
    if (!patient || !deletingNoteId || deleteConfirm !== "DELETE" || noteActionLoading) return;
    setNoteActionLoading(true);
    setNoteActionError(null);
    try {
      const res = await fetch("/api/admin/patients/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ msid: patient.msid, note_id: deletingNoteId, confirmation: "DELETE" }),
      });
      if (!res.ok) {
        let message = "Delete failed";
        try {
          const err = (await res.json()) as Record<string, unknown>;
          if (typeof err.error === "string") message = err.error;
        } catch { /* empty or non-JSON error body */ }
        throw new Error(message);
      }
      const deletedId = deletingNoteId;
      setDeletingNoteId(null);
      setDeleteConfirm("");
      setPersistedNotes((prev) => prev.filter((n) => n.note_id !== deletedId));
    } catch (err) {
      setNoteActionError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setNoteActionLoading(false);
    }
  }

  async function handleSetReviewStatus(status: string) {
    if (!patient || reviewLoading) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/admin/patients/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ msid: patient.msid, review_status: status }),
      });
      if (!res.ok) {
        let message = "Update failed";
        try {
          const err = (await res.json()) as Record<string, unknown>;
          if (typeof err.error === "string") message = err.error;
        } catch { /* non-JSON error body */ }
        throw new Error(message);
      }
      const updatedMsid = patient.msid;
      setImportedPatient((prev) =>
        prev ? { ...prev, reviewStatus: humanizeLabel(status) } : prev
      );
      onReviewStatusChange?.(updatedMsid, status);
      addOptimisticActivity('Review status updated', 'PATIENT_REVIEW_STATUS_UPDATED', `Status set to: ${humanizeLabel(status)}`);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleSetOutreachStatus(needsOutreach: boolean) {
    if (!patient || outreachLoading) return;
    setOutreachLoading(true);
    setOutreachError(null);
    try {
      const res = await fetch("/api/admin/patients/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ msid: patient.msid, needs_outreach: needsOutreach }),
      });
      if (!res.ok) {
        let message = "Update failed";
        try {
          const err = (await res.json()) as Record<string, unknown>;
          if (typeof err.error === "string") message = err.error;
        } catch { /* non-JSON error body */ }
        throw new Error(message);
      }
      const updatedMsid = patient.msid;
      setImportedPatient((prev) =>
        prev ? { ...prev, needsOutreach } : prev
      );
      onOutreachChange?.(updatedMsid, needsOutreach);
      addOptimisticActivity('Outreach status updated', 'PATIENT_OUTREACH_STATUS_UPDATED', needsOutreach ? 'Outreach flag set' : 'Outreach flag cleared');
    } catch (err) {
      setOutreachError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setOutreachLoading(false);
    }
  }

  async function handleSetSafetyStatus(safetyCheckRequired: boolean, resolvedNote?: string) {
    if (!patient || safetyLoading) return;
    setSafetyLoading(true);
    setSafetyError(null);
    try {
      const body: Record<string, unknown> = { msid: patient.msid, safety_check_required: safetyCheckRequired };
      if (!safetyCheckRequired && resolvedNote !== undefined) body.safety_resolved_note = resolvedNote;
      const res = await fetch("/api/admin/patients/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let message = "Update failed";
        try {
          const err = (await res.json()) as Record<string, unknown>;
          if (typeof err.error === "string") message = err.error;
        } catch { /* non-JSON error body */ }
        throw new Error(message);
      }
      const updatedMsid = patient.msid;
      setImportedPatient((prev) =>
        prev ? {
          ...prev,
          safetyCheckRequired,
          ...(resolvedNote !== undefined && { safetyResolvedNote: resolvedNote }),
        } : prev
      );
      onSafetyChange?.(updatedMsid, safetyCheckRequired);
      addOptimisticActivity('Admin caution status updated', 'PATIENT_SAFETY_STATUS_UPDATED', safetyCheckRequired ? 'Safety check flag set' : resolvedNote ? 'Cleared with resolution note' : 'Safety check flag cleared');
    } catch (err) {
      setSafetyError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSafetyLoading(false);
    }
  }

  async function handleSaveSafetyDetails(details: SafetyDetailPayload) {
    if (!patient || safetyLoading) return;
    setSafetyLoading(true);
    setSafetyError(null);
    try {
      const res = await fetch("/api/admin/patients/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          msid:                  patient.msid,
          safety_caution_reason: details.reason,
          safety_severity:       details.severity,
          safety_due_date:       details.dueDate,
          safety_assigned_to:    details.assignedTo,
        }),
      });
      if (!res.ok) {
        let message = "Update failed";
        try {
          const err = (await res.json()) as Record<string, unknown>;
          if (typeof err.error === "string") message = err.error;
        } catch { /* non-JSON error body */ }
        throw new Error(message);
      }
      setImportedPatient((prev) =>
        prev ? {
          ...prev,
          safetyCautionReason: details.reason || undefined,
          safetySeverity: (details.severity as 'low' | 'medium' | 'high') || undefined,
          safetyDueDate:  details.dueDate  || undefined,
          safetyAssignedTo: details.assignedTo || undefined,
        } : prev
      );
      const updatedFields = [
        details.reason && 'reason',
        details.severity && 'severity',
        details.dueDate && 'due date',
        details.assignedTo && 'assigned-to',
      ].filter(Boolean).join(', ');
      addOptimisticActivity('Admin caution details updated', 'PATIENT_SAFETY_DETAILS_UPDATED', updatedFields ? `Updated: ${updatedFields}` : undefined);
    } catch (err) {
      setSafetyError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSafetyLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={patient?.name ?? "Patient details"}
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[940px] sm:max-w-[90vw] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-[#0B2A3C]">
              {patient?.name ?? "Patient"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="max-w-full break-all font-mono text-base text-[#0B5C6C]">
                {patient?.msid}
              </p>
              {patient?.imported && (
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                  Imported
                </span>
              )}
              {patient?.reviewStatus && patient.reviewStatus !== "—" && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  {humanizeLabel(patient.reviewStatus)}
                </span>
              )}
              {patient?.machine.safetyCheckOverdue && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  Safety check cue
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ml-4 shrink-0"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="border-b border-gray-200 shrink-0 overflow-x-auto">
          <nav className="flex min-w-max px-2" role="tablist" aria-label="Patient profile tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-base font-medium border-b-2 whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "border-[#0B5C6C] text-[#0B5C6C]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {importedLoading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-base font-medium text-gray-700">Loading imported patient details...</p>
              <p className="mt-1 text-sm text-gray-500">Fetching the imported record and linked equipment.</p>
            </div>
          ) : importedError && !patient ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-base font-medium text-amber-900">Unable to load imported patient</p>
              <p className="mt-1 text-sm text-amber-800">{importedError}</p>
            </div>
          ) : patient ? (
            <>
              {activeTab === "work" && (
                <WorkTab
                  patient={patient}
                  reviewLoading={reviewLoading}
                  reviewError={reviewError}
                  onSetReviewStatus={handleSetReviewStatus}
                  outreachLoading={outreachLoading}
                  outreachError={outreachError}
                  onSetOutreachStatus={handleSetOutreachStatus}
                  safetyLoading={safetyLoading}
                  safetyError={safetyError}
                  onSetSafetyStatus={handleSetSafetyStatus}
                  onSaveSafetyDetails={handleSaveSafetyDetails}
                />
              )}
              {activeTab === "record" && (
                <RecordTab
                  patient={patient}
                  nhiVisible={nhiVisible}
                  nhiReason={nhiReason}
                  setNhiReason={setNhiReason}
                  onReveal={handleRevealNhi}
                />
              )}
              {activeTab === "notes" && (
                <NotesTab
                  noteText={noteText}
                  setNoteText={setNoteText}
                  notes={persistedNotes}
                  notesLoading={notesLoading}
                  notesError={notesError}
                  noteSaving={noteSaving}
                  editingNoteId={editingNoteId}
                  editText={editText}
                  setEditText={setEditText}
                  deletingNoteId={deletingNoteId}
                  deleteConfirm={deleteConfirm}
                  setDeleteConfirm={setDeleteConfirm}
                  noteActionLoading={noteActionLoading}
                  noteActionError={noteActionError}
                  onAdd={handleAddNote}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onStartDelete={handleStartDelete}
                  onCancelDelete={handleCancelDelete}
                  onConfirmDelete={handleConfirmDelete}
                />
              )}
              {activeTab === "history" && (
                <HistoryTab
                  patientActivity={patientActivity}
                  patientActivityState={patientActivityState}
                />
              )}
            </>
          ) : (
            <p className="text-base text-gray-500">No patient selected.</p>
          )}
        </div>
      </div>
    </>
  );
}
