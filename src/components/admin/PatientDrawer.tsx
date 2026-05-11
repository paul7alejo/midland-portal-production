"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabId = "overview" | "equipment" | "entitlement" | "orders" | "notes" | "nhi";

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

interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface PatientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  msid: string | null;
  patientName?: string;
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
      annualAllowance: 150,
      usedAmount: 70,
      remainingAmount: 80,
      fundingPeriodStart: "1 Jan 2026",
      fundingPeriodEnd: "31 Dec 2026",
      suggestedItemsRemaining: ["Mask cushion", "Filters"],
      fundingNote: "Patient has remaining allowance. Full mask kit may exceed balance.",
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
    fundedBy: imported.funded_by,
  };
}

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "equipment",   label: "Equipment" },
  { id: "entitlement", label: "Entitlement" },
  { id: "orders",      label: "Orders" },
  { id: "notes",       label: "Notes" },
  { id: "nhi",         label: "NHI" },
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

function OverviewTab({ patient }: { patient: DrawerPatient }) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
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
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Equipment summary</h3>
        <dl className="grid gap-5 sm:grid-cols-2">
          <FieldRow
            label="Machine"
            value={`${patient.machine.brand} ${patient.machine.model}`}
          />
          <FieldRow
            label="Mask"
            value={
              patient.mask
                ? `${patient.mask.brand} ${patient.mask.model} (${patient.mask.size})`
                : "No mask record imported"
            }
          />
          {patient.imported && (
            <>
              <FieldRow label="Funded by" value={safeValue(patient.fundedBy)} />
              <FieldRow label="Import batch ID" value={<MonoValue value={safeValue(patient.importBatchId)} />} />
              <FieldRow label="Review status" value={safeValue(patient.reviewStatus)} />
            </>
          )}
        </dl>
      </section>
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
          <FieldRow label="Funded by"  value={machine.fundedBy} />
          {machine.safetyCheckOverdue && (
            <div className="sm:col-span-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Safety check overdue
              </span>
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
  const remainingColor =
    funding.remainingAmount > 75
      ? "text-emerald-700"
      : funding.remainingAmount > 0
      ? "text-amber-700"
      : "text-gray-500";

  return (
    <div className="space-y-5">
      {/* Funding summary */}
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

      {/* Funding note */}
      {funding.fundingNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-800">{funding.fundingNote}</p>
        </div>
      )}

      {/* Staff-only notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-sm text-gray-600">
          Funding balance is visible to staff only and is not shown to patients.
        </p>
      </div>

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
  savedNotes,
  onSave,
  editingNoteId,
  editText,
  setEditText,
  onStartEdit,
  onCancelEdit,
  onCommitEdit,
  onDelete,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  savedNotes: Note[];
  onSave: () => void;
  editingNoteId: string | null;
  editText: string;
  setEditText: (v: string) => void;
  onStartEdit: (noteId: string, text: string) => void;
  onCancelEdit: () => void;
  onCommitEdit: () => void;
  onDelete: (noteId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-sm text-amber-800">Staff only — these notes are never shown to the patient.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-base font-medium text-gray-700">Add note</label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Enter a staff note…"
          rows={4}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base text-gray-800
                     focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                     placeholder:text-gray-400 min-h-[100px]"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={!noteText.trim()}
          className="bg-[#0B5C6C] text-white text-base font-medium px-5 py-2.5 rounded-lg min-h-[44px]
                     hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save note
        </button>
      </div>

      {savedNotes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Saved notes</h4>
          {savedNotes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-xl p-4 space-y-2">
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onCommitEdit}
                      disabled={!editText.trim()}
                      className="bg-[#0B5C6C] text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[36px]
                                 hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 min-h-[36px] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base text-gray-800">{note.text}</p>
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <p className="text-sm text-gray-500">
                      {note.author} · {note.timestamp}
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => onStartEdit(note.id, note.text)}
                        className="text-sm font-medium text-[#0B5C6C] hover:text-[#0B5C6C]/80 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
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

export function PatientDrawer({ isOpen, onClose, msid, patientName }: PatientDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [nhiVisible, setNhiVisible]   = useState(false);
  const [nhiReason, setNhiReason]     = useState("");
  const [noteText, setNoteText]           = useState("");
  const [notesByMsid, setNotesByMsid]     = useState<Record<string, Note[]>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText]           = useState("");
  const [importedPatient, setImportedPatient] = useState<DrawerPatient | null>(null);
  const [importedLoading, setImportedLoading] = useState(false);
  const [importedError, setImportedError] = useState<string | null>(null);
  const nhiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const demoData = msid ? (DEMO_DATA[msid] ?? null) : null;
  const patient: DrawerPatient | null = msid
    ? demoData
      ? { ...demoData, name: patientName ?? demoData.name }
      : importedPatient
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
      setActiveTab("overview");
      setEditingNoteId(null);
      setEditText("");
      if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    setNoteText("");
    setEditingNoteId(null);
    setEditText("");
    setImportedPatient(null);
    setImportedError(null);
  }, [msid]);

  useEffect(() => {
    if (!isOpen || !msid || demoData) return;
    let cancelled = false;
    const selectedMsid = msid;

    async function loadImportedPatient() {
      setImportedLoading(true);
      setImportedError(null);
      try {
        const res = await fetch(`/api/admin/patients?msid=${encodeURIComponent(selectedMsid)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load imported patient");
        const detail = (await res.json()) as ImportedPatientDetail;
        if (!cancelled) setImportedPatient(makeImportedPatient(detail));
      } catch {
        if (!cancelled) {
          setImportedPatient(null);
          setImportedError("Imported patient details could not be loaded.");
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

  function handleRevealNhi() {
    if (!nhiReason || !patient || patient.imported) return;
    setNhiVisible(true);
    if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current);
    nhiTimerRef.current = setTimeout(() => setNhiVisible(false), 30000);
  }

  const currentNotes: Note[] = patient ? (notesByMsid[patient.msid] ?? []) : [];

  function handleSaveNote() {
    if (!noteText.trim() || !patient) return;
    const key = patient.msid;
    const newNote: Note = {
      id: String(Date.now()),
      text: noteText.trim(),
      author: "Staff (demo)",
      timestamp: new Date().toLocaleString("en-NZ"),
    };
    setNotesByMsid((prev) => ({ ...prev, [key]: [newNote, ...(prev[key] ?? [])] }));
    setNoteText("");
  }

  function handleStartEdit(noteId: string, text: string) {
    setEditingNoteId(noteId);
    setEditText(text);
  }

  function handleCancelEdit() {
    setEditingNoteId(null);
    setEditText("");
  }

  function handleCommitEdit() {
    if (!editingNoteId || !patient || !editText.trim()) return;
    const key = patient.msid;
    setNotesByMsid((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((n) =>
        n.id === editingNoteId ? { ...n, text: editText.trim() } : n
      ),
    }));
    setEditingNoteId(null);
    setEditText("");
  }

  function handleDeleteNote(noteId: string) {
    if (!patient) return;
    const key = patient.msid;
    setNotesByMsid((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((n) => n.id !== noteId),
    }));
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
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[680px] bg-white shadow-2xl flex flex-col transition-transform duration-300",
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
              {activeTab === "overview"    && <OverviewTab patient={patient} />}
              {activeTab === "equipment"   && <EquipmentTab patient={patient} />}
              {activeTab === "entitlement" && <EntitlementTab patient={patient} />}
              {activeTab === "orders"      && <OrdersTab patient={patient} />}
              {activeTab === "notes"       && (
                <NotesTab
                  noteText={noteText}
                  setNoteText={setNoteText}
                  savedNotes={currentNotes}
                  onSave={handleSaveNote}
                  editingNoteId={editingNoteId}
                  editText={editText}
                  setEditText={setEditText}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onCommitEdit={handleCommitEdit}
                  onDelete={handleDeleteNote}
                />
              )}
              {activeTab === "nhi" && (
                <NhiTab
                  patient={patient}
                  nhiVisible={nhiVisible}
                  nhiReason={nhiReason}
                  setNhiReason={setNhiReason}
                  onReveal={handleRevealNhi}
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
