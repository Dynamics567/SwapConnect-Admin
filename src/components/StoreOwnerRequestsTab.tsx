"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type PendingAction = { kind: "approve" | "decline"; title: string; message: string };
type RequestStatus = "pending_review" | "approved" | "declined";

interface PersonSummary {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  accountType: string;
  createdAt: string;
}

interface StoreOwnerRequest {
  id: string | number;
  userId: string | number;
  storeName: string;
  businessCategory: string;
  businessDescription: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  additionalInfo: string | null;
  status: RequestStatus;
  reviewedByAdminId: string | number | null;
  declineReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  User: PersonSummary;
  ReviewedByAdmin: { id: string | number; firstName: string; lastName: string } | null;
}

interface Stats {
  pending: number;
  approved: number;
  declined: number;
  thisMonth: number;
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending_review: "Pending",
  approved: "Approved",
  declined: "Declined",
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3 w-[180px] h-[74px]">
      <span className="w-9 h-9 rounded-full bg-[#F7F8FB] flex items-center justify-center shrink-0 text-[#037F44] font-bold text-sm">
        {value}
      </span>
      <p className="text-xs text-[#6b6b6b]">{label}</p>
    </div>
  );
}

const formatDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

const locationOf = (r: StoreOwnerRequest) => [r.city, r.state, r.country].filter(Boolean).join(", ") || "—";

// Buyer-to-Store-Owner upgrade requests. Same review shape as
// SellerVerificationTab (list -> row click opens a detail drawer -> reason
// required before decline -> ConfirmDialog -> PUT + refetch), since
// reviewing a business-upgrade request is the same kind of judgment call
// staff already make in that queue.
export default function StoreOwnerRequestsTab() {
  const token = useAuthToken();
  const [requests, setRequests] = useState<StoreOwnerRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("pending_review");

  const [selected, setSelected] = useState<StoreOwnerRequest | null>(null);
  const [previousRequests, setPreviousRequests] = useState<StoreOwnerRequest[]>([]);
  const [declineReason, setDeclineReason] = useState("");
  const [actionLoading, setActionLoading] = useState<"approve" | "decline" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`${API_URL}/api/admin/store-owner-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data.data ?? []);
      setStats(data.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openDetail = async (item: StoreOwnerRequest) => {
    setSelected(item);
    setDeclineReason("");
    setActionError(null);
    setPreviousRequests([]);
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/store-owner-requests/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPreviousRequests((data.previousRequests ?? []).filter((r: StoreOwnerRequest) => r.id !== item.id));
    } catch {
      // Detail info is a nice-to-have -- the list row already has enough to review.
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDeclineReason("");
    setActionError(null);
    setPreviousRequests([]);
  };

  const requestApprove = () => {
    if (!selected) return;
    setPendingAction({
      kind: "approve",
      title: "Approve Store Owner Request?",
      message: `This will upgrade ${selected.User?.firstName} ${selected.User?.lastName ?? ""} from Buyer to Store Owner and activate Store Owner capabilities.`,
    });
  };

  const requestDecline = () => {
    if (!selected) return;
    if (!declineReason.trim()) {
      setActionError("Please explain why this request is being declined -- the user will see this reason.");
      return;
    }
    setPendingAction({
      kind: "decline",
      title: "Decline Store Owner Request?",
      message: "The user will be notified with your reason and can submit a new request any time.",
    });
  };

  const confirmPendingAction = async () => {
    if (!selected || !token || !pendingAction) return;
    const { kind } = pendingAction;
    setActionLoading(kind);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/store-owner-requests/${selected.id}/${kind === "approve" ? "approve" : "decline"}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: kind === "decline" ? JSON.stringify({ reason: declineReason }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message ?? `Failed to ${kind} request.`);
        return;
      }
      setSelected(data.data);
      await fetchRequests();
    } catch {
      setActionError(`Failed to ${kind} request.`);
    } finally {
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  const canReview = !!selected && selected.status === "pending_review";

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store Owner Requests</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Buyers requesting to become Store Owners. Approving upgrades their account immediately.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
          className="border rounded-lg px-3 py-2 text-sm h-fit"
        >
          <option value="">All Status</option>
          <option value="pending_review">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-4 mb-6">
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Declined" value={stats.declined} />
          <StatCard label="This Month" value={stats.thisMonth} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No requests found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Store Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reviewed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(item)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.User ? `${item.User.firstName} ${item.User.lastName}` : "—"}</p>
                    <p className="text-xs text-gray-400">{item.User?.email}</p>
                  </td>
                  <td className="px-4 py-3">{item.storeName}</td>
                  <td className="px-4 py-3 text-gray-500">{locationOf(item)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(item.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.ReviewedByAdmin ? `${item.ReviewedByAdmin.firstName} ${item.ReviewedByAdmin.lastName}` : "—"}
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
              <h2 className="text-lg font-bold">Request #{selected.id}</h2>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="mb-4">
              <StatusBadge status={selected.status} />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">User Information</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-0.5">
                <p className="font-medium">{selected.User?.firstName} {selected.User?.lastName}</p>
                <p className="text-gray-500 text-xs break-all">{selected.User?.email}</p>
                {selected.User?.phone && <p className="text-gray-500 text-xs">{selected.User.phone}</p>}
                <p className="text-gray-500 text-xs">Current role: {selected.User?.accountType}</p>
                <p className="text-gray-500 text-xs">Joined {formatDate(selected.User?.createdAt)}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Store Information</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-gray-500">Store name:</span> {selected.storeName}</p>
                <p><span className="text-gray-500">Category:</span> {selected.businessCategory}</p>
                <p><span className="text-gray-500">Location:</span> {locationOf(selected)}</p>
                {selected.address && <p><span className="text-gray-500">Address:</span> {selected.address}</p>}
                <p className="whitespace-pre-wrap pt-1 border-t border-gray-200 mt-1">{selected.businessDescription}</p>
                {selected.additionalInfo && (
                  <p className="text-gray-500 italic pt-1">&quot;{selected.additionalInfo}&quot;</p>
                )}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Submitted</p>
                <p>{formatDate(selected.submittedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Reviewed</p>
                <p>{formatDate(selected.reviewedAt)}</p>
              </div>
            </div>

            {selected.status === "declined" && selected.declineReason && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-bold text-red-700 uppercase mb-1">Decline reason</p>
                <p className="text-sm text-red-800">{selected.declineReason}</p>
              </div>
            )}

            {previousRequests.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Previous Requests</p>
                <div className="space-y-2">
                  {previousRequests.map((r) => (
                    <div key={r.id} className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-center justify-between">
                      <span>{r.storeName} · {formatDate(r.submittedAt)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canReview && (
              <div className="mb-6">
                <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                  Reason for declining <span className="normal-case font-normal">(required to decline)</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason..."
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            )}

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {actionError}
              </div>
            )}

            <div className="space-y-2">
              {canReview ? (
                <>
                  <button
                    onClick={requestApprove}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#037F44] text-white py-3 rounded-lg font-semibold hover:bg-[#026835] transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "approve" ? "Approving…" : "Approve Request"}
                  </button>
                  <button
                    onClick={requestDecline}
                    disabled={actionLoading !== null}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "decline" ? "Declining…" : "Decline Request"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center pt-2">
                  This request is {STATUS_LABELS[selected.status].toLowerCase()} and no further action is available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.title ?? ""}
        message={pendingAction?.message ?? ""}
        variant={pendingAction?.kind === "decline" ? "danger" : "default"}
        confirmLabel={pendingAction?.kind === "decline" ? "Decline Request" : "Approve & Upgrade"}
        loading={actionLoading !== null}
        onConfirm={confirmPendingAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
