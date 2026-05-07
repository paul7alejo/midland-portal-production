"use client";

import { useState, useRef } from "react";
import type { ParsedPatient } from "@/lib/csv-import/patient-import";

type PreviewResult = {
  valid: ParsedPatient[];
  invalid: ParsedPatient[];
  totalRows: number;
  errorSummary: string[];
};
type ActiveTab = "valid" | "invalid";

// ─── Template headers ─────────────────────────────────────────────────────────

const TEMPLATE_HEADERS =
  "full_name,nhi,date_of_birth,email,phone,address," +
  "machine_brand,machine_model,machine_serial,machine_setup_date," +
  "mask_brand,mask_model,mask_size,funded_by";

const TEMPLATE_HEADERS_ARRAY = TEMPLATE_HEADERS.split(",");

// ─── CSV utilities ────────────────────────────────────────────────────────────

function escapeCSV(value: string): string {
  const s = value ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsvBlob(headers: string[], rows: string[][]): Blob {
  const lines = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ];
  return new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── NHI masking ─────────────────────────────────────────────────────────────

function maskNhi(nhi: string): string {
  if (!nhi) return "—";
  return nhi.slice(0, 3) + "****";
}

// ─── Patient row → CSV array (raw NHI — for valid/invalid exports only) ──────

function patientToRow(row: ParsedPatient): string[] {
  return [
    row.fullName,
    row.nhi,           // raw NHI included in data exports for staff import use
    row.dateOfBirth,
    row.email,
    row.phone,
    row.address,
    row.machine.brand,
    row.machine.model,
    row.machine.serial,
    row.machine.setupDate,
    row.mask.brand,
    row.mask.model,
    row.mask.size,
    row.machine.fundedBy,
  ];
}

// ─── Download handlers ────────────────────────────────────────────────────────

function downloadTemplate(): void {
  const blob = buildCsvBlob(TEMPLATE_HEADERS_ARRAY, []);
  triggerDownload(blob, "midland-patient-import-template.csv");
}

function downloadValidRows(rows: ParsedPatient[]): void {
  const blob = buildCsvBlob(
    TEMPLATE_HEADERS_ARRAY,
    rows.map(patientToRow)
  );
  triggerDownload(blob, "import-valid-rows.csv");
}

function downloadInvalidRows(rows: ParsedPatient[]): void {
  const headers = [...TEMPLATE_HEADERS_ARRAY, "errors"];
  const data = rows.map((row) => [...patientToRow(row), row.importErrors.join("; ")]);
  const blob = buildCsvBlob(headers, data);
  triggerDownload(blob, "import-invalid-rows.csv");
}

function downloadErrorReport(rows: ParsedPatient[]): void {
  // NHI is masked in this report — raw NHI must never appear here
  const headers = ["row", "name", "masked_nhi", "machine_serial", "errors"];
  const data = rows.map((row, i) => [
    String(i + 1),
    row.fullName,
    maskNhi(row.nhi),           // masked only
    row.machine.serial,
    row.importErrors.join("; "),
  ]);
  const blob = buildCsvBlob(headers, data);
  triggerDownload(blob, "import-error-report.csv");
}

// ─── UI components ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1 min-w-0">
      <span className={`text-3xl font-bold ${accent ?? "text-navy"}`}>{value}</span>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}

function ValidTable({ rows }: { rows: ParsedPatient[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No valid rows.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {["Name", "NHI", "DOB", "Phone", "Email", "Machine", "Funded by"].map((col) => (
              <th
                key={col}
                className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap text-xs"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.fullName || "—"}</td>
              <td className="px-4 py-3 font-mono text-gray-700">{maskNhi(row.nhi)}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.dateOfBirth || "—"}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.phone || "—"}</td>
              <td className="px-4 py-3 text-gray-700">{row.email || "—"}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.machine.model || "—"}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.machine.fundedBy || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvalidTable({ rows }: { rows: ParsedPatient[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No invalid rows.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {["Name", "NHI", "DOB", "Errors"].map((col) => (
              <th
                key={col}
                className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap text-xs"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.fullName || "—"}</td>
              <td className="px-4 py-3 font-mono text-gray-700">{maskNhi(row.nhi)}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.dateOfBirth || "—"}</td>
              <td className="px-4 py-3 text-red-700">{row.importErrors.join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Download button ──────────────────────────────────────────────────────────

function DownloadButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium
                 px-4 py-2 rounded-lg min-h-[36px] hover:border-[#0B5C6C] hover:text-[#0B5C6C]
                 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminImportPage() {
  const [csvText,      setCsvText]      = useState("");
  const [fileName,     setFileName]     = useState<string | null>(null);
  const [result,       setResult]       = useState<PreviewResult | null>(null);
  const [activeTab,    setActiveTab]    = useState<ActiveTab>("valid");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setCsvText(text);
    };
    reader.readAsText(file);
  }

  async function handlePreview() {
    if (!csvText.trim()) return;
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const res = await fetch('/api/admin/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });
      if (!res.ok) {
        setPreviewError('Validation failed. Try again.');
        return;
      }
      const data = await res.json();
      setResult({
        valid: data.valid,
        invalid: data.invalid,
        totalRows: data.totalRows,
        errorSummary: data.errorSummary,
      });
      setActiveTab("valid");
    } catch {
      setPreviewError('Validation failed. Try again.');
    } finally {
      setIsPreviewing(false);
    }
  }

  function handleClear() {
    setCsvText("");
    setFileName(null);
    setResult(null);
    setActiveTab("valid");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canPreview = csvText.trim().length > 0 && !isPreviewing;
  const canClear   = csvText.length > 0 || result !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy">Import Patients</h1>
        <p className="text-base text-gray-600 mt-1">Preview CSV before committing — Midland Sleep</p>
      </div>

      {/* Warning banner — always visible */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-sm text-amber-800 font-medium">
          Preview only — no data will be written to the system.
        </p>
      </div>

      {/* Error banner */}
      {previewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{previewError}</p>
        </div>
      )}

      {/* Input card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        {/* File upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Upload CSV file</label>
          <div className="flex items-center gap-3 flex-wrap">
            <label
              htmlFor="csv-file-input"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700
                         bg-white hover:border-[#0B5C6C] hover:text-[#0B5C6C] cursor-pointer transition-colors min-h-[40px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose file
            </label>
            <input
              id="csv-file-input"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="sr-only"
            />
            {fileName && (
              <span className="text-sm text-gray-600 font-medium">{fileName}</span>
            )}
          </div>
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm font-medium text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Paste textarea */}
        <div className="space-y-2">
          <label htmlFor="csv-paste" className="block text-sm font-semibold text-gray-700">
            Paste CSV
          </label>
          <textarea
            id="csv-paste"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="Paste CSV content here…"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm font-mono text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-[#0B5C6C] focus:border-transparent
                       placeholder:text-gray-400 resize-y"
          />
        </div>

        {/* Action buttons + template download */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview}
            className="bg-[#0B5C6C] text-white text-sm font-medium px-5 py-2.5 rounded-lg min-h-[40px]
                       hover:bg-[#0B5C6C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPreviewing ? 'Previewing…' : 'Preview CSV'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!canClear}
            className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg min-h-[40px]
                       hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <DownloadButton label="Download blank template" onClick={downloadTemplate} />
        </div>
      </div>

      {/* Results */}
      {result !== null && (
        <div className="space-y-5">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard label="Total rows" value={result.totalRows} />
            <SummaryCard
              label="Valid"
              value={result.valid.length}
              accent={result.valid.length > 0 ? "text-emerald-700" : "text-gray-500"}
            />
            <SummaryCard
              label="Invalid"
              value={result.invalid.length}
              accent={result.invalid.length > 0 ? "text-red-600" : "text-gray-500"}
            />
          </div>

          {/* CSV cleanup tools */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">CSV cleanup tools</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Download processed files for review or re-import. NHI is masked in the error report.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DownloadButton
                label="Download blank template"
                onClick={downloadTemplate}
              />
              <DownloadButton
                label={`Download valid rows (${result.valid.length})`}
                onClick={() => downloadValidRows(result.valid)}
                disabled={result.valid.length === 0}
              />
              <DownloadButton
                label={`Download invalid rows (${result.invalid.length})`}
                onClick={() => downloadInvalidRows(result.invalid)}
                disabled={result.invalid.length === 0}
              />
              <DownloadButton
                label={`Download error report (${result.invalid.length})`}
                onClick={() => downloadErrorReport(result.invalid)}
                disabled={result.invalid.length === 0}
              />
            </div>
          </div>

          {/* Tab bar + table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {(["valid", "invalid"] as ActiveTab[]).map((tab) => {
                  const count = tab === "valid" ? result.valid.length : result.invalid.length;
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? "border-[#0B5C6C] text-[#0B5C6C]"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab === "valid" ? "Valid rows" : "Invalid rows"}
                      <span
                        className={`inline-flex items-center justify-center rounded-full text-xs font-semibold px-2 py-0.5 min-w-[22px] ${
                          isActive ? "bg-[#0B5C6C] text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="p-4">
              {activeTab === "valid"
                ? <ValidTable rows={result.valid} />
                : <InvalidTable rows={result.invalid} />
              }
            </div>
          </div>

          {/* Error summary */}
          {result.errorSummary.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide">
                Error types found
              </h3>
              <ul className="space-y-1">
                {result.errorSummary.map((msg) => (
                  <li key={msg} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
