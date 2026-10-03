"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DonationsTab from "@/components/give/DonationsTab";
import NeedProfilesTab from "@/components/give/NeedProfilesTab";
import AllocationsTab from "@/components/give/AllocationsTab";
import ImpactTab from "@/components/give/ImpactTab";
import ProtectedRoute from "@/components/ProtectedRoute";

type Tab = "donations" | "needs" | "allocations" | "impact";

function PageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("donations");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "donations" || tab === "needs" || tab === "allocations" || tab === "impact") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-8 w-full min-w-0">
        <div className="flex gap-2 sm:gap-4 mb-3 bg-white p-2 rounded-xl w-fit max-w-full overflow-x-auto">
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "donations" ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("donations")}
          >
            Donations
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "needs" ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("needs")}
          >
            Need Profiles
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "allocations" ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("allocations")}
          >
            Allocations
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "impact" ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("impact")}
          >
            Impact
          </button>
        </div>
        {activeTab === "donations" && <DonationsTab />}
        {activeTab === "needs" && <NeedProfilesTab />}
        {activeTab === "allocations" && <AllocationsTab />}
        {activeTab === "impact" && <ImpactTab />}
      </div>
    </ProtectedRoute>
  );
}

function Page() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}

export default Page;
