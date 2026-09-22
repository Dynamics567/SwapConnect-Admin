"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "./ProtectedRoute";

type SwapStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

interface SwapRequestItem {
  id: number;
  referenceId: string;
  userId: number;
  tradeInSpecs: Record<string, string>;
  tradeInEstimatedValue: string | number;
  targetProductId: number;
  targetProductName: string;
  targetProductPrice: string | number;
  balanceAmount: string | number;
  paymentStatus: "UNPAID" | "PAID";
  status: SwapStatus;
  storeOwnerNotes: string | null;
  createdAt: string;
  User?: { id: number; firstName: string; lastName: string; email: string };
  TargetProduct?: { id: number; name: string; imageUrl?: string; user?: number };
}

const STATUS_COLORS: Record<SwapStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const formatNGN = (v: string | number | null | undefined) =>
  v != null && v !== ""
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(
        Number(v)
      )
    : "—";

export default function SwapRequestsTab() {
  const token = useAuthToken();
  const [swaps, setSwaps] = useState<SwapRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SwapStatus | "">("");
  const [selected, setSelected] = useState<SwapRequestItem | null>(null);
  const [newStatus, setNewStatus] = useState<SwapStatus>("APPROVED");
  const [storeOwnerNotes, setStoreOwnerNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSwaps = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`${API_URL}/api/swaps/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSwaps(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  const handleUpdateStatus = async () => {
    if (!selected || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/swaps/${selected.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, storeOwnerNotes }),
      });
      setSelected(null);
      setStoreOwnerNotes("");
      await fetchSwaps();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}
    >
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Swap Requests</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SwapStatus | "")}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading…</div>
        ) : swaps.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No swap requests found.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Target Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Trade-In Value</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Balance Due</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {swaps.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.referenceId}</td>
                    <td className="px-4 py-3">
                      {item.User ? (
                        <>
                          <span className="font-medium">{item.User.firstName} {item.User.lastName}</span>
                          <div className="text-xs text-gray-400">{item.User.email}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{item.targetProductName}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatNGN(item.tradeInEstimatedValue)}</td>
                    <td className="px-4 py-3">{formatNGN(item.balanceAmount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
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
                          setNewStatus(item.status === "PENDING" ? "APPROVED" : item.status);
                          setStoreOwnerNotes(item.storeOwnerNotes ?? "");
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
                <h2 className="text-lg font-bold">Review Swap Request</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Reference</p>
                <p className="font-mono font-semibold text-sm">{selected.referenceId}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-medium text-sm">
                  {selected.User ? `${selected.User.firstName} ${selected.User.lastName} (${selected.User.email})` : "—"}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Trade-In Device</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {Object.entries(selected.tradeInSpecs)
                    .filter(([k]) => k !== "Device Photos")
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-500">{key}</span>
                        <span className="font-medium text-right max-w-[60%] truncate">{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trade-In Value</p>
                  <p className="text-lg font-bold text-green-700">{formatNGN(selected.tradeInEstimatedValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Target Product Price</p>
                  <p className="text-lg font-bold text-gray-700">{formatNGN(selected.targetProductPrice)}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Target Product</p>
                <p className="font-medium text-sm">{selected.targetProductName}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Balance to be Paid</p>
                <p className="text-lg font-bold text-gray-800">{formatNGN(selected.balanceAmount)}</p>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SwapStatus)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="APPROVED">Approve</option>
                  <option value="COMPLETED">Mark Completed</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                <textarea
                  value={storeOwnerNotes}
                  onChange={(e) => setStoreOwnerNotes(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection, or pickup/inspection instructions…"
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
    </ProtectedRoute>
  );
}
