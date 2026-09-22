"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NewItems from "@/components/NewItems";
import SwapOffer from "@/components/SwapItems";
import ListedItems from "@/components/ListedItems";
import TradeInsTab from "@/components/TradeInsTab";
import SwapRequestsTab from "@/components/SwapRequestsTab";
import ProtectedRoute from "@/components/ProtectedRoute";

type Tab = "new" | "swap" | "listed" | "trade-ins" | "swap-requests";

function PageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("new");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "new" || tab === "swap" || tab === "listed" || tab === "trade-ins" || tab === "swap-requests") {
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
      <div className="flex flex-col gap-8 w-full min-w-0">
        <div className="flex gap-2 sm:gap-4 mb-3 bg-white p-2 rounded-xl w-fit max-w-full overflow-x-auto">
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "new"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("new")}
          >
            New Listing
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "swap"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("swap")}
          >
            Swap Offer
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "listed"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("listed")}
          >
            Listed Items
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "trade-ins"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("trade-ins")}
          >
            Trade-Ins
          </button>
          <button
            className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
              activeTab === "swap-requests"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("swap-requests")}
          >
            Swap Requests
          </button>
        </div>
        {activeTab === "new" && <NewItems />}
        {activeTab === "swap" && <SwapOffer />}
        {activeTab === "listed" && <ListedItems />}
        {activeTab === "trade-ins" && <TradeInsTab />}
        {activeTab === "swap-requests" && <SwapRequestsTab />}
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
