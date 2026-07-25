"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_refund_buyer"
  | "resolved_release_seller"
  | "closed";

type DisputeReason =
  | "item_not_as_described"
  | "item_not_received"
  | "damaged_item"
  | "wrong_item"
  | "other";

interface PersonSummary {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
}

interface OrderSummary {
  id: string | number;
  totalAmount: number | string;
  sellerPayoutAmount: number | string;
  status: string;
  escrowStatus: string;
}

interface Dispute {
  id: string | number;
  orderId: string | number;
  complainantId: string | number;
  sellerId: string | number;
  reason: DisputeReason;
  description: string | null;
  evidenceUrls: string[];
  status: DisputeStatus;
  assignedAdminId: string | number | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  Order: OrderSummary;
  Complainant: PersonSummary;
  Seller: PersonSummary;
  AssignedAdmin: { id: string | number; firstName: string; lastName: string } | null;
}

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved_refund_buyer: "Resolved — Refunded Buyer",
  resolved_release_seller: "Resolved — Released Seller",
  closed: "Closed",
};

const STATUS_COLORS: Record<DisputeStatus, string> = {
  open: "bg-red-100 text-red-800",
  under_review: "bg-yellow-100 text-yellow-800",
  resolved_refund_buyer: "bg-blue-100 text-blue-800",
  resolved_release_seller: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

const REASON_LABELS: Record<DisputeReason, string> = {
  item_not_as_described: "Item Not As Described",
  item_not_received: "Item Not Received",
  damaged_item: "Damaged Item",
  wrong_item: "Wrong Item",
  other: "Other",
};

function StatusBadge({ status }: { status: DisputeStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const formatNGN = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
};

const formatDate = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(url);

export default function DisputesPage() {
  const token = useAuthToken();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "">("");

  const [selected, setSelected] = useState<Dispute | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<
    "assign" | "refund" | "release" | "close" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`${API_URL}/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDisputes(data.disputes ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openDetail = async (dispute: Dispute) => {
    setSelected(dispute);
    setAdminNotes(dispute.adminNotes ?? "");
    setActionError(null);
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/disputes/${dispute.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const full: Dispute | undefined = data.dispute ?? data;
        if (full && full.id) {
          setSelected(full);
          setAdminNotes(full.adminNotes ?? "");
        }
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setAdminNotes("");
    setActionError(null);
  };

  const refreshAfterAction = async (updated?: Dispute) => {
    if (updated) {
      setSelected(updated);
      setAdminNotes(updated.adminNotes ?? "");
    }
    await fetchDisputes();
  };

  const handleAssign = async () => {
    if (!selected || !token) return;
    setActionLoading("assign");
    setActionError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/disputes/${selected.id}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Failed to assign dispute.");
        return;
      }
      await refreshAfterAction(data.dispute);
    } catch {
      setActionError("Failed to assign dispute.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (resolution: "refund_buyer" | "release_seller") => {
    if (!selected || !token) return;

    const amount =
      resolution === "refund_buyer"
        ? formatNGN(selected.Order?.totalAmount)
        : formatNGN(selected.Order?.sellerPayoutAmount);
    const confirmMessage =
      resolution === "refund_buyer"
        ? `This will refund ${amount} to the buyer and the seller will not be paid. Continue?`
        : `This will release ${amount} to the seller and the buyer will not be refunded. Continue?`;

    if (!window.confirm(confirmMessage)) return;

    setActionLoading(resolution === "refund_buyer" ? "refund" : "release");
    setActionError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/disputes/${selected.id}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resolution, adminNotes }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Failed to resolve dispute.");
        return;
      }
      await refreshAfterAction(data.dispute);
    } catch {
      setActionError("Failed to resolve dispute.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async () => {
    if (!selected || !token) return;
    if (
      !window.confirm(
        "This will close the dispute without moving any money. Continue?"
      )
    )
      return;

    setActionLoading("close");
    setActionError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/disputes/${selected.id}/close`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ adminNotes }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Failed to close dispute.");
        return;
      }
      await refreshAfterAction(data.dispute);
    } catch {
      setActionError("Failed to close dispute.");
    } finally {
      setActionLoading(null);
    }
  };

  const canAssign = !!selected && !selected.assignedAdminId;
  const canResolveOrClose =
    !!selected &&
    (selected.status === "open" || selected.status === "under_review");

  return (
    <div className="pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Dispute Resolution</h1>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | "")}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved_refund_buyer">Resolved — Refund Buyer</option>
            <option value="resolved_release_seller">Resolved — Release Seller</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No disputes yet.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Complainant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Seller</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reason</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Assigned Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disputes.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openDetail(d)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{d.orderId}</td>
                  <td className="px-4 py-3">
                    {d.Complainant
                      ? `${d.Complainant.firstName} ${d.Complainant.lastName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {d.Seller ? `${d.Seller.firstName} ${d.Seller.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3">{REASON_LABELS[d.reason] ?? d.reason}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(d.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.AssignedAdmin
                      ? `${d.AssignedAdmin.firstName} ${d.AssignedAdmin.lastName}`
                      : "Unassigned"}
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
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Dispute #{selected.id}</h2>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {detailLoading && (
              <p className="text-xs text-gray-400 mb-4">Refreshing details…</p>
            )}

            <div className="mb-4">
              <StatusBadge status={selected.status} />
            </div>

            {/* Order info */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                Order
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-medium">#{selected.Order?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-medium">{formatNGN(selected.Order?.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seller Payout</span>
                  <span className="font-medium">
                    {formatNGN(selected.Order?.sellerPayoutAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Status</span>
                  <span className="font-medium capitalize">{selected.Order?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Escrow Status</span>
                  <span className="font-medium capitalize">
                    {selected.Order?.escrowStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Complainant / Seller */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                  Complainant
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">
                    {selected.Complainant?.firstName} {selected.Complainant?.lastName}
                  </p>
                  <p className="text-gray-500 text-xs break-all">
                    {selected.Complainant?.email}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                  Seller
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">
                    {selected.Seller?.firstName} {selected.Seller?.lastName}
                  </p>
                  <p className="text-gray-500 text-xs break-all">{selected.Seller?.email}</p>
                </div>
              </div>
            </div>

            {/* Reason / description */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                Reason
              </p>
              <p className="text-sm font-medium">
                {REASON_LABELS[selected.reason] ?? selected.reason}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selected.description || "No description provided."}
              </p>
            </div>

            {/* Evidence */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                Evidence
              </p>
              {selected.evidenceUrls && selected.evidenceUrls.length > 0 ? (
                <div className="space-y-2">
                  {selected.evidenceUrls.map((url, i) =>
                    isImageUrl(url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="max-w-full rounded-lg border"
                      />
                    ) : (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-[#037F44] underline break-all"
                      >
                        {url}
                      </a>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No evidence submitted.</p>
              )}
            </div>

            {/* Assigned admin */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                Assigned Admin
              </p>
              <p className="text-sm">
                {selected.AssignedAdmin
                  ? `${selected.AssignedAdmin.firstName} ${selected.AssignedAdmin.lastName}`
                  : "Unassigned"}
              </p>
            </div>

            {/* Admin notes */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Notes about the investigation or decision…"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {actionError}
              </div>
            )}

            <div className="space-y-2">
              {canAssign && (
                <button
                  onClick={handleAssign}
                  disabled={actionLoading !== null}
                  className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  {actionLoading === "assign" ? "Assigning…" : "Assign to Me"}
                </button>
              )}

              {canResolveOrClose && (
                <>
                  <button
                    onClick={() => handleResolve("refund_buyer")}
                    disabled={actionLoading !== null}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "refund" ? "Processing…" : "Refund Buyer"}
                  </button>
                  <button
                    onClick={() => handleResolve("release_seller")}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#037F44] text-white py-3 rounded-lg font-semibold hover:bg-[#026835] transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "release" ? "Processing…" : "Release to Seller"}
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={actionLoading !== null}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "close" ? "Closing…" : "Close Without Action"}
                  </button>
                </>
              )}

              {!canResolveOrClose && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  This dispute is {STATUS_LABELS[selected.status].toLowerCase()} and no further
                  action can be taken.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
