"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

type TradeInStatus = "pending" | "reviewed" | "accepted" | "rejected";
type DeviceType = "mobile" | "computer";

interface TradeIn {
  id: number;
  referenceId: string;
  userId: number;
  deviceType: DeviceType;
  specs: Record<string, string>;
  estimatedValue: string | null;
  status: TradeInStatus;
  adminNotes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<TradeInStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const formatNGN = (v: string | null) =>
  v
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(
        Number(v)
      )
    : "—";

export default function TradeInsPage() {
  const token = useAuthToken();
  const [submissions, setSubmissions] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TradeInStatus | "">("");
  const [deviceFilter, setDeviceFilter] = useState<DeviceType | "">("");
  const [selected, setSelected] = useState<TradeIn | null>(null);
  const [newStatus, setNewStatus] = useState<TradeInStatus>("reviewed");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (deviceFilter) params.set("deviceType", deviceFilter);

    try {
      const res = await fetch(`${API_URL}/api/trade-in/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, deviceFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleUpdateStatus = async () => {
    if (!selected || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/trade-in/admin/${selected.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      setSelected(null);
      setAdminNotes("");
      await fetchSubmissions();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Trade-In Submissions</h1>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TradeInStatus | "")}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value as DeviceType | "")}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Devices</option>
            <option value="mobile">Mobile</option>
            <option value="computer">Computer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No trade-in submissions found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reference</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Device</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Brand / Model</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">AI Estimate</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.referenceId}</td>
                  <td className="px-4 py-3 capitalize">{item.deviceType}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{item.specs.brand}</span>
                    {item.specs.model && <span className="text-gray-400 ml-1">{item.specs.model}</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-700">{formatNGN(item.estimatedValue)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelected(item);
                        setNewStatus(item.status === "pending" ? "reviewed" : item.status);
                        setAdminNotes(item.adminNotes ?? "");
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Review Trade-In</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Reference</p>
              <p className="font-mono font-semibold text-sm">{selected.referenceId}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Device Specs</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {Object.entries(selected.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">AI Estimated Value</p>
              <p className="text-2xl font-bold text-green-700">{formatNGN(selected.estimatedValue)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TradeInStatus)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="reviewed">Reviewed</option>
                <option value="accepted">Accept Trade-In</option>
                <option value="rejected">Reject Trade-In</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1">Admin Notes (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Reason for rejection, or instructions for collection…"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={saving}
              className="w-full bg-[#037F44] text-white py-3 rounded-lg font-semibold hover:bg-[#026835] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Decision"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
