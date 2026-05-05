"use client";

import { useState } from "react";
import { PatientDrawer } from "@/components/admin/PatientDrawer";

type OrderStatus = "Pending" | "Approved" | "Dispatched" | "Completed";
type TabKey = OrderStatus;

interface Order {
  id: string;
  patient: string;
  msid: string;
  date: string;
  items: string;
  type: "ENTITLEMENT";
  status: OrderStatus;
}

const ALL_ORDERS: Order[] = [
  {
    id: "ORD-001",
    patient: "Paul Moreno",
    msid: "MS-238872",
    date: "1 May 2026",
    items: "Mask cushion + Headgear",
    type: "ENTITLEMENT",
    status: "Pending",
  },
  {
    id: "ORD-002",
    patient: "Richard O'Brien",
    msid: "MS-956431",
    date: "2 May 2026",
    items: "Complete mask kit",
    type: "ENTITLEMENT",
    status: "Pending",
  },
  {
    id: "ORD-003",
    patient: "Sarah Kim",
    msid: "MS-731204",
    date: "3 May 2026",
    items: "Filters",
    type: "ENTITLEMENT",
    status: "Pending",
  },
];

const pendingCount = ALL_ORDERS.filter((o) => o.status === "Pending").length;

const TABS: { key: TabKey; label: string; badge?: number }[] = [
  { key: "Pending", label: "Pending", badge: pendingCount },
  { key: "Approved", label: "Approved" },
  { key: "Dispatched", label: "Dispatched" },
  { key: "Completed", label: "Completed" },
];

function EmptyState({ tab }: { tab: TabKey }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-700">No {tab.toLowerCase()} orders</p>
      <p className="text-sm text-gray-500 mt-1">Orders will appear here once they reach this stage.</p>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMsid, setDrawerMsid] = useState<string | null>(null);
  const [drawerName, setDrawerName] = useState<string | undefined>(undefined);

  const visibleOrders = ALL_ORDERS.filter((o) => o.status === activeTab);

  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((o) => selected.has(o.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleOrders.forEach((o) => next.delete(o.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleOrders.forEach((o) => next.add(o.id));
        return next;
      });
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedVisible = visibleOrders.filter((o) => selected.has(o.id));

  function handleApproveSelected() {
    console.log("approve selected", selectedVisible);
  }

  function handleApprove(order: Order) {
    console.log("approve", order);
  }

  function handleViewPatient(order: Order) {
    setDrawerMsid(order.msid);
    setDrawerName(order.patient);
    setDrawerOpen(true);
  }

  function handleDecline(order: Order) {
    console.log("decline", order);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-navy">Orders</h1>
          <p className="text-base text-gray-600 mt-1">Supply request worklist — Midland Sleep</p>
        </div>

        {selectedVisible.length > 0 && (
          <button
            type="button"
            onClick={handleApproveSelected}
            className="bg-[#0B5C6C] text-white text-base font-medium px-5 py-2.5 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors"
          >
            Approve selected ({selectedVisible.length})
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelected(new Set());
                }}
                className={`
                  flex items-center gap-2 px-5 py-3.5 text-base font-medium border-b-2 transition-colors
                  ${isActive
                    ? "border-[#0B5C6C] text-[#0B5C6C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full text-xs font-semibold px-2 py-0.5 min-w-[22px] ${
                      isActive ? "bg-[#0B5C6C] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Table or empty state */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {visibleOrders.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded accent-[#0B5C6C] cursor-pointer"
                      aria-label="Select all"
                    />
                  </th>
                  {["Patient", "MSID", "Date", "Items", "Type", "Status", "Actions"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleOrders.map((order) => {
                  const isSelected = selected.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${isSelected ? "bg-teal-50" : "hover:bg-gray-50"}`}
                      style={{ minHeight: "56px" }}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(order.id)}
                          className="h-5 w-5 rounded accent-[#0B5C6C] cursor-pointer"
                          aria-label={`Select ${order.patient}`}
                        />
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-4">
                        <span className="text-base font-semibold text-navy whitespace-nowrap">
                          {order.patient}
                        </span>
                      </td>

                      {/* MSID */}
                      <td className="px-5 py-4">
                        <span className="text-base font-mono text-gray-700">{order.msid}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <span className="text-base text-gray-700 whitespace-nowrap">{order.date}</span>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <span className="text-base text-gray-700">{order.items}</span>
                      </td>

                      {/* Type badge */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full bg-[#0B5C6C] text-white whitespace-nowrap">
                          {order.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="text-base text-gray-700">{order.status}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleApprove(order)}
                            className="bg-[#0B5C6C] text-white text-base font-medium px-4 py-2 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/90 transition-colors whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewPatient(order)}
                            className="border border-[#0B5C6C] text-[#0B5C6C] text-base font-medium px-4 py-2 rounded-lg min-h-[44px] hover:bg-[#0B5C6C]/5 transition-colors whitespace-nowrap"
                          >
                            View patient
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecline(order)}
                            className="text-base font-medium text-red-500 hover:text-red-700 px-2 py-2 min-h-[44px] transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        msid={drawerMsid}
        patientName={drawerName}
      />
    </div>
  );
}
