"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { Users, Gift, Banknote, Building2, Activity, Inbox, ChevronRight } from "lucide-react";
import { STATUSES, STATUS_LABELS, STATUS_STYLES, type EnquiryStatus } from "./contributorLabels";

interface Stats {
  total: number;
  newThisMonth: number;
  openUnassigned: number;
  followUps30d: number;
  byType: Record<"GIVE" | "SPONSOR" | "PARTNER", number>;
  byStatus: Record<EnquiryStatus, number>;
}

function Tile({ label, value, icon, href }: { label: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="group bg-white rounded-xl shadow p-5 flex items-center gap-4 transition-shadow hover:shadow-md">
      <div className="bg-[#e6f9f0] text-[#037F44] rounded-full p-3 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-gray-400 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
    </Link>
  );
}

export default function ContributorsOverviewTab() {
  const token = useAuthToken();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/contributors/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setStats(d.data ?? null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>;
  if (!stats) return <div className="text-center py-20 text-gray-400">No data yet.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Contributors Overview</h1>
      <p className="text-sm text-gray-500 mb-6">Give, sponsor and partner enquiries from the onboarding pathway. All figures are live.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Tile label="All enquiries" value={stats.total} icon={<Users size={20} />} href="/dashboard/contributors?tab=give" />
        <Tile label="New this month" value={stats.newThisMonth} icon={<Inbox size={20} />} href="/dashboard/contributors?tab=give" />
        <Tile label="Open & unassigned" value={stats.openUnassigned} icon={<Activity size={20} />} href="/dashboard/contributors?tab=give&assigned=unassigned" />
        <Tile label="Follow-ups (30 days)" value={stats.followUps30d} icon={<Activity size={20} />} href="/dashboard/contributors?tab=followups" />
        <Tile label="Device donations" value={stats.byType.GIVE} icon={<Gift size={20} />} href="/dashboard/contributors?tab=give" />
        <Tile label="Sponsorship enquiries" value={stats.byType.SPONSOR} icon={<Banknote size={20} />} href="/dashboard/contributors?tab=sponsor" />
        <Tile label="Partnership enquiries" value={stats.byType.PARTNER} icon={<Building2 size={20} />} href="/dashboard/contributors?tab=partner" />
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">By status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <span key={s} className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[s]}`}>
              {STATUS_LABELS[s]}
              <span className="font-bold tabular-nums">{stats.byStatus[s] ?? 0}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
