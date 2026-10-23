"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtNaira } from "@/lib/financeFormat";

interface Overview {
  totalReferrals: number;
  registeredCount: number;
  qualifiedCount: number;
  expiredCount: number;
  rejectedCount: number;
  conversionRate: number;
  storeOwnersReferred: number;
  customersReferred: number;
  pendingRewardLiability: number;
  pendingReviewCount: number;
  pendingReviewAmount: number;
  paidCount: number;
  paidAmount: number;
}

function MetricCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#353535]">{value}</p>
      {sub && <p className="text-xs text-[#9ca3af] mt-1">{sub}</p>}
    </div>
  );
}

function ReferralOverviewContent() {
  const token = useAuthToken();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/overview`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load referral overview");
      setData(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <ReferralTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Referral &amp; Earn Overview</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Real, database-derived referral programme stats across every campaign.
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
        {loading && <div className="text-sm text-[#6b7280] p-6">Loading…</div>}

        {data && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard label="Total Referrals" value={data.totalReferrals} />
            <MetricCard label="Qualified" value={data.qualifiedCount} sub={`${data.conversionRate}% conversion`} />
            <MetricCard label="Awaiting Qualification" value={data.registeredCount} />
            <MetricCard label="Store Owners Referred" value={data.storeOwnersReferred} />
            <MetricCard label="Customers Referred" value={data.customersReferred} />
            <MetricCard label="Expired / Rejected" value={data.expiredCount + data.rejectedCount} />
            <MetricCard
              label="Pending Reward Liability"
              value={fmtNaira(data.pendingRewardLiability)}
              sub="Approved + awaiting review, not yet paid"
            />
            <MetricCard
              label="Awaiting Manual Review"
              value={data.pendingReviewCount}
              sub={fmtNaira(data.pendingReviewAmount)}
            />
            <MetricCard label="Rewards Paid" value={data.paidCount} sub={fmtNaira(data.paidAmount)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReferralOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <ReferralOverviewContent />
    </ProtectedRoute>
  );
}
