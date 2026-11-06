"use client";
import React from "react";
import type { JSX } from "react";
import Link from "next/link";
import { CircleDollarSign, Store, Users, Repeat, ShieldAlert, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";

// A raw revenue figure (e.g. ₦2595600) has no thousands grouping at all and
// overflows this tile's fixed 90px height on mobile, visually colliding
// with the tile below it. Compact notation (₦2.6M) keeps the tile's width
// bounded regardless of how large revenue grows.
const formatCompactNaira = (n: number) =>
  `₦${new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

interface Stat {
  label: string;
  value: string | number;
  key: string;
  icon: JSX.Element;
  href: string;
  /** Exact value shown on hover when `value` has been abbreviated (e.g. the compact revenue figure). */
  title?: string;
}

interface DashboardTotals {
  totalRevenue?: string | number;
  users?: number;
  products?: number;
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
    label: "Revenue (Last 30 Days)",
    value: formatCompactNaira(Number(totals.totalRevenue ?? 0)),
    title: `₦${new Intl.NumberFormat("en-NG").format(Number(totals.totalRevenue ?? 0))}`,
    key: "revenue",
    icon: <CircleDollarSign size={24} className="text-[#037F44]" />,
    href: "/dashboard/finance/overview",
  };
  const users: Stat = {
    label: "Total Users",
    value: totals.users ?? 0,
    key: "users",
    icon: <Users size={24} className="text-[#037F44]" />,
    href: "/dashboard/user",
  };
  const items: Stat = {
    label: "Total Items Listed",
    value: totals.products ?? 0,
    key: "items",
    icon: <Store size={24} className="text-[#037F44]" />,
    href: "/dashboard/items?tab=listed",
  };
  const swaps: Stat = {
    label: "Active Swaps",
    value: totals.activeSwaps ?? 0,
    key: "swaps",
    icon: <Repeat size={24} className="text-[#037F44]" />,
    href: "/dashboard/items?tab=swap-requests",
  };
  const pendingVerifications: Stat = {
    label: "Pending Verifications",
    value: totals.pendingVerifications ?? 0,
    key: "pendingVerifications",
    icon: <ShieldCheck size={24} className="text-[#037F44]" />,
    href: "/dashboard/user?tab=verification",
  };
  const openDisputes: Stat = {
    label: "Open Disputes",
    value: totals.openDisputes ?? 0,
    key: "openDisputes",
    icon: <ShieldAlert size={24} className="text-[#037F44]" />,
    href: "/dashboard/disputes",
  };
  const highRiskOrders: Stat = {
    label: "High-Risk Orders",
    value: totals.highRiskOrders ?? 0,
    key: "highRiskOrders",
    icon: <AlertTriangle size={24} className="text-[#037F44]" />,
    href: "/dashboard/risk",
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white w-full h-[90px] rounded-lg shadow p-6 flex flex-col justify-center animate-pulse"
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
              <Link
                key={stat.label}
                href={stat.href}
                className="group bg-white w-full h-[90px] rounded-lg shadow p-6 flex flex-col justify-center cursor-pointer transition-shadow hover:shadow-md active:bg-[#F7F8FB]"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs md:text-sm text-[#6b6b6b] mb-1">
                      {stat.label}
                    </div>
                    <div className="md:text-2xl text-lg font-bold text-[#353535]" title={stat.title}>
                      {stat.value}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-[#9a9a9a] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}

export default StatsCard;
