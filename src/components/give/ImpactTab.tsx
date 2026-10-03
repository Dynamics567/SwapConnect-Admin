"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { Gift, PackageCheck, HeartHandshake, Users } from "lucide-react";

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
}

function Tile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
      <div className="bg-[#e6f9f0] text-[#037F44] rounded-full p-3">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
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
        <Tile label="Devices donated" value={metrics.submitted} icon={<Gift size={20} />} />
        <Tile label="Available to match" value={metrics.available} icon={<HeartHandshake size={20} />} />
        <Tile label="Matched / in progress" value={metrics.matched} icon={<Users size={20} />} />
        <Tile label="Allocated" value={metrics.allocated} icon={<PackageCheck size={20} />} />
        <Tile label="Delivered to recipients" value={metrics.completed} icon={<PackageCheck size={20} />} />
        <Tile label="Open needs" value={metrics.openNeeds} icon={<Users size={20} />} />
        <Tile label="Needs fulfilled" value={metrics.fulfilledNeeds} icon={<HeartHandshake size={20} />} />
        <Tile label="Rejected" value={metrics.rejected} icon={<Gift size={20} />} />
        <Tile label="Cancelled" value={metrics.cancelled} icon={<Gift size={20} />} />
      </div>
    </div>
  );
}
