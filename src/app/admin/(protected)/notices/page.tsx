"use client";

import { useState, useEffect, useMemo } from "react";

type NoticeStatus       = "draft" | "published" | "expired" | "archived";
type NoticeAudienceType = "all_patients" | "single_patient";
type NoticePlacement    = "top_strip" | "notification_bell" | "dashboard_card";
type NoticePriority     = "info" | "reminder" | "important";

interface PatientNotice {
  notice_id:         string;
  title:             string;
  message:           string;
  audience_type:     NoticeAudienceType;
  patient_msid?:     string;
  placement:         NoticePlacement;
  priority:          NoticePriority;
  status:            NoticeStatus;
  starts_at?:        string;
  expires_at?:       string;
  created_at:        string;
  updated_at:        string;
  published_at?:     string;
  expired_at?:       string;
  archived_at?:      string;
  created_by_label:  string;
  updated_by_label:  string;
  published_by_label?: string;
  expired_by_label?:   string;
  archived_by_label?:  string;
}

type LoadState = "loading" | "loaded" | "error";
type FormMode  = "create" | "edit" | null;

const PLACEMENT_LABELS: Record<NoticePlacement, string> = {
  top_strip:         "Top strip",
  notification_bell: "Notification bell",
  dashboard_card:    "Dashboard card",
};

const PRIORITY_LABELS: Record<NoticePriority, string> = {
  info:      "Info",
  reminder:  "Reminder",
  important: "Important",
};

const MSID_RE = /^MS-\d+$/;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Pacific/Auckland",
  }).format(d);
}

function safeServiceError(err: unknown): string {
  if (err instanceof Response) return "Server error";
  return "Unexpected error — try again";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: NoticeStatus }) {
  const cls: Record<NoticeStatus, string> = {
    draft:     "bg-slate-100 text-slate-700 border-slate-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    expired:   "bg-amber-50 text-amber-700 border-amber-200",
    archived:  "bg-gray-100 text-gray-500 border-gray-200",
  };
  const label: Record<NoticeStatus, string> = {
    draft: "Draft", published: "Published", expired: "Expired", archived: "Archived",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${cls[status]}`}>
      {label[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: NoticePriority }) {
  const cls: Record<NoticePriority, string> = {
    info:      "bg-blue-50 text-blue-700 border-blue-200",
    reminder:  "bg-amber-50 text-amber-700 border-amber-200",
    important: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${cls[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function PlacementBadge({ placement }: { placement: NoticePlacement }) {
  const cls: Record<NoticePlacement, string> = {
    top_strip:         "bg-[#0B5C6C]/10 text-[#0B5C6C] border-[#0B5C6C]/20",
    notification_bell: "bg-blue-50 text-blue-700 border-blue-200",
    dashboard_card:    "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${cls[placement]}`}>
      {PLACEMENT_LABELS[placement]}
    </span>
  );
}

function KpiCard({
  label, value, sub, color,
}: {
  label: string; value: number; sub?: string; color: "teal" | "emerald" | "gray";
}) {
  const cls = {
    teal:    { card: "border-[#0B5C6C]/20 bg-[#0B5C6C]/[0.04]", num: "text-[#073B4A]" },
    emerald: { card: "border-emerald-200 bg-emerald-50/60",       num: "text-emerald-800" },
    gray:    { card: "border-gray-200 bg-gray-50",                num: "text-gray-600" },
  }[color];
  return (
    <div className={`rounded-xl border shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-5 py-4 ${cls.card}`}>
      <p className={`text-2xl font-bold tabular-nums ${cls.num}`}>{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Notice preview ────────────────────────────────────────────────────────────

function NoticePreview({
  title, message, placement, priority,
}: {
  title: string; message: string; placement: NoticePlacement; priority: NoticePriority;
}) {
  if (!title && !message) return null;

  const priorityStyle: Record<NoticePriority, string> = {
    info:      "border-blue-200 bg-blue-50",
    reminder:  "border-amber-200 bg-amber-50",
    important: "border-red-200 bg-red-50",
  };
  const priorityLabel: Record<NoticePriority, string> = {
    info:      "Info",
    reminder:  "Reminder",
    important: "Important",
  };
  const priorityIcon: Record<NoticePriority, string> = {
    info: "ℹ", reminder: "🔔", important: "⚠",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Preview — {PLACEMENT_LABELS[placement]}
      </p>
      <div className={`rounded-lg border px-4 py-3 ${priorityStyle[priority]}`}>
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">{priorityIcon[priority]}</span>
          <div className="space-y-0.5 min-w-0">
            {title && (
              <p className="text-sm font-semibold text-gray-800 break-words">
                {title}
              </p>
            )}
            {message && (
              <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                {message}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {priorityLabel[priority]} · {PLACEMENT_LABELS[placement]} · Patient portal
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        This preview is illustrative only. Final appearance depends on patient portal UI (Phase 14C).
      </p>
    </div>
  );
}

// ── Notice form ───────────────────────────────────────────────────────────────

function NoticeForm({
  mode,
  formTitle,        setFormTitle,
  formMessage,      setFormMessage,
  formAudienceType, setFormAudienceType,
  formPatientMsid,  setFormPatientMsid,
  formPlacement,    setFormPlacement,
  formPriority,     setFormPriority,
  formStartsAt,     setFormStartsAt,
  formExpiresAt,    setFormExpiresAt,
  saving,
  formError,
  onSave,
  onCancel,
}: {
  mode:              FormMode;
  formTitle:         string;        setFormTitle:         (v: string) => void;
  formMessage:       string;        setFormMessage:       (v: string) => void;
  formAudienceType:  NoticeAudienceType; setFormAudienceType: (v: NoticeAudienceType) => void;
  formPatientMsid:   string;        setFormPatientMsid:   (v: string) => void;
  formPlacement:     NoticePlacement;    setFormPlacement:    (v: NoticePlacement) => void;
  formPriority:      NoticePriority;     setFormPriority:     (v: NoticePriority) => void;
  formStartsAt:      string;        setFormStartsAt:      (v: string) => void;
  formExpiresAt:     string;        setFormExpiresAt:     (v: string) => void;
  saving:            boolean;
  formError:         string | null;
  onSave:            () => void;
  onCancel:          () => void;
}) {
  const TITLE_MAX   = 120;
  const MESSAGE_MAX = 500;

  const msidInvalid =
    formAudienceType === "single_patient" &&
    formPatientMsid.length > 0 &&
    !MSID_RE.test(formPatientMsid);

  return (
    <div className="rounded-xl border border-[#0B5C6C]/30 bg-[#0B5C6C]/[0.03] p-5 space-y-5">
      <h2 className="text-base font-semibold text-navy">
        {mode === "create" ? "New notice" : "Edit notice (draft only)"}
      </h2>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={TITLE_MAX}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. Clinic closure — public holiday"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
          />
          <p className="text-xs text-gray-400">{formTitle.length}/{TITLE_MAX}</p>
        </div>

        {/* Message */}
        <div className="sm:col-span-2 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            maxLength={MESSAGE_MAX}
            rows={3}
            value={formMessage}
            onChange={(e) => setFormMessage(e.target.value)}
            placeholder="Plain text only. No links, no HTML."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30 resize-y"
          />
          <p className="text-xs text-gray-400">{formMessage.length}/{MESSAGE_MAX}</p>
        </div>

        {/* Audience */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Audience <span className="text-red-500">*</span>
          </label>
          <select
            value={formAudienceType}
            onChange={(e) => setFormAudienceType(e.target.value as NoticeAudienceType)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
          >
            <option value="all_patients">All patients</option>
            <option value="single_patient">Single patient (by MSID)</option>
          </select>
        </div>

        {/* Patient MSID — conditional */}
        {formAudienceType === "single_patient" && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Patient MSID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formPatientMsid}
              onChange={(e) => setFormPatientMsid(e.target.value.trim())}
              placeholder="MS-1234"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                msidInvalid
                  ? "border-red-300 focus:ring-red-300/30"
                  : "border-gray-200 focus:ring-[#0B5C6C]/30"
              }`}
            />
            {msidInvalid && (
              <p className="text-xs text-red-600">Must be MS-&lt;number&gt; — e.g. MS-1234</p>
            )}
          </div>
        )}

        {/* Placement */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Placement <span className="text-red-500">*</span>
          </label>
          <select
            value={formPlacement}
            onChange={(e) => setFormPlacement(e.target.value as NoticePlacement)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
          >
            <option value="dashboard_card">Dashboard card</option>
            <option value="top_strip">Top strip</option>
            <option value="notification_bell">Notification bell</option>
          </select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            value={formPriority}
            onChange={(e) => setFormPriority(e.target.value as NoticePriority)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
          >
            <option value="info">Info</option>
            <option value="reminder">Reminder</option>
            <option value="important">Important</option>
          </select>
        </div>

        {/* Start date */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Start date (optional)
          </label>
          <input
            type="datetime-local"
            value={formStartsAt}
            onChange={(e) => setFormStartsAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
          />
        </div>

        {/* Expiry date */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Expiry date (optional)
          </label>
          <input
            type="datetime-local"
            value={formExpiresAt}
            onChange={(e) => setFormExpiresAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B5C6C]/30"
          />
        </div>
      </div>

      {/* Preview */}
      {(formTitle || formMessage) && (
        <NoticePreview
          title={formTitle}
          message={formMessage}
          placement={formPlacement}
          priority={formPriority}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-[#0B5C6C] px-4 py-2 text-sm font-medium text-white hover:bg-[#073B4A] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : mode === "create" ? "Save draft" : "Update draft"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminNoticesPage() {
  const [notices,       setNotices]       = useState<PatientNotice[]>([]);
  const [loadState,     setLoadState]     = useState<LoadState>("loading");
  const [formMode,      setFormMode]      = useState<FormMode>(null);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [formTitle,         setFormTitle]         = useState("");
  const [formMessage,       setFormMessage]       = useState("");
  const [formAudienceType,  setFormAudienceType]  = useState<NoticeAudienceType>("all_patients");
  const [formPatientMsid,   setFormPatientMsid]   = useState("");
  const [formPlacement,     setFormPlacement]     = useState<NoticePlacement>("dashboard_card");
  const [formPriority,      setFormPriority]      = useState<NoticePriority>("info");
  const [formStartsAt,      setFormStartsAt]      = useState("");
  const [formExpiresAt,     setFormExpiresAt]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);
  const [actioningId,   setActioningId]   = useState<string | null>(null);
  const [actionError,   setActionError]   = useState<string | null>(null);

  useEffect(() => { loadNotices(); }, []);

  async function loadNotices() {
    setLoadState("loading");
    try {
      const res  = await fetch("/api/admin/notices");
      if (!res.ok) throw res;
      const data = (await res.json()) as { notices: PatientNotice[] };
      setNotices(data.notices ?? []);
      setLoadState("loaded");
    } catch {
      setLoadState("error");
    }
  }

  const stats = useMemo(() => ({
    draft:    notices.filter((n) => n.status === "draft").length,
    published: notices.filter((n) => n.status === "published").length,
    inactive: notices.filter((n) => n.status === "expired" || n.status === "archived").length,
  }), [notices]);

  function resetForm() {
    setFormMode(null);
    setEditingId(null);
    setFormTitle(""); setFormMessage("");
    setFormAudienceType("all_patients"); setFormPatientMsid("");
    setFormPlacement("dashboard_card"); setFormPriority("info");
    setFormStartsAt(""); setFormExpiresAt("");
    setFormError(null);
  }

  function openCreate() {
    resetForm();
    setFormMode("create");
  }

  function openEdit(n: PatientNotice) {
    setFormMode("edit");
    setEditingId(n.notice_id);
    setFormTitle(n.title);
    setFormMessage(n.message);
    setFormAudienceType(n.audience_type);
    setFormPatientMsid(n.patient_msid ?? "");
    setFormPlacement(n.placement);
    setFormPriority(n.priority);
    setFormStartsAt(n.starts_at ?? "");
    setFormExpiresAt(n.expires_at ?? "");
    setFormError(null);
    setActionError(null);
  }

  async function handleSave() {
    setFormError(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {
        title:         formTitle.trim(),
        message:       formMessage.trim(),
        audience_type: formAudienceType,
        placement:     formPlacement,
        priority:      formPriority,
      };
      if (formAudienceType === "single_patient") body.patient_msid = formPatientMsid.trim();
      if (formStartsAt)  body.starts_at  = formStartsAt;
      if (formExpiresAt) body.expires_at = formExpiresAt;

      const url    = formMode === "create" ? "/api/admin/notices" : `/api/admin/notices/${editingId}`;
      const method = formMode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setFormError(data.error ?? "Failed to save notice");
        return;
      }
      await loadNotices();
      resetForm();
    } catch {
      setFormError(safeServiceError(null));
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(noticeId: string, action: "publish" | "expire" | "archive") {
    setActionError(null);
    setActioningId(noticeId);
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}/${action}`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setActionError(data.error ?? `Failed to ${action} notice`);
        return;
      }
      if (formMode === "edit" && editingId === noticeId) resetForm();
      await loadNotices();
    } catch {
      setActionError(safeServiceError(null));
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Patient Notices</h1>
        <p className="text-base text-gray-600">
          Create and publish notices that appear in your patients&apos; portal. Patient display
          is managed separately from request-status notifications.
        </p>
      </div>

      {/* KPI cards */}
      {loadState === "loaded" && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 max-w-lg">
          <KpiCard label="Draft"     value={stats.draft}     color="teal"    />
          <KpiCard label="Published" value={stats.published} color="emerald" />
          <KpiCard label="Inactive"  value={stats.inactive}  sub="expired + archived" color="gray" />
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="ml-4 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Create / Edit form */}
      {formMode !== null && (
        <NoticeForm
          mode={formMode}
          formTitle={formTitle}               setFormTitle={setFormTitle}
          formMessage={formMessage}           setFormMessage={setFormMessage}
          formAudienceType={formAudienceType} setFormAudienceType={setFormAudienceType}
          formPatientMsid={formPatientMsid}   setFormPatientMsid={setFormPatientMsid}
          formPlacement={formPlacement}       setFormPlacement={setFormPlacement}
          formPriority={formPriority}         setFormPriority={setFormPriority}
          formStartsAt={formStartsAt}         setFormStartsAt={setFormStartsAt}
          formExpiresAt={formExpiresAt}       setFormExpiresAt={setFormExpiresAt}
          saving={saving}
          formError={formError}
          onSave={handleSave}
          onCancel={resetForm}
        />
      )}

      {/* Create button */}
      {formMode === null && loadState === "loaded" && (
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#0B5C6C] px-4 py-2 text-sm font-medium text-white hover:bg-[#073B4A] transition-colors"
        >
          + Create notice
        </button>
      )}

      {/* Load states */}
      {loadState === "loading" && (
        <div className="py-16 text-center text-gray-400 text-sm">Loading notices…</div>
      )}
      {loadState === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Failed to load notices. Check your connection or verify PATIENT_NOTICES_TABLE_NAME is configured.
        </div>
      )}
      {loadState === "loaded" && notices.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
          No notices yet. Create a draft to get started.
        </div>
      )}

      {/* Notices table */}
      {loadState === "loaded" && notices.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Title", "Audience", "Placement", "Priority", "Status", "Updated", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {notices.map((n) => {
                const isBusy = actioningId === n.notice_id;
                return (
                  <tr key={n.notice_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800 font-medium max-w-xs">
                      <p className="truncate">{n.title}</p>
                      {n.patient_msid && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{n.patient_msid}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                      {n.audience_type === "all_patients" ? "All patients" : "Single patient"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PlacementBadge placement={n.placement} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PriorityBadge priority={n.priority} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                      {formatDate(n.updated_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {n.status === "draft" && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy || formMode === "edit"}
                              onClick={() => openEdit(n)}
                              className="text-xs font-medium text-[#0B5C6C] hover:underline disabled:opacity-40"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAction(n.notice_id, "publish")}
                              className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-40"
                            >
                              {isBusy ? "…" : "Publish"}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAction(n.notice_id, "archive")}
                              className="text-xs font-medium text-gray-500 hover:underline disabled:opacity-40"
                            >
                              Archive
                            </button>
                          </>
                        )}
                        {n.status === "published" && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAction(n.notice_id, "expire")}
                              className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-40"
                            >
                              {isBusy ? "…" : "Expire"}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAction(n.notice_id, "archive")}
                              className="text-xs font-medium text-gray-500 hover:underline disabled:opacity-40"
                            >
                              Archive
                            </button>
                          </>
                        )}
                        {(n.status === "expired" || n.status === "archived") && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loadState === "loaded" && notices.length > 0 && (
        <p className="text-xs text-gray-400">
          {notices.length} {notices.length === 1 ? "notice" : "notices"} total.
          Patient portal display is managed in Phase 14C.
        </p>
      )}
    </div>
  );
}
