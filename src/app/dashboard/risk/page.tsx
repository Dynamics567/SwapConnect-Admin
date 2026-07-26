"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";

type RiskLabel = "low" | "medium" | "high";

interface RiskBuyer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

interface RiskProduct {
  id: number;
  name: string;
}

interface RiskOrder {
  id: number;
  userId: number;
  sellerId: number | null;
  totalAmount: string | number;
  address: string;
  status: string;
  escrowStatus: string;
  paymentCompleted: boolean;
  createdAt: string;
  buyer: RiskBuyer | null;
  products: RiskProduct[];
  riskScore: number;
  riskLabel: RiskLabel;
  riskReasons: string[];
}

interface RiskMeta {
  scannedCount: number;
  flaggedCount: number;
  highCount: number;
  mediumCount: number;
  riskLabelThresholds: { HIGH: number; MEDIUM: number };
}

const LABEL_STYLES: Record<RiskLabel, string> = {
  low: "bg-green-50 text-green-700 border border-green-200",
  medium: "bg-amber-100 text-amber-800 border border-amber-200",
  high: "bg-red-100 text-red-800 border border-red-200",
};

const LABEL_TEXT: Record<RiskLabel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const formatNGN = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
};

const formatDateTime = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export default function RiskReviewPage() {
  const token = useAuthToken();
  const [orders, setOrders] = useState<RiskOrder[]>([]);
  const [meta, setMeta] = useState<RiskMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [labelFilter, setLabelFilter] = useState<"" | "medium" | "high">("");
  const [scanLimit, setScanLimit] = useState(200);

  // Message modal state (reuses the existing admin-message endpoint -- the
  // only action this page takes, and it's entirely admin-initiated).
  const [messageTarget, setMessageTarget] = useState<RiskBuyer | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const fetchRiskOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: String(scanLimit) });
    if (labelFilter) params.set("label", labelFilter);

    try {
      const res = await fetch(`${API_URL}/api/admin/risk/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load risk data");
        setOrders([]);
        setMeta(null);
        return;
      }
      setOrders(data.data?.orders ?? []);
      setMeta(data.data?.meta ?? null);
    } catch {
      setError("Failed to load risk data");
    } finally {
      setLoading(false);
    }
  }, [token, labelFilter, scanLimit]);

  useEffect(() => {
    fetchRiskOrders();
  }, [fetchRiskOrders]);

  const openMessageModal = (buyer: RiskBuyer) => {
    setMessageTarget(buyer);
    setMessageSubject("");
    setMessageBody("");
    setMessageError("");
    setMessageSent(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !messageTarget) return;
    if (!messageSubject.trim() || !messageBody.trim()) {
      setMessageError("Subject and message are both required");
      return;
    }
    setMessageError("");
    setMessageSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${messageTarget.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: messageSubject, message: messageBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send message");
      setMessageSent(true);
    } catch (err: unknown) {
      setMessageError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="pt-[110px] md:pl-[320px] pl-8 pr-8 pb-10 min-h-screen bg-[#F8F9FB]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#353535]">Risk &amp; Fraud Review</h1>
          <p className="text-sm text-[#848484] mt-1">
            Advisory order screening for staff review
          </p>
        </div>

        {/* Explicit "what this is / isn't" disclaimer -- required reading, not
            an afterthought, since the whole point is not to overclaim. */}
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-4 mb-6 text-sm leading-relaxed">
          <p className="font-semibold mb-1">This is a simple rule-based checklist, not fraud detection.</p>
          <p>
            Each order is scored by adding up points for a handful of plain,
            explainable rules (e.g. a brand-new account placing a large first
            order, or several orders in rapid succession). There is no AI or
            machine learning involved, and no order is ever automatically
            blocked, cancelled, held, or refunded because of a score shown
            here. A high score just means &ldquo;a human should take a look&rdquo; --
            it can absolutely be a false positive. Use the Dispute console or
            the message action below to actually investigate and act.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#848484] uppercase tracking-wide">
              Show
            </label>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value as "" | "medium" | "high")}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All scanned orders</option>
              <option value="medium">Medium &amp; High risk only</option>
              <option value="high">High risk only</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#848484] uppercase tracking-wide">
              Scan last
            </label>
            <select
              value={scanLimit}
              onChange={(e) => setScanLimit(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value={50}>50 orders</option>
              <option value={200}>200 orders</option>
              <option value={500}>500 orders</option>
            </select>
          </div>
          <button
            onClick={fetchRiskOrders}
            className="text-sm px-3 py-2 rounded-lg border bg-white text-[#353535] hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* Summary */}
        {meta && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xl font-bold text-[#353535]">{meta.scannedCount}</div>
              <div className="text-xs text-[#848484] mt-0.5">Orders scanned</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xl font-bold text-[#353535]">{meta.flaggedCount}</div>
              <div className="text-xs text-[#848484] mt-0.5">With at least one flag</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xl font-bold text-amber-600">{meta.mediumCount}</div>
              <div className="text-xs text-[#848484] mt-0.5">Medium risk</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xl font-bold text-red-600">{meta.highCount}</div>
              <div className="text-xs text-[#848484] mt-0.5">High risk</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading…</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No orders match this filter. That&apos;s expected at this pilot&apos;s current scale --
            it does not mean the tool is broken.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Buyer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Risk</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Why flagged</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id}</td>
                    <td className="px-4 py-3">
                      {o.buyer ? (
                        <div>
                          <div className="font-medium text-gray-800">
                            {o.buyer.firstName} {o.buyer.lastName}
                          </div>
                          <div className="text-xs text-gray-400 break-all">{o.buyer.email}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {formatNGN(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                      <div>{o.status}</div>
                      <div className="text-gray-400">escrow: {o.escrowStatus}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${LABEL_STYLES[o.riskLabel]}`}
                      >
                        {LABEL_TEXT[o.riskLabel]} ({o.riskScore})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                      {o.riskReasons.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {o.riskReasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-300">No rules triggered</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {o.buyer && (
                          <Link
                            href={`/dashboard/user/${o.buyer.id}`}
                            className="text-xs font-medium text-[#037F44] hover:underline"
                          >
                            View buyer
                          </Link>
                        )}
                        <Link
                          href="/dashboard/disputes"
                          className="text-xs font-medium text-gray-500 hover:underline"
                        >
                          Dispute console
                        </Link>
                        {o.buyer && (
                          <button
                            onClick={() => openMessageModal(o.buyer as RiskBuyer)}
                            className="text-xs font-medium text-blue-600 hover:underline text-left"
                          >
                            Message buyer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message modal -- the one real, human-initiated action available from
          this page. Sending a message never changes order/payment state. */}
      {messageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#353535]">
                  Message {messageTarget.firstName} {messageTarget.lastName}
                </h2>
                <p className="text-xs text-[#848484] mt-0.5">
                  Sent as an in-app notification and an email to {messageTarget.email}
                </p>
              </div>
              <button
                onClick={() => setMessageTarget(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {messageSent ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-700 mb-4">Message sent.</p>
                <button
                  onClick={() => setMessageTarget(null)}
                  className="px-4 py-2 bg-[#037F44] text-white rounded text-sm font-medium hover:bg-[#025e2e]"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
                    placeholder="e.g. Quick check on your recent order"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
                    placeholder="Write your message…"
                  />
                </div>
                {messageError && <p className="text-red-500 text-sm">{messageError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setMessageTarget(null)}
                    className="flex-1 px-4 py-2 border rounded text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={messageSending}
                    className={`flex-1 px-4 py-2 bg-[#037F44] text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      messageSending ? "opacity-60 cursor-not-allowed" : "hover:bg-[#025e2e]"
                    }`}
                  >
                    {messageSending && (
                      <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {messageSending ? "Sending…" : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
