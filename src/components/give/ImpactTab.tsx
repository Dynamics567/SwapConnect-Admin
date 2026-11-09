"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { Gift, PackageCheck, HeartHandshake, Users, ChevronRight, MessageCircleHeart, ShieldAlert, Heart } from "lucide-react";

interface AppreciationMetrics {
  totalDelivered: number;
  receiptConfirmations: number;
  appreciationNotes: number;
  submissionRate: number;
  unresolvedDisputes: number;
  publicConsentCount: number;
}

interface ImpactMetrics {
  submitted: number;
  available: number;
  matched: number;
  allocated: number;
  completed: number;
  rejected: number;
  cancelled: number;
  openNeeds: number;
  fulfilledNeeds: number;
  appreciation?: AppreciationMetrics;
}

function Tile({ label, value, icon, href }: { label: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl shadow p-5 flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-md active:bg-[#F7F8FB]"
    >
      <div className="bg-[#e6f9f0] text-[#037F44] rounded-full p-3 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-gray-400 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
      />
    </Link>
  );
}

export default function ImpactTab() {
  const token = useAuthToken();
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/give/impact-metrics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setMetrics(data.data ?? null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>;
  if (!metrics) return <div className="text-center py-20 text-gray-400">No data yet.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Give Impact</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Tile label="Devices donated" value={metrics.submitted} icon={<Gift size={20} />} href="/dashboard/give?tab=donations&state=SUBMITTED" />
        <Tile label="Available to match" value={metrics.available} icon={<HeartHandshake size={20} />} href="/dashboard/give?tab=donations&state=AVAILABLE" />
        <Tile label="Matched / in progress" value={metrics.matched} icon={<Users size={20} />} href="/dashboard/give?tab=donations&state=MATCHED" />
        <Tile label="Allocated" value={metrics.allocated} icon={<PackageCheck size={20} />} href="/dashboard/give?tab=donations&state=ALLOCATED" />
        <Tile label="Delivered to recipients" value={metrics.completed} icon={<PackageCheck size={20} />} href="/dashboard/give?tab=donations&state=COMPLETED" />
        <Tile label="Open needs" value={metrics.openNeeds} icon={<Users size={20} />} href="/dashboard/give?tab=needs&status=OPEN" />
        <Tile label="Needs fulfilled" value={metrics.fulfilledNeeds} icon={<HeartHandshake size={20} />} href="/dashboard/give?tab=needs&status=FULFILLED" />
        <Tile label="Rejected" value={metrics.rejected} icon={<Gift size={20} />} href="/dashboard/give?tab=donations&state=REJECTED" />
        <Tile label="Cancelled" value={metrics.cancelled} icon={<Gift size={20} />} href="/dashboard/give?tab=donations&state=CANCELLED" />
      </div>

      {metrics.appreciation && (
        <>
          <h2 className="text-base font-bold text-gray-800 mb-4">Receipt &amp; Appreciation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-2">
            <Tile
              label="Gifts delivered"
              value={metrics.appreciation.totalDelivered}
              icon={<PackageCheck size={20} />}
              href="/dashboard/give?tab=giftManagement"
            />
            <Tile
              label="Receipt confirmations"
              value={metrics.appreciation.receiptConfirmations}
              icon={<MessageCircleHeart size={20} />}
              href="/dashboard/give?tab=giftManagement"
            />
            <Tile
              label="Appreciation notes received"
              value={metrics.appreciation.appreciationNotes}
              icon={<MessageCircleHeart size={20} />}
              href="/dashboard/give?tab=giftManagement&status=APPRECIATION_SUBMITTED"
            />
            <Tile
              label="Appreciation submission rate (%)"
              value={metrics.appreciation.submissionRate}
              icon={<Heart size={20} />}
              href="/dashboard/give?tab=giftManagement"
            />
            <Tile
              label="Unresolved delivery disputes"
              value={metrics.appreciation.unresolvedDisputes}
              icon={<ShieldAlert size={20} />}
              href="/dashboard/give?tab=giftManagement&status=DELIVERY_DISPUTED"
            />
            <Tile
              label="Consenting to public impact stories"
              value={metrics.appreciation.publicConsentCount}
              icon={<Heart size={20} />}
              href="/dashboard/give?tab=giftManagement"
            />
          </div>
        </>
      )}
    </div>
  );
}
