// Static sample activity data — no live events, no writes, no notifications.
// Phase 3 will replace with real event stream from DynamoDB audit, orders, and portal-accounts.
// Real read-only sources identified: /api/admin/audit, /api/admin/orders, /api/admin/portal-accounts.
// Import history and communications queue have no GET endpoints yet — those remain sample/reference.

export type ActivityArea =
  | "Orders"
  | "Patients"
  | "Outreach"
  | "Import"
  | "Inventory"
  | "Portal Accounts"
  | "System";

export type ActivityPriority = "Attention" | "Warning" | "Info" | "Completed";

export type ActivityFilterId =
  | "all"
  | "attention"
  | "orders"
  | "communications"
  | "safety"
  | "system"
  | "inventory";

export interface ActivityItem {
  id: string;
  area: ActivityArea;
  priority: ActivityPriority;
  title: string;
  summary: string;
  /** ISO 8601 — used for date range filters and sort. Computed at module load. */
  timestamp: string;
  reference?: string;
  actionLabel: string;
  actionHref: string;
  filters: ActivityFilterId[];
}

// Timestamps are computed relative to now at module load so "Today" is always current.
function ts(daysAgo: number, hhmm: string): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const SAMPLE_ACTIVITY: ActivityItem[] = [
  {
    id: "act-001",
    area: "Orders",
    priority: "Attention",
    title: "Supply request submitted — awaiting staff review",
    summary:
      "A patient submitted a supply request (cushion, headgear). No staff action has been recorded yet.",
    timestamp: ts(0, "10:14"),
    reference: "REQ-0041",
    actionLabel: "View order",
    actionHref: "/admin/orders",
    filters: ["all", "attention", "orders"],
  },
  {
    id: "act-002",
    area: "Orders",
    priority: "Info",
    title: "Supply request submitted",
    summary:
      "Patient submitted a filter replacement request through the portal. Ready for staff review.",
    timestamp: ts(0, "09:02"),
    reference: "REQ-0040",
    actionLabel: "View order",
    actionHref: "/admin/orders",
    filters: ["all", "orders"],
  },
  {
    id: "act-003",
    area: "Outreach",
    priority: "Attention",
    title: "Follow-up needed — patient has not responded",
    summary:
      "A communication was sent 7 days ago. The patient has not responded. Consider manual follow-up.",
    timestamp: ts(0, "08:30"),
    actionLabel: "View outreach",
    actionHref: "/admin/outreach",
    filters: ["all", "attention", "communications", "safety"],
  },
  {
    id: "act-004",
    area: "Outreach",
    priority: "Warning",
    title: "Communication superseded — patient re-requested",
    summary:
      "Patient submitted a new request while a previous communication was still queued. Previous version has been marked inactive.",
    timestamp: ts(1, "16:47"),
    actionLabel: "View outreach",
    actionHref: "/admin/outreach",
    filters: ["all", "attention", "communications"],
  },
  {
    id: "act-005",
    area: "Outreach",
    priority: "Info",
    title: "Patient communication queued",
    summary:
      "Scheduled outreach communication has been queued and is awaiting staff review before dispatch.",
    timestamp: ts(1, "15:15"),
    actionLabel: "View outreach",
    actionHref: "/admin/outreach",
    filters: ["all", "communications"],
  },
  {
    id: "act-006",
    area: "Outreach",
    priority: "Completed",
    title: "Safety review completed",
    summary:
      "Routine safety review completed for patient. No concerns identified. No further action required.",
    timestamp: ts(1, "14:00"),
    actionLabel: "View patient",
    actionHref: "/admin/patients",
    filters: ["all", "communications", "safety"],
  },
  {
    id: "act-007",
    area: "Portal Accounts",
    priority: "Warning",
    title: "Portal account locked",
    summary:
      "Account automatically locked after 5 failed login attempts. Awaiting staff review or patient contact.",
    timestamp: ts(1, "11:23"),
    actionLabel: "View account",
    actionHref: "/admin/portal-accounts",
    filters: ["all", "attention", "system"],
  },
  {
    id: "act-008",
    area: "Portal Accounts",
    priority: "Completed",
    title: "Password reset completed",
    summary:
      "Patient successfully reset their portal password using the email reset link.",
    timestamp: ts(2, "14:30"),
    actionLabel: "View account",
    actionHref: "/admin/portal-accounts",
    filters: ["all", "system"],
  },
  {
    id: "act-009",
    area: "Import",
    priority: "Completed",
    title: "Import batch completed",
    summary:
      "Scheduled import batch processed 47 patient records without errors.",
    timestamp: ts(2, "09:00"),
    reference: "BATCH-20260609",
    actionLabel: "View import",
    actionHref: "/admin/import",
    filters: ["all", "system"],
  },
  {
    id: "act-010",
    area: "Inventory",
    priority: "Attention",
    title: "Item stock is critical",
    summary:
      "AirSense 11 AutoSet CPAP has only 2 units remaining. Reorder threshold is 5. Contact supplier for urgent replenishment.",
    timestamp: ts(3, "08:00"),
    actionLabel: "View inventory",
    actionHref: "/admin/inventory",
    filters: ["all", "attention", "inventory"],
  },
  {
    id: "act-011",
    area: "Inventory",
    priority: "Warning",
    title: "Item approaching low stock",
    summary:
      "AirFit P10 Nasal Pillow Mask has 8 units remaining. Reorder threshold is 10. Review for restocking.",
    timestamp: ts(3, "07:45"),
    actionLabel: "View inventory",
    actionHref: "/admin/inventory",
    filters: ["all", "attention", "inventory"],
  },
  {
    id: "act-012",
    area: "Patients",
    priority: "Completed",
    title: "Entitlement estimate reviewed",
    summary:
      "Patient entitlement reviewed and approved for standard govt-funded allocation for this period.",
    timestamp: ts(4, "16:00"),
    actionLabel: "View patient",
    actionHref: "/admin/patients",
    filters: ["all", "orders"],
  },
];
