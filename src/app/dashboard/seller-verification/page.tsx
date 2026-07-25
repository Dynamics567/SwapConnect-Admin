"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

type VerificationStatus = "not_submitted" | "pending_review" | "approved" | "rejected";
type VerificationTier = "unverified" | "pending" | "verified" | "pro";
type DocumentType = "government_id" | "business_registration" | "utility_bill";

interface PersonSummary {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  storeName?: string | null;
  accountType?: string;
}

interface SellerVerification {
  id: string | number;
  userId: string | number;
  tier: VerificationTier;
  documentType: DocumentType | null;
  documentUrls: string[];
  status: VerificationStatus;
  reviewedByAdminId: string | number | null;
  reviewNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  User: PersonSummary;
  ReviewedByAdmin: { id: string | number; firstName: string; lastName: string } | null;
}

const STATUS_LABELS: Record<VerificationStatus, string> = {
  not_submitted: "Not Submitted",
  pending_review: "Awaiting Review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<VerificationStatus, string> = {
  not_submitted: "bg-gray-100 text-gray-600",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const TIER_LABELS: Record<VerificationTier, string> = {
  unverified: "Unverified",
  pending: "Pending",
  verified: "Verified",
  pro: "Pro",
};

const TIER_COLORS: Record<VerificationTier, string> = {
  unverified: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-[#e6f9f0] text-[#037F44]",
  pro: "bg-[#fef9c3] text-[#713f12]",
};

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  government_id: "Government-issued ID",
  business_registration: "Business Registration",
  utility_bill: "Utility Bill",
};

function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function TierBadge({ tier }: { tier: VerificationTier }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${TIER_COLORS[tier]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}

const formatDate = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(url);

export default function SellerVerificationPage() {
  const token = useAuthToken();
  const [submissions, setSubmissions] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "">("pending_review");

  const [selected, setSelected] = useState<SellerVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | "pro" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`${API_URL}/api/admin/seller-verification?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openDetail = (item: SellerVerification) => {
    setSelected(item);
    setReviewNotes(item.reviewNotes ?? "");
    setActionError(null);
  };

  const closeDetail = () => {
    setSelected(null);
    setReviewNotes("");
    setActionError(null);
  };

  const refreshAfterAction = async (updated?: SellerVerification) => {
    if (updated) {
      setSelected(updated);
      setReviewNotes(updated.reviewNotes ?? "");
    }
    await fetchSubmissions();
  };

  const handleApprove = async () => {
    if (!selected || !token) return;
    if (!window.confirm(`Approve this submission and mark ${selected.User?.firstName} as a Verified Seller?`)) return;

    setActionLoading("approve");
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/seller-verification/${selected.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message ?? "Failed to approve submission.");
        return;
      }
      await refreshAfterAction(data.data);
    } catch {
      setActionError("Failed to approve submission.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selected || !token) return;
    if (!reviewNotes.trim()) {
      setActionError("Please explain why this submission is being rejected -- the seller will see this note.");
      return;
    }
    if (!window.confirm("Reject this submission? The seller will be notified with your note.")) return;

    setActionLoading("reject");
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/seller-verification/${selected.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message ?? "Failed to reject submission.");
        return;
      }
      await refreshAfterAction(data.data);
    } catch {
      setActionError("Failed to reject submission.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantPro = async () => {
    if (!selected || !token) return;
    if (!window.confirm(`Grant Pro Seller tier to ${selected.User?.firstName} ${selected.User?.lastName}? This is a manual business decision, not part of the document review.`)) return;

    setActionLoading("pro");
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/seller-verification/${selected.userId}/tier`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: "pro", reviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message ?? "Failed to grant Pro tier.");
        return;
      }
      await refreshAfterAction(data.data);
    } catch {
      setActionError("Failed to grant Pro tier.");
    } finally {
      setActionLoading(null);
    }
  };

  const canReview = !!selected && selected.status === "pending_review";
  const canGrantPro = !!selected && selected.status === "approved" && selected.tier !== "pro";

  return (
    <div className="pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seller Verification</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Manual document review only -- there is no automated identity check. Approve or reject based on what you
            can actually see in the uploaded document.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | "")}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending_review">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="not_submitted">Not Submitted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No submissions found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Seller</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Document</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tier</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reviewed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(item)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {item.User ? `${item.User.firstName} ${item.User.lastName}` : "—"}
                    </p>
                    {item.User?.storeName && <p className="text-xs text-gray-400">{item.User.storeName}</p>}
                  </td>
                  <td className="px-4 py-3">{item.documentType ? DOCUMENT_LABELS[item.documentType] : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={item.tier} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(item.submittedAt)}</td>
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
              <h2 className="text-lg font-bold">Verification #{selected.id}</h2>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="mb-4 flex gap-2">
              <StatusBadge status={selected.status} />
              <TierBadge tier={selected.tier} />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Seller</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium">
                  {selected.User?.firstName} {selected.User?.lastName}
                </p>
                <p className="text-gray-500 text-xs break-all">{selected.User?.email}</p>
                {selected.User?.storeName && <p className="text-gray-500 text-xs">{selected.User.storeName}</p>}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Document Type</p>
              <p className="text-sm font-medium">
                {selected.documentType ? DOCUMENT_LABELS[selected.documentType] : "—"}
              </p>
            </div>

            {/* Documents */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                Uploaded Documents
              </p>
              {selected.documentUrls && selected.documentUrls.length > 0 ? (
                <div className="space-y-2">
                  {selected.documentUrls.map((url, i) =>
                    isImageUrl(url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt={`Document ${i + 1}`}
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
                <p className="text-sm text-gray-400">No documents on file.</p>
              )}
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

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Reviewed By</p>
              <p className="text-sm">
                {selected.ReviewedByAdmin
                  ? `${selected.ReviewedByAdmin.firstName} ${selected.ReviewedByAdmin.lastName}`
                  : "Not yet reviewed"}
              </p>
            </div>

            {/* Review notes */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                Review Notes {canReview && <span className="normal-case font-normal">(required to reject)</span>}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="What did you see in the document? If rejecting, explain what's missing or unclear so the seller can fix it…"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                disabled={!canReview && !canGrantPro}
              />
            </div>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {actionError}
              </div>
            )}

            <div className="space-y-2">
              {canReview && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#037F44] text-white py-3 rounded-lg font-semibold hover:bg-[#026835] transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "approve" ? "Approving…" : "Approve — Verified Seller"}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading !== null}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                </>
              )}

              {canGrantPro && (
                <button
                  onClick={handleGrantPro}
                  disabled={actionLoading !== null}
                  className="w-full bg-[#d7a825] text-white py-3 rounded-lg font-semibold hover:bg-[#b8911e] transition-colors disabled:opacity-60"
                >
                  {actionLoading === "pro" ? "Granting…" : "Grant Pro Seller Tier"}
                </button>
              )}

              {!canReview && !canGrantPro && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  This submission is {STATUS_LABELS[selected.status].toLowerCase()} and no further review action is
                  available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
