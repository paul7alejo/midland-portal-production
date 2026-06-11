// Static sample activity data — no live events, no writes, no notifications.
// Phase 3 will replace with real event stream from DynamoDB.

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
  time: string;
  reference?: string;
  actionLabel: string;
  actionHref: string;
  filters: ActivityFilterId[];
}

export const SAMPLE_ACTIVITY: ActivityItem[] = [
  {
    id: "act-001",
    area: "Orders",
    priority: "Attention",
    title: "Supply request submitted — awaiting staff review",
    summary:
      "A patient submitted a supply request (cushion, headgear). No staff action has been recorded yet.",
    time: "Today, 10:14 am",
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
    time: "Today, 9:02 am",
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
    time: "Today, 8:30 am",
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
    time: "Yesterday, 4:47 pm",
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
    time: "Yesterday, 3:15 pm",
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
    time: "Yesterday, 2:00 pm",
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
    time: "Yesterday, 11:23 am",
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
    time: "2 days ago",
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
    time: "2 days ago",
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
    time: "3 days ago",
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
    time: "3 days ago",
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
    time: "4 days ago",
    actionLabel: "View patient",
    actionHref: "/admin/patients",
    filters: ["all", "orders"],
  },
];
