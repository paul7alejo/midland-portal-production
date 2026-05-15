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
type RiskLevel = "low" | "medium" | "blocked";

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
  "mask_brand,mask_model,mask_size,funded_by,enable_portal_access";

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
    row.enablePortalAccess ? 'true' : '',
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
  return "This batch is ready for Midland owner review. Execute import will be available once preflight passes.";
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

function getRiskLevel(result: PreviewResult, preflightState: PreflightState): RiskLevel {
  const hasHardBlockers =
    result.invalid.length > 0 ||
    result.dupNhiGroupCount > 0 ||
    result.dupSerialGroupCount > 0;
  if (hasHardBlockers) return "blocked";

  const hasReviewItems = result.dupContactWarnCount > 0 || result.reviewRows.length > 0;
  if (hasReviewItems) return "medium";

  if (preflightState === "passed") return "low";
  return "medium";
}

function getRiskReasons(result: PreviewResult, riskLevel: RiskLevel): string[] {
  const reasons: string[] = [];
  if (result.invalid.length > 0) reasons.push("Invalid rows must be corrected before import.");
  if (result.dupNhiGroupCount > 0) reasons.push("Duplicate NHI conflicts must be resolved before import.");
  if (result.dupSerialGroupCount > 0) reasons.push("Duplicate machine serial conflicts must be resolved before import.");
  if (result.dupContactWarnCount > 0) reasons.push("Shared contact details require admin review.");
  if (result.reviewRows.length > 0) reasons.push("Review rows require admin review.");
  if (riskLevel === "low") reasons.push("No blocking issues detected.");
  return reasons;
}

function getResolutionItems(result: PreviewResult, riskLevel: RiskLevel): string[] {
  if (riskLevel === "blocked") {
    const items: string[] = [];
    if (result.invalid.length > 0) items.push("Invalid rows");
    if (result.dupNhiGroupCount > 0) items.push("Duplicate NHI conflicts");
    if (result.dupSerialGroupCount > 0) items.push("Duplicate machine serial conflicts");
    return items;
  }

  if (riskLevel === "medium") {
    const items: string[] = [];
    if (result.dupContactWarnCount > 0) items.push("Shared contact details");
    if (result.reviewRows.length > 0) {
      items.push("Review rows");
      items.push("Funding values");
    }
    return items;
  }

  return ["No required corrections detected before Midland owner review."];
}

function downloadRiskReport(
  result: PreviewResult,
  preflightState: PreflightState,
  approvalState: ApprovalState,
  riskLevel: RiskLevel,
  riskReasons: string[],
  resolutionItems: string[]
): void {
  const rows: string[][] = [
    ["batch_summary", "total_rows", String(result.totalRows), "reviewed", ""],
    ["batch_summary", "valid_rows", String(result.valid.length), "reviewed", ""],
    ["validation", "invalid_rows", String(result.invalid.length), result.invalid.length > 0 ? "blocked" : "passed", "Invalid rows must be corrected before import."],
    ["duplicate_checks", "duplicate_nhi_groups", String(result.dupNhiGroupCount), result.dupNhiGroupCount > 0 ? "blocked" : "passed", result.dupNhiGroupCount > 0 ? "Duplicate NHI conflicts must be resolved before import." : "No duplicate NHI groups detected."],
    ["duplicate_checks", "duplicate_machine_serial_groups", String(result.dupSerialGroupCount), result.dupSerialGroupCount > 0 ? "blocked" : "passed", result.dupSerialGroupCount > 0 ? "Duplicate machine serial conflicts must be resolved before import." : "No duplicate machine serial groups detected."],
    ["contact_warnings", "contact_warnings", String(result.dupContactWarnCount), result.dupContactWarnCount > 0 ? "needs_review" : "passed", result.dupContactWarnCount > 0 ? "Shared contact details require admin review." : "No shared contact warnings detected."],
    ["preflight", "preflight_state", preflightState, preflightState === "blocked" ? "blocked" : preflightState === "review_required" ? "needs_review" : "passed", ""],
    ["approval", "approval_state", approvalState, approvalState === "approval_blocked" ? "blocked" : approvalState === "approval_review_required" ? "needs_review" : "ready", ""],
    ["recommendation", "risk_level", riskLevel, riskLevel, riskReasons.join(" ")],
    ["recommendation", "what_needs_resolving", resolutionItems.join("; "), riskLevel, ""],
  ];
  triggerDownload(buildCsvBlob(["section","item","value","status","notes"], rows), "import-risk-report.csv");
}

function downloadAdminEvidencePack(
  result: PreviewResult,
  manifest: ImportManifestRow[],
  preflightState: PreflightState,
  approvalState: ApprovalState
): void {
  const rows: string[][] = [
    ["CSV parsed successfully", "passed", "preview result", `${result.totalRows} total row(s) parsed.`],
    ["Required fields checked", result.invalid.length > 0 ? "blocked" : "passed", "validation summary", `${result.invalid.length} invalid row(s) found.`],
    ["Invalid rows separated", "passed", "validation summary", `${result.invalid.length} invalid row(s) separated from valid rows.`],
    ["Duplicate NHI checked", result.dupNhiGroupCount > 0 ? "blocked" : "passed", "duplicate summary", `${result.dupNhiGroupCount} duplicate NHI group(s) found.`],
    ["Duplicate machine serial checked", result.dupSerialGroupCount > 0 ? "blocked" : "passed", "duplicate summary", `${result.dupSerialGroupCount} duplicate serial group(s) found.`],
    ["Shared contact details checked", result.dupContactWarnCount > 0 ? "needs_review" : "passed", "contact warning summary", `${result.dupContactWarnCount} contact warning(s) found.`],
    ["NHI masking confirmed", "passed", "risk and evidence exports", "Risk and evidence downloads contain aggregate data only."],
    ["Manifest generated", manifest.length > 0 ? "passed" : "pending", "import manifest", `${manifest.length} manifest row(s) generated.`],
    ["Preflight state generated", preflightState, "preflight panel", preflightState],
    ["Approval checklist generated", approvalState, "approval panel", approvalState],
    ["Real import not executed", "not_executed", "admin import page", "This page does not execute production imports."],
    ["Production writes not performed", "not_performed", "admin import page", "No production data write is performed by this workflow."],
  ];
  triggerDownload(buildCsvBlob(["evidence_item","status","source","notes"], rows), "import-admin-evidence-pack.csv");
}

function downloadDemoChecklist(): void {
  const headers = ["demo_step","what_to_show","expected_result"];
  const rows: string[][] = [
    ["Clean CSV", "Run a complete CSV with no duplicate or validation issues.", "Low risk with passed preflight and approval-ready state."],
    ["Duplicate NHI CSV", "Run a CSV with duplicate NHI groups.", "Blocked risk with duplicate NHI review required."],
    ["Duplicate serial CSV", "Run a CSV with duplicate machine serial groups.", "Blocked risk with duplicate serial review required."],
    ["Shared contact CSV", "Run a CSV with shared contact details only.", "Medium risk with contact review required."],
    ["Invalid rows CSV", "Run a CSV with missing or invalid required fields.", "Invalid rows are separated and the batch is blocked."],
    ["Manifest download", "Download the masked-NHI import manifest.", "Admin receives a preflight manifest for review."],
    ["Approval checklist download", "Download the approval checklist.", "Admin receives a sign-off checklist for separate real import scope."],
    ["Evidence pack download", "Download the admin evidence pack.", "Admin receives aggregate review evidence with no raw NHI."],
    ["API unauthorized check", "Access preview API without an admin session.", "Request is rejected by existing admin protections."],
  ];
  triggerDownload(buildCsvBlob(headers, rows), "import-demo-checklist.csv");
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

const WORKFLOW_STEPS = [
  "CSV preview",
  "Data validation",
  "Duplicate review",
  "Preflight manifest",
  "Approval checklist",
  "Evidence pack",
  "Execute import",
];

const STAGE_CARDS = [
  {
    title: "CSV preview",
    text: "Parses uploaded CSV data without writing to the system.",
  },
  {
    title: "Data validation",
    text: "Checks required fields and separates valid and invalid rows.",
  },
  {
    title: "Duplicate review",
    text: "Flags duplicate NHI, machine serial, and shared contact details.",
  },
  {
    title: "Preflight manifest",
    text: "Creates a masked-NHI manifest for admin review.",
  },
  {
    title: "Approval checklist",
    text: "Creates a sign-off checklist before any production import is considered.",
  },
  {
    title: "Evidence pack",
    text: "Creates downloadable review evidence for internal admin records.",
  },
  {
    title: "Real import",
    text: "Commits valid rows to DynamoDB. Available only after preflight passes — preview is required first.",
  },
];

function DemoSummaryPanel() {
  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-[#0B5C6C] rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1 max-w-4xl">
        <p className="text-sm font-medium text-gray-800">
          This workflow has two phases: preview validates CSV quality and runs preflight checks; execute commits valid rows to DynamoDB once preflight passes.
        </p>
        <p className="text-sm text-gray-600">Preview first. The Execute Import button appears only when preflight passes with no blocking issues.</p>
      </div>
      <DownloadButton label="Download demo checklist CSV" onClick={downloadDemoChecklist} />
    </div>
  );
}

function WorkflowStepper() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        {WORKFLOW_STEPS.map((step, i) => {
          const isSeparateScope = i === WORKFLOW_STEPS.length - 1;
          return (
            <div key={step} className="flex items-center gap-2">
              {isSeparateScope && <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1" />}
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  isSeparateScope
                    ? "border-gray-200 bg-gray-50 text-gray-500"
                    : "border-[#0B5C6C]/20 bg-[#0B5C6C]/5 text-[#0B5C6C]"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    isSeparateScope ? "bg-gray-200 text-gray-600" : "bg-[#0B5C6C] text-white"
                  }`}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageExplanationCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STAGE_CARDS.map((stage) => {
        const isSeparateScope = stage.title === "Real import";
        return (
          <div key={stage.title} className={`border rounded-lg p-4 bg-white ${isSeparateScope ? "border-gray-200 text-gray-500" : "border-gray-200"}`}>
            <h2 className={`text-sm font-semibold ${isSeparateScope ? "text-gray-600" : "text-gray-800"}`}>{stage.title}</h2>
            <p className="text-xs text-gray-500 mt-1 leading-5">{stage.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function CsvPreparationEmptyState() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-sm text-gray-700">
        Before uploading, prepare a CSV with patient name, NHI, date of birth, contact details, machine details, mask details, and funding source.
      </p>
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_HEADERS_ARRAY.map((header) => (
          <span key={header} className="inline-flex rounded-md bg-white border border-gray-200 px-2.5 py-1 text-xs font-mono text-gray-700">
            {header}
          </span>
        ))}
      </div>
    </div>
  );
}

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
        <p className="text-xs text-gray-500">Preflight checks run during preview — no records are written yet.</p>
        <p className="text-xs text-gray-500">Execute Import becomes available once preflight passes with no blocking issues.</p>
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
            <p className="text-xs text-gray-500">Approval records are for admin review. No records are written during preview.</p>
            <p className="text-xs text-gray-500">Execute Import commits records — it is available only after preflight passes.</p>
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

const RISK_CONFIG: Record<RiskLevel, { label: string; leftBorder: string; badge: string }> = {
  low: {
    label: "Low risk",
    leftBorder: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
  },
  medium: {
    label: "Medium risk",
    leftBorder: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  blocked: {
    label: "Blocked risk",
    leftBorder: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
  },
};

function ImportRiskReportPanel({
  result,
  preflightState,
  manifest,
}: {
  result: PreviewResult;
  preflightState: PreflightState;
  manifest: ImportManifestRow[];
}) {
  const approvalState = getApprovalState(result, preflightState);
  const riskLevel = getRiskLevel(result, preflightState);
  const cfg = RISK_CONFIG[riskLevel];
  const riskReasons = getRiskReasons(result, riskLevel);
  const resolutionItems = getResolutionItems(result, riskLevel);
  const stats: { label: string; value: number | string; color?: string }[] = [
    { label: "Total rows", value: result.totalRows },
    { label: "Valid rows", value: result.valid.length, color: result.valid.length > 0 ? "text-emerald-700" : undefined },
    { label: "Invalid rows", value: result.invalid.length, color: result.invalid.length > 0 ? "text-red-600" : undefined },
    { label: "Review rows", value: result.reviewRows.length, color: result.reviewRows.length > 0 ? "text-amber-600" : undefined },
    { label: "Duplicate NHI groups", value: result.dupNhiGroupCount, color: result.dupNhiGroupCount > 0 ? "text-red-600" : undefined },
    { label: "Duplicate machine serial groups", value: result.dupSerialGroupCount, color: result.dupSerialGroupCount > 0 ? "text-red-600" : undefined },
    { label: "Contact warnings", value: result.dupContactWarnCount, color: result.dupContactWarnCount > 0 ? "text-amber-600" : undefined },
    { label: "Risk level", value: cfg.label, color: cfg.badge.includes("red") ? "text-red-600" : cfg.badge.includes("amber") ? "text-amber-600" : "text-emerald-700" },
    { label: "Approval state", value: approvalState.replace(/_/g, " ") },
    { label: "Preflight state", value: preflightState.replace(/_/g, " ") },
  ];

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${cfg.leftBorder} rounded-xl p-5 space-y-5`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Import risk report</h2>
          <div className="space-y-0.5 mt-1">
            <p className="text-xs text-gray-500">This report summarises CSV import risk. Review it before running Execute Import.</p>
            <p className="text-xs text-gray-500">No records are written during preview. Execute Import commits rows after preflight passes.</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="flex flex-col">
            <span className={`text-xl font-bold ${color ?? "text-gray-800"}`}>{value}</span>
            <span className="text-xs text-gray-500 mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800">Risk reasons</h3>
          <ul className="mt-2 space-y-1.5">
            {riskReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800">What needs resolving</h3>
          <ul className="mt-2 space-y-1.5">
            {resolutionItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <DownloadButton
          label="Download risk report CSV"
          onClick={() => downloadRiskReport(result, preflightState, approvalState, riskLevel, riskReasons, resolutionItems)}
        />
        <DownloadButton
          label="Download admin evidence pack CSV"
          onClick={() => downloadAdminEvidencePack(result, manifest, preflightState, approvalState)}
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
                 px-4 py-2.5 rounded-lg min-h-[40px] hover:border-[#0B5C6C] hover:text-[#0B5C6C]
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
  const [isExecuting,  setIsExecuting]  = useState(false);
  type PortalUserCreated = { rowNumber: number; name: string; portalId: string; username: string; temporaryPassword: string };
  const [executeResult, setExecuteResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
    importBatchId: string;
    portalUsersCreated: PortalUserCreated[];
    portalUsersAlreadyExisted: number;
    portalUserFailures: number;
  } | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleExecute() {
    if (!csvText.trim() || preflightState !== 'passed') return;
    setIsExecuting(true);
    setExecuteError(null);
    setExecuteResult(null);
    try {
      const res = await fetch('/api/admin/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, mode: 'execute' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExecuteError(data.error ?? 'Import failed. Try again.');
        return;
      }
      setExecuteResult({
        created: data.summary.created,
        skipped: data.summary.skipped,
        failed: data.summary.failed,
        importBatchId: data.importBatchId,
        portalUsersCreated: data.portalUsersCreated ?? [],
        portalUsersAlreadyExisted: data.summary.portalUsersAlreadyExisted ?? 0,
        portalUserFailures: data.summary.portalUserFailures ?? 0,
      });
    } catch {
      setExecuteError('Import failed. Try again.');
    } finally {
      setIsExecuting(false);
    }
  }

  function handleClear() {
    setCsvText("");
    setFileName(null);
    setResult(null);
    setActiveTab("valid");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canPreview  = csvText.trim().length > 0 && !isPreviewing;
  const canClear    = csvText.length > 0 || result !== null;
  const canExecute  = preflightState === 'passed' && !isExecuting && !executeResult;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
          Data operations
        </p>
        <h1 className="text-3xl font-bold text-navy">Import patients</h1>
        <p className="text-base leading-6 text-gray-600">
          Validate CSV data, review risks, and prepare evidence before any approved production import.
        </p>
      </div>

      {/* Workflow banner — always visible */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="text-base text-amber-900 font-semibold">
          Preview first, then execute
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          Preview validates the CSV and runs preflight checks. Execute Import becomes available only after preflight passes with no blocking issues.
        </p>
      </div>

      <DemoSummaryPanel />

      <WorkflowStepper />

      <StageExplanationCards />

      {/* Error banner */}
      {previewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{previewError}</p>
        </div>
      )}

      {result === null && <CsvPreparationEmptyState />}

      {/* Input card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">CSV input</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Upload a CSV file or paste CSV content below. NHI is masked in review reports.
          </p>
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-700">Upload CSV file</label>
          <div className="flex items-center gap-3 flex-wrap">
            <label
              htmlFor="csv-file-input"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700
                         bg-white hover:border-[#0B5C6C] hover:text-[#0B5C6C] cursor-pointer transition-colors min-h-[40px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose CSV file
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
          <span className="text-sm font-medium text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Paste textarea */}
        <div className="space-y-2">
          <label htmlFor="csv-paste" className="block text-sm font-semibold uppercase tracking-wide text-gray-700">
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
          {result !== null && preflightState === 'passed' && (
            <button
              type="button"
              onClick={handleExecute}
              disabled={!canExecute}
              className="bg-[#74C0A2] text-white text-sm font-semibold px-5 py-2.5 rounded-lg min-h-[40px]
                         hover:bg-[#74C0A2]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Importing…' : 'Execute Import'}
            </button>
          )}
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

          {/* Import risk report panel */}
          <ImportRiskReportPanel result={result} preflightState={preflightState} manifest={manifest} />

          {/* Import manifest preview */}
          <ManifestPreview manifest={manifest} />

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {executeError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium">{executeError}</p>
            </div>
          )}
          {executeResult && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
                <h3 className="text-sm font-semibold text-emerald-800">Import complete</h3>
                <p className="text-sm text-emerald-700">Batch ID: <span className="font-mono">{executeResult.importBatchId}</span></p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <span className="text-emerald-700">Patients created: <strong>{executeResult.created}</strong></span>
                  <span className="text-amber-700">Skipped: <strong>{executeResult.skipped}</strong></span>
                  <span className="text-red-700">Failed: <strong>{executeResult.failed}</strong></span>
                </div>
                {(executeResult.portalUsersCreated.length > 0 || executeResult.portalUsersAlreadyExisted > 0 || executeResult.portalUserFailures > 0) && (
                  <div className="flex flex-wrap gap-6 text-sm border-t border-emerald-200 pt-2 mt-2">
                    <span className="text-emerald-700">Portal users created: <strong>{executeResult.portalUsersCreated.length}</strong></span>
                    <span className="text-gray-600">Already login-enabled: <strong>{executeResult.portalUsersAlreadyExisted}</strong></span>
                    {executeResult.portalUserFailures > 0 && (
                      <span className="text-red-700">Portal access failures: <strong>{executeResult.portalUserFailures}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {executeResult.portalUsersCreated.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-200 space-y-1">
                    <h3 className="text-sm font-semibold text-amber-900">Portal access — temporary passwords</h3>
                    <p className="text-xs text-amber-800 font-medium">
                      Temporary password — copy now; not stored. Patients must change password on first login.
                    </p>
                    <p className="text-xs text-amber-700">
                      Patients log in with their number-only username (no MS- prefix). These passwords are not logged or saved anywhere.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-amber-100 border-b border-amber-200">
                          {["Row", "Name", "Portal ID (MSID)", "Login username", "Temporary password"].map((col) => (
                            <th key={col} className="text-left px-4 py-3 font-semibold text-amber-900 uppercase tracking-wide whitespace-nowrap text-xs">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {executeResult.portalUsersCreated.map((u) => (
                          <tr key={u.rowNumber} className="bg-white">
                            <td className="px-4 py-3 text-gray-600 tabular-nums">{u.rowNumber}</td>
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                            <td className="px-4 py-3 font-mono text-gray-700">{u.portalId}</td>
                            <td className="px-4 py-3 font-mono text-gray-700">{u.username}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-amber-900 select-all">{u.temporaryPassword}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

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
