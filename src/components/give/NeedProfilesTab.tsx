"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

type NeedStatus = "OPEN" | "MATCHED" | "FULFILLED" | "CLOSED" | "WITHDRAWN";

interface NeedProfile {
  id: number;
  reason: string;
  deliveryAddress: string;
  status: NeedStatus;
  adminNotes: string | null;
  createdAt: string;
  User: { id: number; firstName: string; lastName: string; email: string; phone: string | null } | null;
  Category: { id: number; name: string } | null;
}

const STATUS_COLORS: Record<NeedStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  MATCHED: "bg-purple-100 text-purple-800",
  FULFILLED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-700",
  WITHDRAWN: "bg-gray-200 text-gray-700",
};

export default function NeedProfilesTab() {
  const token = useAuthToken();
  const [needs, setNeeds] = useState<NeedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NeedStatus | "">("");

  const fetchNeeds = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/needs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNeeds(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Need Profiles</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NeedStatus | "")}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="MATCHED">Matched</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CLOSED">Closed</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : needs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No need profiles found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Recipient</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reason</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Delivery Address</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {needs.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{n.User?.firstName} {n.User?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{n.Category?.name ?? "Any category"}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={n.reason}>{n.reason}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-500" title={n.deliveryAddress}>{n.deliveryAddress}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[n.status]}`}>{n.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(n.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
