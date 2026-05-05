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
  };
  entitlement: EntitlementItem[];
  orders: DrawerOrder[];
  nhiMasked: string;
  // nhiActual is never logged — only displayed after explicit reveal with audit trail
  nhiActual: string;
}

interface EntitlementItem {
  item: string;
  lastReorder: string;
  nextEligible: string;
  usageVsCap: string;
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
    nhiMasked: "ZZZ****",
    nhiActual: "ZZZ1234",
  },
};

function makeFallbackPatient(msid: string, name: string): DrawerPatient {
  return {
    msid,
    name,
    dob: "—",
    phone: "—",
    email: "—",
    address: "—",
    segment: "Active",
    registrationDate: "—",
    machine: {
      brand: "ResMed",
      model: "AirSense 10 AutoSet",
      serial: "—",
      deviceId: "—",
      setupDate: "—",
      fundedBy: "ACC",
      safetyCheckOverdue: false,
    },
    mask: {
      brand: "ResMed",
      model: "AirFit N20",
      size: "Medium",
      lastIssued: "—",
    },
    entitlement: [
      { item: "Mask cushion", lastReorder: "—", nextEligible: "—", usageVsCap: "—" },
      { item: "Headgear",     lastReorder: "—", nextEligible: "—", usageVsCap: "—" },
      { item: "Filters",      lastReorder: "—", nextEligible: "—", usageVsCap: "—" },
    ],
    orders: [],
    nhiMasked: "ZZZ****",
    nhiActual: "ZZZ0000",
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
    <div>
      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-base text-gray-800 mt-0.5">{value}</dd>
    </div>
  );
}

function OverviewTab({ patient }: { patient: DrawerPatient }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
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
  );
}

function EquipmentTab({ patient }: { patient: DrawerPatient }) {
  const { machine, mask } = patient;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Machine</h3>
        <dl className="grid gap-4 sm:grid-cols-2 bg-gray-50 rounded-xl p-4">
          <FieldRow label="Brand"      value={machine.brand} />
          <FieldRow label="Model"      value={machine.model} />
          <FieldRow label="Serial"     value={machine.serial} />
          <FieldRow label="Device ID"  value={machine.deviceId} />
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
        <dl className="grid gap-4 sm:grid-cols-2 bg-gray-50 rounded-xl p-4">
          <FieldRow label="Brand"       value={mask.brand} />
          <FieldRow label="Model"       value={mask.model} />
          <FieldRow label="Size"        value={mask.size} />
          <FieldRow label="Last issued" value={mask.lastIssued} />
        </dl>
      </div>
    </div>
  );
}

function EntitlementTab({ patient }: { patient: DrawerPatient }) {
  return (
    <div className="space-y-3">
      {patient.entitlement.map((item) => (
        <div key={item.item} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-base font-semibold text-gray-800">{item.item}</p>
          <dl className="grid grid-cols-3 gap-3">
            <FieldRow label="Last reorder"  value={item.lastReorder} />
            <FieldRow label="Next eligible" value={item.nextEligible} />
            <FieldRow label="Usage / cap"   value={item.usageVsCap} />
          </dl>
        </div>
      ))}
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
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  savedNotes: Note[];
  onSave: () => void;
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
            <div key={note.id} className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-base text-gray-800">{note.text}</p>
              <p className="text-sm text-gray-500">
                {note.author} · {note.timestamp}
              </p>
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
  const [noteText, setNoteText]       = useState("");
  const [savedNotes, setSavedNotes]   = useState<Note[]>([]);
  const nhiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const demoData = msid ? (DEMO_DATA[msid] ?? null) : null;
  const patient: DrawerPatient | null = msid
    ? demoData
      ? { ...demoData, name: patientName ?? demoData.name }
      : makeFallbackPatient(msid, patientName ?? msid)
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
      if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => { if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current); };
  }, []);

  function handleRevealNhi() {
    if (!nhiReason || !patient) return;
    // Audit log fires BEFORE NHI is revealed — NHI value never passed to log
    console.log({
      action: "NHI_REVEAL_ADMIN",
      staff_id: "staff-session",
      patient_msid: patient.msid,
      patient_nhi_masked: patient.nhiMasked,
      reason: nhiReason,
      timestamp: new Date().toISOString(),
      org_id: "midland-sleep",
    });
    setNhiVisible(true);
    if (nhiTimerRef.current) clearTimeout(nhiTimerRef.current);
    nhiTimerRef.current = setTimeout(() => setNhiVisible(false), 30000);
  }

  function handleSaveNote() {
    if (!noteText.trim()) return;
    setSavedNotes((prev) => [
      {
        id: String(Date.now()),
        text: noteText.trim(),
        author: "Staff (demo)",
        timestamp: new Date().toLocaleString("en-NZ"),
      },
      ...prev,
    ]);
    setNoteText("");
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
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-2xl font-semibold text-[#0B2A3C]">
              {patient?.name ?? "Patient"}
            </h2>
            <p className="font-mono text-[#0B5C6C] text-base mt-0.5">
              {patient?.msid}
            </p>
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
          {patient ? (
            <>
              {activeTab === "overview"    && <OverviewTab patient={patient} />}
              {activeTab === "equipment"   && <EquipmentTab patient={patient} />}
              {activeTab === "entitlement" && <EntitlementTab patient={patient} />}
              {activeTab === "orders"      && <OrdersTab patient={patient} />}
              {activeTab === "notes"       && (
                <NotesTab
                  noteText={noteText}
                  setNoteText={setNoteText}
                  savedNotes={savedNotes}
                  onSave={handleSaveNote}
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
