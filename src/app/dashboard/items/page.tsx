"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NewItems from "@/components/NewItems";
import SwapOffer from "@/components/SwapItems";
import ListedItems from "@/components/ListedItems";
import TradeInsTab from "@/components/TradeInsTab";
import ProtectedRoute from "@/components/ProtectedRoute";

type Tab = "new" | "swap" | "listed" | "trade-ins";

function PageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("new");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "new" || tab === "swap" || tab === "listed" || tab === "trade-ins") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <ProtectedRoute
      allowedRoles={[
        "superadmin",
        "admin",
        "supportagent",
        "verificationofficer",
      ]}
    >
      <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <div className="flex gap-4 mb-3 bg-white p-2 rounded-xl w-[524px]">
          <button
            className={`w-[115px] h-[32px] rounded-xl text-base transition ${
              activeTab === "new"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("new")}
          >
            New Listing
          </button>
          <button
            className={`w-[115px] h-[32px] rounded-xl text-base transition ${
              activeTab === "swap"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("swap")}
          >
            Swap Offer
          </button>
          <button
            className={`w-[115px] h-[32px] rounded-xl text-base transition ${
              activeTab === "listed"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("listed")}
          >
            Listed Items
          </button>
          <button
            className={`w-[115px] h-[32px] rounded-xl text-base transition ${
              activeTab === "trade-ins"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("trade-ins")}
          >
            Trade-Ins
          </button>
        </div>
        {activeTab === "new" && <NewItems />}
        {activeTab === "swap" && <SwapOffer />}
        {activeTab === "listed" && <ListedItems />}
        {activeTab === "trade-ins" && <TradeInsTab />}
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
