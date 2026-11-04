"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

function MetricCard({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: string; href?: string }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">{label}</p>
        {href && (
          <ChevronRight
            size={14}
            className="shrink-0 text-[#9ca3af] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
          />
        )}
      </div>
      <p className="text-2xl font-bold text-[#353535]">{value}</p>
      {sub && <p className="text-xs text-[#9ca3af] mt-1">{sub}</p>}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="group bg-white rounded-2xl border border-[#e5e7eb] p-5 cursor-pointer transition-shadow hover:shadow-md active:bg-[#F7F8FB]"
      >
        {body}
      </Link>
    );
  }
  return <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">{body}</div>;
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
            <MetricCard label="Total Referrals" value={data.totalReferrals} href="/dashboard/marketing/referrals/referrals" />
            <MetricCard label="Qualified" value={data.qualifiedCount} sub={`${data.conversionRate}% conversion`} href="/dashboard/marketing/referrals/referrals?status=qualified" />
            {/* "Awaiting Qualification" and "Expired / Rejected" are each a
                combined count of two distinct statuses -- the referrals list
                now accepts a comma-separated status list (added for exactly
                this) so these can link to the exact matching set instead of
                a single status that would show a different count. */}
            <MetricCard label="Awaiting Qualification" value={data.registeredCount} href="/dashboard/marketing/referrals/referrals?status=registered,awaiting_qualification" />
            <MetricCard label="Store Owners Referred" value={data.storeOwnersReferred} href="/dashboard/marketing/referrals/referrals?accountType=STORE_OWNER" />
            <MetricCard label="Customers Referred" value={data.customersReferred} href="/dashboard/marketing/referrals/referrals?accountType=BUYER" />
            <MetricCard label="Expired / Rejected" value={data.expiredCount + data.rejectedCount} href="/dashboard/marketing/referrals/referrals?status=expired,rejected" />
            <MetricCard
              label="Pending Reward Liability"
              value={fmtNaira(data.pendingRewardLiability)}
              sub="Approved + awaiting review, not yet paid"
              href="/dashboard/marketing/referrals/rewards?status=pending_review,approved"
            />
            <MetricCard
              label="Awaiting Manual Review"
              value={data.pendingReviewCount}
              sub={fmtNaira(data.pendingReviewAmount)}
              href="/dashboard/marketing/referrals/rewards?status=pending_review"
            />
            <MetricCard
              label="Rewards Paid"
              value={data.paidCount}
              sub={fmtNaira(data.paidAmount)}
              href="/dashboard/marketing/referrals/rewards?status=paid"
            />
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
