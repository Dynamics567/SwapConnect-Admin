"use client";
import React from "react";
import type { JSX } from "react";
import { CircleDollarSign, Store, Users, Repeat, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  key: string;
  icon: JSX.Element;
}

interface DashboardTotals {
  totalRevenue?: string | number;
  users?: number;
  newListings?: number;
  activeSwaps?: number;
  pendingVerifications?: number;
  openDisputes?: number;
  highRiskOrders?: number;
}

interface StatsCardProps {
  data: {
    admin?: { role?: string } | null;
    dashboard?: { totals?: DashboardTotals } | null;
  } | null;
  loading: boolean;
}

// Every staff role gets a populated stats row on their own dashboard home --
// previously only SUPER_ADMIN saw anything here at all; every other role
// (admin, support agent, verification officer) loaded /dashboard to an
// entirely empty slot with no explanation. Each role sees numbers relevant
// to what their sidebar actually gives them access to.
function statsForRole(role: string | null, totals: DashboardTotals | undefined): Stat[] {
  if (!totals) return [];

  const revenue: Stat = {
    label: "Total Revenue",
    value: `₦${totals.totalRevenue ?? 0}`,
    key: "revenue",
    icon: <CircleDollarSign size={24} className="text-[#037F44]" />,
  };
  const users: Stat = {
    label: "Total Users",
    value: totals.users ?? 0,
    key: "users",
    icon: <Users size={24} className="text-[#037F44]" />,
  };
  const items: Stat = {
    label: "Total Items Listed",
    value: totals.newListings ?? 0,
    key: "items",
    icon: <Store size={24} className="text-[#037F44]" />,
  };
  const swaps: Stat = {
    label: "Active Swaps",
    value: totals.activeSwaps ?? 0,
    key: "swaps",
    icon: <Repeat size={24} className="text-[#037F44]" />,
  };
  const pendingVerifications: Stat = {
    label: "Pending Verifications",
    value: totals.pendingVerifications ?? 0,
    key: "pendingVerifications",
    icon: <ShieldCheck size={24} className="text-[#037F44]" />,
  };
  const openDisputes: Stat = {
    label: "Open Disputes",
    value: totals.openDisputes ?? 0,
    key: "openDisputes",
    icon: <ShieldAlert size={24} className="text-[#037F44]" />,
  };
  const highRiskOrders: Stat = {
    label: "High-Risk Orders",
    value: totals.highRiskOrders ?? 0,
    key: "highRiskOrders",
    icon: <AlertTriangle size={24} className="text-[#037F44]" />,
  };

  switch (role) {
    case "SUPER_ADMIN":
      return [revenue, users, items, swaps];
    case "ADMIN":
      return [users, items, pendingVerifications, openDisputes];
    case "SUPPORT_AGENT":
      return [openDisputes, highRiskOrders, pendingVerifications, swaps];
    case "VERIFICATION_OFFICER":
      return [pendingVerifications, items, highRiskOrders, swaps];
    default:
      return [];
  }
}

function StatsCard({ data, loading }: StatsCardProps) {
  const role = data?.admin?.role ?? null;
  const totals = data?.dashboard?.totals;
  const stats = statsForRole(role, totals);

  if (!role) return null;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 md:flex gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white w-[244px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-[#F7F8FB] rounded-full p-2 w-10 h-10" />
                  <div>
                    <div className="text-sm text-[#6b6b6b] mb-1 bg-gray-100 w-20 h-4 rounded" />
                    <div className="text-2xl font-bold text-[#353535] bg-gray-100 w-16 h-6 rounded" />
                  </div>
                </div>
              </div>
            ))
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white md:w-[244px] w-[200px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center">
                    {stat.icon}
                  </span>
                  <div>
                    <div className="text-xs md:text-sm text-[#6b6b6b] mb-1">
                      {stat.label}
                    </div>
                    <div className="md:text-2xl text-lg font-bold text-[#353535]">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

export default StatsCard;
