"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import PartnersTab from "@/components/campaigns/PartnersTab";
import CampaignsTab from "@/components/campaigns/CampaignsTab";
import { api, type Meta } from "@/components/campaigns/campaignLabels";
import { useAuthToken } from "@/hooks/useAuthToken";

type Tab = "campaigns" | "partners";
const TABS: { key: Tab; label: string }[] = [
  { key: "campaigns", label: "Campaigns" },
  { key: "partners", label: "Partner Platforms" },
];

function PageInner() {
  const searchParams = useSearchParams();
  const token = useAuthToken();
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [meta, setMeta] = useState<Meta | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "partners" || tab === "campaigns") setActiveTab(tab);
    else if (searchParams.get("partner")) setActiveTab("partners");
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    api<Meta>(token, "/meta")
      .then(setMeta)
      .catch(() => {});
  }, [token]);

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <div className="flex gap-2 sm:gap-4 bg-white p-2 rounded-xl w-fit max-w-full overflow-x-auto">
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
        {activeTab === "campaigns" && <CampaignsTab meta={meta} />}
        {activeTab === "partners" && <PartnersTab meta={meta} />}
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
