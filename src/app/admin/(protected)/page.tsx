"use client";

import Link from "next/link";
import { ShoppingBag, Phone, Clock, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const callData = [
  { month: "Jan", calls: 312 },
  { month: "Feb", calls: 287 },
  { month: "Mar", calls: 251 },
  { month: "Apr", calls: 198 },
  { month: "May", calls: 156 },
  { month: "Jun", calls: 112 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-deep-teal">
          Admin overview
        </p>
        <h1 className="font-display text-3xl font-bold text-navy">
          Daily operations
        </h1>
        <p className="text-base leading-6 text-gray-700">
          Operational snapshot for patient review, supply requests, and staff follow-up.
        </p>
      </div>

      {/* SECTION 1 — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Portal Reorders */}
        <div className="bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Portal Reorders</h3>
            <ShoppingBag className="h-6 w-6 text-deep-teal" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">47</p>
          <p className="text-base text-gray-700">Requests this month</p>
          <p className="text-base text-deep-teal font-medium">↑ 12% vs last month</p>
        </div>

        {/* Card 2: Phone Reorders */}
        <div className="bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Phone Reorders</h3>
            <Phone className="h-6 w-6 text-deep-teal" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">23</p>
          <p className="text-base text-gray-700">Requests this month</p>
          <p className="text-base text-deep-teal font-medium">↓ 31% vs last month</p>
          <p className="text-sm text-gray-700 italic">Portal is replacing phone calls</p>
        </div>

        {/* Card 3: Awaiting Approval */}
        <div className="bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Awaiting Approval</h3>
            <Clock className="h-6 w-6 text-amber" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">8</p>
          <p className="text-base text-gray-700">Entitlement requests</p>
          <p className="text-base text-amber font-medium">Action required</p>
        </div>

        {/* Card 4: Overdue Alerts */}
        <div className="bg-white border border-sand rounded-xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Overdue Alerts</h3>
            <AlertTriangle className="h-6 w-6 text-amber" />
          </div>
          <p className="text-5xl font-bold text-navy tabular-nums">142</p>
          <p className="text-base text-gray-700">Safety checks + water chambers</p>
          <p className="text-base text-amber font-medium">Needs outreach</p>
        </div>
      </div>

      {/* SECTION 2 — Call Reduction Chart */}
      <div className="bg-white border border-sand rounded-xl p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy mb-1">
            Phone call trend
          </h2>
          <p className="text-base leading-6 text-gray-700">
            Monthly inbound calls shown as an operational planning view.
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={callData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
              <XAxis 
                dataKey="month" 
                stroke="#0B2A3C"
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="#0B2A3C"
                style={{ fontSize: '14px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FDFCF5', 
                  border: '1px solid #E5E1D8',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <ReferenceLine 
                x="Mar" 
                stroke="#F59E0B" 
                strokeDasharray="3 3"
                label={{ 
                  value: "Portal launched", 
                  position: "top",
                  fill: "#F59E0B",
                  fontSize: 14,
                  fontWeight: 500
                }}
              />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#74C0A2" 
                strokeWidth={3}
                dot={{ fill: "#74C0A2", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3 — Alerts Panel */}
      <div className="bg-white border border-sand rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-navy">
          Action required
        </h2>

        <div className="space-y-3">
          {/* Alert 1 */}
          <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex items-center justify-between gap-4 min-h-[72px]">
            <div className="flex-1">
              <p className="text-base font-medium text-navy">
                142 patients have overdue safety checks
              </p>
              <p className="text-base leading-6 text-gray-700">
                Last check &gt;12 months ago
              </p>
            </div>
            <Link
              href="/admin/outreach"
              className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Open outreach
            </Link>
          </div>

          {/* Alert 2 */}
          <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex items-center justify-between gap-4 min-h-[72px]">
            <div className="flex-1">
              <p className="text-base font-medium text-navy">
                89 patients eligible but not ordered in 30+ days
              </p>
              <p className="text-base leading-6 text-gray-700">
                Eligible for supplies, haven't reordered
              </p>
            </div>
            <Link
              href="/admin/segments"
              className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Open segments
            </Link>
          </div>

          {/* Alert 3 */}
          <div className="border border-amber/30 bg-amber/5 rounded-xl p-4 flex items-center justify-between gap-4 min-h-[72px]">
            <div className="flex-1">
              <p className="text-base font-medium text-navy">
                23 patients due for mask check
              </p>
              <p className="text-base leading-6 text-gray-700">
                Mask fitted &gt;6 months ago
              </p>
            </div>
            <Link
              href="/admin/outreach"
              className="bg-deep-teal text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-deep-teal/90 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              Open outreach
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 4 — Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <p className="text-base text-gray-700 mb-2">Total Active Patients</p>
          <p className="text-4xl font-bold text-navy">4,847</p>
        </div>

        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <p className="text-base text-gray-700 mb-2">Portal Adoption</p>
          <p className="text-4xl font-bold text-navy">52%</p>
          <p className="text-base text-gray-700 mt-1">2,520 patients</p>
        </div>

        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm">
          <p className="text-base text-gray-700 mb-2">Avg Response Time</p>
          <p className="text-4xl font-bold text-navy">1.2 days</p>
        </div>
      </div>
    </div>
  );
}
