"use client";
import React from "react";

import StatsCard from "@/components/StatsCard";
import StatGraph from "@/components/StatGraph";
import RecentOrders from "@/components/RecentOrders";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 md:pr-8 md:pb-8  min-h-screen bg-[#F8F9FB]">
      {/* First Column: Stats Cards */}
      <StatsCard />
      {/* Second Column: Graphs */}
      <StatGraph />
      {/* Third Column: Recent Orders Table */}
      <RecentOrders />
    </div>
  );
}
