"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gavel } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useRole } from "@/hooks/useRole";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import ProtectedRoute from "@/components/ProtectedRoute";

type AuctionState =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHING"
  | "ACTIVE"
  | "ENDED"
  | "AWAITING_PAYMENT"
  | "COMPLETED"
  | "CANCELLED";

interface AdminAuction {
  id: number;
  state: AuctionState;
  referencePrice: string;
  maxStartingPrice: string;
  startingPrice: string;
  currentBid: string | null;
  bidCount: number;
  sharpShapListingId: string | null;
  syncStatus: "published" | "syncing" | "error";
  syncError: string | null;
  winnerDisplayName: string | null;
  createdAt: string;
  Product?: { id: number; name: string; imageUrl?: string; categoryId?: number };
  Seller?: { id: number; firstName: string; lastName: string; storeName?: string | null; email?: string };
}

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "PENDING_REVIEW", label: "Pending Review" },
  { key: "ACTIVE", label: "Active" },
  { key: "ENDED", label: "Ended" },
  { key: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATE_STYLES: Record<AuctionState, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-[#e6f9f0] text-[#037F44]",
  ENDED: "bg-gray-100 text-gray-600",
  AWAITING_PAYMENT: "bg-[#fef9ec] text-[#a9791f]",
  COMPLETED: "bg-[#e6f9f0] text-[#037F44]",
  CANCELLED: "bg-red-100 text-red-600",
};

const fmt = (n: string | number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(Number(n));

function AuctionsPageContent() {
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [approveTarget, setApproveTarget] = useState<AdminAuction | null>(null);
  const [approveReferencePrice, setApproveReferencePrice] = useState("");
  const [cancelTarget, setCancelTarget] = useState<AdminAuction | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canModerate = isAdmin || isSuperAdmin;

  const fetchAuctions = () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const query = filter ? `?state=${filter}` : "";
    fetch(`${API_URL}/api/admin/auctions${query}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setAuctions(Array.isArray(data.data) ? data.data : []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAuctions, [token, filter]);

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const referencePrice = Number(approveReferencePrice);
    if (!referencePrice || referencePrice <= 0) {
      setActionError("Enter a valid reference price.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/auctions/${approveTarget.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referencePrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve auction");
      setApproveTarget(null);
      setApproveReferencePrice("");
      fetchAuctions();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/auctions/${cancelTarget.id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel auction");
      setCancelTarget(null);
      setCancelReason("");
      fetchAuctions();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div>
        <h1 className="text-[20px] font-semibold text-[#353535]">Auction Management</h1>
        <p className="text-sm text-[#848484] mt-1">
          Review, approve, and monitor auctions distributed to SharpShap.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key ? "bg-[#037F44] text-white" : "bg-white text-[#505050] border border-[#e5e7eb] hover:border-[#037F44]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#848484]">Loading auctions…</p>
      ) : auctions.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow">
          <Gavel size={28} className="text-[#037F44] mx-auto mb-3" />
          <p className="text-[#848484]">No auctions match this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="bg-[#f8f9fb] border-b border-[#e5e7eb] text-left">
                  {["Item", "Seller", "Price", "Bids", "State", "SharpShap", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#848484] font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auctions.map((a) => (
                  <tr key={a.id} className="border-b border-[#f3f3f3] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={a.Product?.imageUrl}
                          alt={a.Product?.name || "Item"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <Link href={`/dashboard/items/listed/${a.Product?.id}`} className="text-sm text-[#037F44] hover:underline">
                          {a.Product?.name || `#${a.id}`}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1B2559]">
                      {a.Seller?.storeName || `${a.Seller?.firstName ?? ""} ${a.Seller?.lastName ?? ""}`.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1B2559]">
                      <div>{fmt(a.currentBid ?? a.startingPrice)}</div>
                      <div className="text-xs text-[#848484]">Ref: {fmt(a.referencePrice)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1B2559]">{a.bidCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_STYLES[a.state]}`}>
                        {a.state.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {!a.sharpShapListingId ? (
                        <span className="text-[#848484]">—</span>
                      ) : a.syncStatus === "error" ? (
                        <span className="text-red-600" title={a.syncError || undefined}>⚠ Sync issue</span>
                      ) : a.syncStatus === "syncing" ? (
                        <span className="text-[#a9791f]">Syncing…</span>
                      ) : (
                        <span className="text-[#037F44]">✓ Published</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canModerate && (
                        <div className="flex gap-2">
                          {a.state === "PENDING_REVIEW" && (
                            <button
                              onClick={() => { setApproveTarget(a); setApproveReferencePrice(""); setActionError(""); }}
                              className="text-xs font-semibold text-[#037F44] hover:underline"
                            >
                              Approve
                            </button>
                          )}
                          {!["COMPLETED", "CANCELLED", "ENDED"].includes(a.state) && (
                            <button
                              onClick={() => { setCancelTarget(a); setCancelReason(""); setActionError(""); }}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!approveTarget}
        title="Approve auction"
        message={
          <div className="flex flex-col gap-2">
            <p>
              Market price couldn&apos;t be determined automatically for {approveTarget?.Product?.name}. Set a
              reference price — the starting price ({fmt(approveTarget?.startingPrice ?? null)}) must still be at
              least 30% below it.
            </p>
            <input
              type="number"
              value={approveReferencePrice}
              onChange={(e) => setApproveReferencePrice(e.target.value)}
              placeholder="Reference price (₦)"
              className="w-full px-3 py-2 border rounded text-base text-gray-800"
              autoFocus
            />
            {actionError && <p className="text-red-600 text-xs">{actionError}</p>}
          </div>
        }
        confirmLabel="Approve & Publish"
        loading={actionLoading}
        onConfirm={confirmApprove}
        onClose={() => { setApproveTarget(null); setActionError(""); }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this auction?"
        message={
          <div className="flex flex-col gap-2">
            <p>This releases {cancelTarget?.Product?.name} back to normal sale. The seller will be notified.</p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 border rounded text-base text-gray-800"
            />
            {actionError && <p className="text-red-600 text-xs">{actionError}</p>}
          </div>
        }
        variant="danger"
        confirmLabel="Cancel Auction"
        loading={actionLoading}
        onConfirm={confirmCancel}
        onClose={() => { setCancelTarget(null); setActionError(""); }}
      />
    </div>
  );
}

export default function AuctionsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <AuctionsPageContent />
    </ProtectedRoute>
  );
}
