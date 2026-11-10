"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ContributorsOverviewTab from "@/components/contributors/ContributorsOverviewTab";
import EnquiriesTab from "@/components/contributors/EnquiriesTab";
import FollowUpsTab from "@/components/contributors/FollowUpsTab";

type Tab = "overview" | "give" | "sponsor" | "partner" | "followups";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "give", label: "Device Donations" },
  { key: "sponsor", label: "Sponsorship" },
  { key: "partner", label: "Partnership" },
  { key: "followups", label: "Follow-ups" },
];

function PageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (TABS.some((t) => t.key === tab)) setActiveTab(tab as Tab);
  }, [searchParams]);

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-8 w-full min-w-0">
        <div className="flex gap-2 sm:gap-4 mb-3 bg-white p-2 rounded-xl w-fit max-w-full overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-4 h-[32px] whitespace-nowrap rounded-xl text-base transition ${
                activeTab === t.key ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
              }`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === "overview" && <ContributorsOverviewTab />}
        {activeTab === "give" && <EnquiriesTab type="GIVE" />}
        {activeTab === "sponsor" && <EnquiriesTab type="SPONSOR" />}
        {activeTab === "partner" && <EnquiriesTab type="PARTNER" />}
        {activeTab === "followups" && <FollowUpsTab />}
      </div>
    </ProtectedRoute>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}
