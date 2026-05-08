"use client";

import { useState, useRef } from "react";
import type { ParsedPatient, ReviewRow } from "@/lib/csv-import/patient-import";
import type { ImportManifestRow, PreflightState } from "@/lib/csv-import/import-preflight";
import { computePreflightState, buildManifest } from "@/lib/csv-import/import-preflight";

type PreviewResult = {
  valid: ParsedPatient[];
  invalid: ParsedPatient[];
  totalRows: number;
  errorSummary: string[];
  reviewRows: ReviewRow[];
  readiness: 'ready' | 'review_required' | 'not_ready';
  dupNhiGroupCount: number;
  dupSerialGroupCount: number;
  dupContactWarnCount: number;
};
type ActiveTab = "valid" | "invalid";
type ApprovalState = "approval_blocked" | "approval_review_required" | "approval_ready";
type ApprovalChecklistStatus = "passed" | "needs_review" | "blocked" | "pending";

type ApprovalChecklistRow = {
  checkItem: string;
  requiredBeforeImport: "Yes";
  status: ApprovalChecklistStatus;
  owner: string;
  notes: string;
};

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

function downloadReviewReport(reviewRows: ReviewRow[]): void {
  const headers = ["row","name","masked_nhi","machine_serial","issue_type","issue_detail","severity"];
  const data = reviewRows.map((r) => [
    String(r.rowNumber),
    r.name,
    r.maskedNhi,
    r.machineSerial,
    r.issueType,
    r.issueDetail,
    r.severity,
  ]);
  triggerDownload(buildCsvBlob(headers, data), "import-review-report.csv");
}

function downloadImportManifest(manifest: ImportManifestRow[]): void {
  const headers = ["row","name","masked_nhi","funded_by","machine_serial","validation_status","preflight_status","issues"];
  const data = manifest.map((r) => [
    String(r.rowNumber),
    r.name,
    r.maskedNhi,
    r.fundedBy,
    r.machineSerial,
    r.validationStatus,
    r.preflightStatus,
    r.issues,
  ]);
  triggerDownload(buildCsvBlob(headers, data), "import-manifest.csv");
}

function downloadSignOffChecklist(): void {
  const headers = ["check_item","status","owner","notes"];
  const rows: string[][] = [
    ["CSV structure validated",          "Pending", "Import reviewer", ""],
    ["Invalid rows reviewed",            "Pending", "Import reviewer", ""],
    ["Duplicate NHI reviewed",           "Pending", "Import reviewer", ""],
    ["Duplicate machine serial reviewed","Pending", "Import reviewer", ""],
    ["Shared contact details reviewed",  "Pending", "Import reviewer", ""],
    ["Funding values reviewed",          "Pending", "Import reviewer", ""],
    ["Machine serials confirmed",        "Pending", "Import reviewer", ""],
    ["NHI exposure minimized",           "Pending", "Import reviewer", ""],
    ["Real import scope approved",       "Pending", "Midland owner",   ""],
    ["Rollback approach approved",       "Pending", "Midland owner",   ""],
    ["Midland owner sign-off received",  "Pending", "Midland owner",   ""],
  ];
  triggerDownload(buildCsvBlob(headers, rows), "import-preflight-signoff.csv");
}

function getApprovalState(result: PreviewResult, preflightState: PreflightState): ApprovalState {
  const hasHardBlockers =
    preflightState === "blocked" ||
    result.invalid.length > 0 ||
    result.dupNhiGroupCount > 0 ||
    result.dupSerialGroupCount > 0;
  if (hasHardBlockers) return "approval_blocked";

  const hasReviewItems =
    preflightState === "review_required" ||
    result.dupContactWarnCount > 0 ||
    result.reviewRows.length > 0;
  if (hasReviewItems) return "approval_review_required";

  return "approval_ready";
}

function getApprovalRecommendation(approvalState: ApprovalState): string {
  if (approvalState === "approval_blocked") {
    return "Do not approve this batch. Resolve invalid rows and duplicate NHI or machine serial conflicts first.";
  }
  if (approvalState === "approval_review_required") {
    return "Review shared contact details before approving this batch for future import execution.";
  }
  return "This batch is ready for Midland owner review. Import execution is still not enabled.";
}

function buildApprovalChecklist(result: PreviewResult): ApprovalChecklistRow[] {
  return [
    {
      checkItem: "CSV structure reviewed",
      requiredBeforeImport: "Yes",
      status: "passed",
      owner: "Import reviewer",
      notes: "",
    },
    {
      checkItem: "Invalid rows reviewed",
      requiredBeforeImport: "Yes",
      status: result.invalid.length > 0 ? "blocked" : "passed",
      owner: "Import reviewer",
      notes: result.invalid.length > 0 ? `${result.invalid.length} invalid row(s) must be resolved.` : "",
    },
    {
      checkItem: "Duplicate NHI reviewed",
      requiredBeforeImport: "Yes",
      status: result.dupNhiGroupCount > 0 ? "blocked" : "passed",
      owner: "Import reviewer",
      notes: result.dupNhiGroupCount > 0 ? `${result.dupNhiGroupCount} duplicate NHI group(s) must be resolved.` : "",
    },
    {
      checkItem: "Duplicate machine serial reviewed",
      requiredBeforeImport: "Yes",
      status: result.dupSerialGroupCount > 0 ? "blocked" : "passed",
      owner: "Import reviewer",
      notes: result.dupSerialGroupCount > 0 ? `${result.dupSerialGroupCount} duplicate serial group(s) must be resolved.` : "",
    },
    {
      checkItem: "Shared contact details reviewed",
      requiredBeforeImport: "Yes",
      status: result.dupContactWarnCount > 0 ? "needs_review" : "passed",
      owner: "Import reviewer",
      notes: result.dupContactWarnCount > 0 ? `${result.dupContactWarnCount} contact warning(s) need review.` : "",
    },
    {
      checkItem: "Funding values reviewed",
      requiredBeforeImport: "Yes",
      status: result.reviewRows.length > 0 ? "needs_review" : "passed",
      owner: "Import reviewer",
      notes: result.reviewRows.length > 0 ? "Review-row issues remain in this batch." : "",
    },
    {
      checkItem: "Machine serials confirmed",
      requiredBeforeImport: "Yes",
      status: result.dupSerialGroupCount > 0 ? "blocked" : "passed",
      owner: "Import reviewer",
      notes: result.dupSerialGroupCount > 0 ? "Resolve duplicate machine serial groups before sign-off." : "",
    },
    {
      checkItem: "NHI exposure minimized",
      requiredBeforeImport: "Yes",
      status: "passed",
      owner: "Import reviewer",
      notes: "Approval UI and downloads do not include raw NHI.",
    },
    {
      checkItem: "Midland owner sign-off received",
      requiredBeforeImport: "Yes",
      status: "pending",
      owner: "Midland owner",
      notes: "",
    },
    {
      checkItem: "Real import implementation approved separately",
      requiredBeforeImport: "Yes",
      status: "pending",
      owner: "Midland owner",
      notes: "",
    },
  ];
}

function downloadApprovalChecklist(rows: ApprovalChecklistRow[]): void {
  const headers = ["check_item","required_before_import","status","owner","notes"];
  const data = rows.map((row) => [
    row.checkItem,
    row.requiredBeforeImport,
    row.status,
    row.owner,
    row.notes,
  ]);
  triggerDownload(buildCsvBlob(headers, data), "import-approval-checklist.csv");
}

function downloadApprovalSummary(result: PreviewResult, approvalState: ApprovalState, recommendation: string): void {
  const rows: string[][] = [
    ["approval_state", approvalState],
    ["total_rows", String(result.totalRows)],
    ["valid_rows", String(result.valid.length)],
    ["invalid_rows", String(result.invalid.length)],
    ["review_rows", String(result.reviewRows.length)],
    ["duplicate_nhi_groups", String(result.dupNhiGroupCount)],
    ["duplicate_serial_groups", String(result.dupSerialGroupCount)],
    ["contact_warnings", String(result.dupContactWarnCount)],
    ["recommendation", recommendation],
  ];
  triggerDownload(buildCsvBlob(["metric","value"], rows), "import-approval-summary.csv");
}

// ─── UI components ────────────────────────────────────────────────────────────

const READINESS: Record<PreviewResult["readiness"], { label: string; leftBorder: string; badge: string; note: string | null }> = {
  ready: {
    label: "Ready for import preparation",
    leftBorder: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    note: null,
  },
  review_required: {
    label: "Review required",
    leftBorder: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
    note: null,
  },
  not_ready: {
    label: "Not ready for import",
    leftBorder: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
    note: "Resolve duplicate NHI or serial conflicts and fix all invalid rows before import.",
  },
};

function ReadinessPanel({ result }: { result: PreviewResult }) {
  const cfg = READINESS[result.readiness];
  const reviewCount = result.reviewRows.filter((r) => r.severity === "review").length;
  const stats: { label: string; value: number; color?: string }[] = [
    { label: "Total rows",        value: result.totalRows },
    { label: "Valid rows",        value: result.valid.length,          color: result.valid.length          > 0 ? "text-emerald-700" : undefined },
    { label: "Invalid rows",      value: result.invalid.length,        color: result.invalid.length        > 0 ? "text-red-600"     : undefined },
    { label: "Review required",   value: reviewCount,                   color: reviewCount                  > 0 ? "text-red-600"     : undefined },
    { label: "Dup NHI groups",    value: result.dupNhiGroupCount,       color: result.dupNhiGroupCount      > 0 ? "text-red-600"     : undefined },
    { label: "Dup serial groups", value: result.dupSerialGroupCount,    color: result.dupSerialGroupCount   > 0 ? "text-red-600"     : undefined },
    { label: "Contact warnings",  value: result.dupContactWarnCount,    color: result.dupContactWarnCount   > 0 ? "text-amber-600"   : undefined },
  ];
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${cfg.leftBorder} rounded-xl p-5 space-y-4`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Import readiness</p>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="flex flex-col">
            <span className={`text-2xl font-bold ${color ?? "text-gray-800"}`}>{value}</span>
            <span className="text-xs text-gray-500 mt-0.5">{label}</span>
          </div>
        ))}
      </div>
      {cfg.note && (
        <p className="text-xs text-red-700 border-t border-gray-100 pt-3">{cfg.note}</p>
      )}
    </div>
  );
}

const PREFLIGHT_CONFIG: Record<PreflightState, { label: string; leftBorder: string; badge: string; note: string }> = {
  passed: {
    label: "Preflight passed",
    leftBorder: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    note: "All rows passed validation and no duplicates were detected.",
  },
  review_required: {
    label: "Preflight review required",
    leftBorder: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
    note: "Contact warnings or review items exist. Resolve before proceeding.",
  },
  blocked: {
    label: "Preflight blocked",
    leftBorder: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
    note: "Invalid rows or duplicate NHI/serial conflicts must be resolved before import.",
  },
};

function PreflightPanel({
  result,
  preflightState,
  manifest,
}: {
  result: PreviewResult;
  preflightState: PreflightState;
  manifest: ImportManifestRow[];
}) {
  const cfg = PREFLIGHT_CONFIG[preflightState];
  const reviewCount = result.reviewRows.length;
  const currentState = preflightState.replace(/_/g, " ");
  const stats: { label: string; value: number | string; color?: string }[] = [
    { label: "Total rows",        value: result.totalRows },
    { label: "Valid rows",        value: result.valid.length,         color: result.valid.length         > 0 ? "text-emerald-700" : undefined },
    { label: "Invalid rows",      value: result.invalid.length,       color: result.invalid.length       > 0 ? "text-red-600"     : undefined },
    { label: "Needs review",      value: reviewCount,                  color: reviewCount                 > 0 ? "text-red-600"     : undefined },
    { label: "Dup NHI groups",    value: result.dupNhiGroupCount,      color: result.dupNhiGroupCount     > 0 ? "text-red-600"     : undefined },
    { label: "Dup serial groups", value: result.dupSerialGroupCount,   color: result.dupSerialGroupCount  > 0 ? "text-red-600"     : undefined },
    { label: "Contact warnings",  value: result.dupContactWarnCount,   color: result.dupContactWarnCount  > 0 ? "text-amber-600"   : undefined },
    { label: "Current preflight state", value: currentState, color: cfg.badge.includes("red") ? "text-red-600" : cfg.badge.includes("amber") ? "text-amber-600" : "text-emerald-700" },
  ];
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${cfg.leftBorder} rounded-xl p-5 space-y-4`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Import preflight</p>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-gray-500">Preflight only — no patient records are created or updated.</p>
        <p className="text-xs text-gray-500">Real import to DynamoDB must be approved and scoped separately.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="flex flex-col">
            <span className={`text-2xl font-bold ${color ?? "text-gray-800"}`}>{value}</span>
            <span className="text-xs text-gray-500 mt-0.5">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 border-t border-gray-100 pt-3">{cfg.note}</p>
      <div className="flex flex-wrap gap-3">
        <DownloadButton
          label="Download import manifest CSV"
          onClick={() => downloadImportManifest(manifest)}
          disabled={manifest.length === 0}
        />
        <DownloadButton
          label="Download preflight sign-off checklist CSV"
          onClick={downloadSignOffChecklist}
        />
      </div>
    </div>
  );
}

const APPROVAL_CONFIG: Record<ApprovalState, { label: string; leftBorder: string; badge: string }> = {
  approval_blocked: {
    label: "Approval blocked",
    leftBorder: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
  },
  approval_review_required: {
    label: "Approval review required",
    leftBorder: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  approval_ready: {
    label: "Approval ready",
    leftBorder: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
  },
};

const CHECK_STATUS_CONFIG: Record<ApprovalChecklistStatus, { label: string; className: string }> = {
  passed: {
    label: "Passed",
    className: "bg-emerald-100 text-emerald-700",
  },
  needs_review: {
    label: "Needs review",
    className: "bg-amber-100 text-amber-700",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-100 text-red-700",
  },
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-700",
  },
};

function ImportApprovalPanel({
  result,
  preflightState,
}: {
  result: PreviewResult;
  preflightState: PreflightState;
}) {
  const approvalState = getApprovalState(result, preflightState);
  const cfg = APPROVAL_CONFIG[approvalState];
  const checklist = buildApprovalChecklist(result);
  const recommendation = getApprovalRecommendation(approvalState);
  const blockingIssues = result.invalid.length + result.dupNhiGroupCount + result.dupSerialGroupCount;
  const stats: { label: string; value: number | string; color?: string }[] = [
    { label: "Batch status", value: cfg.label, color: cfg.badge.includes("red") ? "text-red-600" : cfg.badge.includes("amber") ? "text-amber-600" : "text-emerald-700" },
    { label: "Total rows", value: result.totalRows },
    { label: "Valid rows", value: result.valid.length, color: result.valid.length > 0 ? "text-emerald-700" : undefined },
    { label: "Invalid rows", value: result.invalid.length, color: result.invalid.length > 0 ? "text-red-600" : undefined },
    { label: "Review items", value: result.reviewRows.length, color: result.reviewRows.length > 0 ? "text-amber-600" : undefined },
    { label: "Blocking issues", value: blockingIssues, color: blockingIssues > 0 ? "text-red-600" : undefined },
    { label: "Contact warnings", value: result.dupContactWarnCount, color: result.dupContactWarnCount > 0 ? "text-amber-600" : undefined },
    { label: "Approval recommendation", value: recommendation, color: cfg.badge.includes("red") ? "text-red-600" : cfg.badge.includes("amber") ? "text-amber-600" : "text-emerald-700" },
  ];

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${cfg.leftBorder} rounded-xl p-5 space-y-5`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Import approval</h2>
          <div className="space-y-0.5 mt-1">
            <p className="text-xs text-gray-500">Approval records are for admin review only. No patient records are created or updated.</p>
            <p className="text-xs text-gray-500">Production import execution requires a separately approved implementation step.</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className={label === "Approval recommendation" ? "flex flex-col sm:col-span-4" : "flex flex-col"}>
            <span className={`${label === "Approval recommendation" ? "text-sm leading-6" : "text-2xl"} font-bold ${color ?? "text-gray-800"}`}>{value}</span>
            <span className="text-xs text-gray-500 mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Check item", "Required before import", "Status", "Owner"].map((col) => (
                <th key={col} className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap text-xs">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {checklist.map((row) => {
              const statusCfg = CHECK_STATUS_CONFIG[row.status];
              return (
                <tr key={row.checkItem} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.checkItem}</td>
                  <td className="px-4 py-3 text-gray-700">{row.requiredBeforeImport}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.owner}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <DownloadButton
          label="Download approval checklist CSV"
          onClick={() => downloadApprovalChecklist(checklist)}
        />
        <DownloadButton
          label="Download approval summary CSV"
          onClick={() => downloadApprovalSummary(result, approvalState, recommendation)}
        />
      </div>
    </div>
  );
}

function ManifestPreview({ manifest }: { manifest: ImportManifestRow[] }) {
  if (manifest.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-800">Import manifest preview</h2>
        <p className="text-sm text-gray-500 mt-0.5">All rows — NHI masked. Sorted by CSV line number.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Row", "Name", "NHI", "Funded by", "Serial", "Validation", "Preflight"].map((col) => (
                <th key={col} className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap text-xs">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {manifest.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600 tabular-nums">{row.rowNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name || "—"}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{row.maskedNhi}</td>
                <td className="px-4 py-3 text-gray-700">{row.fundedBy || "—"}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{row.machineSerial || "—"}</td>
                <td className="px-4 py-3">
                  {row.validationStatus === "valid" ? (
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Valid</span>
                  ) : (
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Invalid</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.preflightStatus === "passed" ? (
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Passed</span>
                  ) : row.preflightStatus === "review_required" ? (
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Review</span>
                  ) : (
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Blocked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
        reviewRows: data.reviewRows ?? [],
        readiness: data.readiness ?? 'ready',
        dupNhiGroupCount: data.dupNhiGroupCount ?? 0,
        dupSerialGroupCount: data.dupSerialGroupCount ?? 0,
        dupContactWarnCount: data.dupContactWarnCount ?? 0,
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

  const manifest: ImportManifestRow[] = result
    ? buildManifest({ valid: result.valid, invalid: result.invalid, reviewRows: result.reviewRows })
    : [];
  const preflightState: PreflightState = result
    ? computePreflightState({
        invalidCount:        result.invalid.length,
        dupNhiGroupCount:    result.dupNhiGroupCount,
        dupSerialGroupCount: result.dupSerialGroupCount,
        dupContactWarnCount: result.dupContactWarnCount,
        reviewRowCount:      result.reviewRows.length,
      })
    : 'passed';

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

          {/* Import readiness panel */}
          <ReadinessPanel result={result} />

          {/* Import preflight panel */}
          <PreflightPanel result={result} preflightState={preflightState} manifest={manifest} />

          {/* Import approval panel */}
          <ImportApprovalPanel result={result} preflightState={preflightState} />

          {/* Import manifest preview */}
          <ManifestPreview manifest={manifest} />

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

          {/* Rows needing review */}
          {result.reviewRows.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">Rows needing review</h2>
                <p className="text-sm text-gray-500 mt-0.5">Resolve these issues before import.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["Row", "Name", "NHI", "Serial", "Issue", "Detail", "Severity"].map((col) => (
                        <th key={col} className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap text-xs">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.reviewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name || "—"}</td>
                        <td className="px-4 py-3 font-mono text-gray-700">{row.maskedNhi}</td>
                        <td className="px-4 py-3 font-mono text-gray-700">{row.machineSerial || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.issueType.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-gray-600">{row.issueDetail}</td>
                        <td className="px-4 py-3">
                          {row.severity === "review" ? (
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Review</span>
                          ) : (
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Warning</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
              <DownloadButton
                label={`Download review report (${result.reviewRows.length})`}
                onClick={() => downloadReviewReport(result.reviewRows)}
                disabled={result.reviewRows.length === 0}
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
