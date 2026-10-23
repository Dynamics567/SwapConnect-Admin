"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import PageButton from "@/components/PageButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useAuthContext } from "@/context/AuthContext";
import { API_URL } from "@/lib/config";
import { fmtNaira, fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface RewardRow {
  id: number;
  campaign: { id: number; name: string } | null;
  referrer: { id: number; name: string; email: string } | null;
  referred: { id: number; name: string; email: string } | null;
  qualifyingAction: string;
  amount: number;
  status: string;
  qualifiedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }

const STATUSES = ["", "pending_review", "approved", "paid", "rejected", "reversed"];

function ReferralRewardsContent() {
  const token = useAuthToken();
  const { role } = useAuthContext();
  const canAct = role === "superadmin";

  const [rows, setRows] = useState<RewardRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("pending_review");

  const [confirmAction, setConfirmAction] = useState<{ reward: RewardRow; type: "approve" | "reject" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setPage(1); }, [status]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      const res = await fetch(`${API_URL}/api/admin/referrals/rewards?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load rewards");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async () => {
    if (!token || !confirmAction) return;
    setSaving(true);
    try {
      const path = confirmAction.type === "approve" ? "approve" : "reject";
      const res = await fetch(`${API_URL}/api/admin/referrals/rewards/${confirmAction.reward.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: confirmAction.type === "reject" ? JSON.stringify({ reason: rejectReason }) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Action failed");
      setConfirmAction(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <ReferralTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Rewards</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Rewards from campaigns marked &quot;requires manual review&quot; wait here until approved or rejected.
            Everything else is auto-credited at qualification.
          </p>
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm max-w-xs">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>)}
        </select>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Referrer</th>
                <th className="py-3 px-4">Referred</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Qualified</th>
                {canAct && <th className="py-3 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[#9ca3af]">No rewards match these filters.</td></tr>}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                  <td className="py-3 px-4">
                    <p className="text-[#353535]">{r.referrer?.name || "—"}</p>
                    <p className="text-xs text-[#9ca3af]">{r.referrer?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-[#6b7280]">{r.referred?.name || "—"}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{r.campaign?.name || "—"}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[#353535]">{fmtNaira(r.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(r.status === "paid" || r.status === "approved" ? "success" : r.status === "rejected" || r.status === "reversed" ? "failed" : "pending")}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    {r.rejectionReason && <p className="text-[11px] text-red-600 mt-1 max-w-[160px]">{r.rejectionReason}</p>}
                  </td>
                  <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.qualifiedAt)}</td>
                  {canAct && (
                    <td className="py-3 px-4">
                      {r.status === "pending_review" ? (
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => setConfirmAction({ reward: r, type: "approve" })} className="text-brand-emerald hover:underline">Approve</button>
                          <button onClick={() => setConfirmAction({ reward: r, type: "reject" })} className="text-red-600 hover:underline">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <PageButton page={page} setPage={setPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} />
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === "approve" ? "Approve this reward?" : "Reject this reward?"}
        message={
          confirmAction?.type === "approve" ? (
            `This immediately credits ${fmtNaira(confirmAction.reward.amount)} to the referrer's wallet.`
          ) : (
            <div className="flex flex-col gap-2">
              <span>No money will move. Give a reason (shown in the audit log).</span>
              <textarea
                className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm"
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
              />
            </div>
          )
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve & credit" : "Reject"}
        variant={confirmAction?.type === "approve" ? "default" : "danger"}
        loading={saving}
        onConfirm={handleConfirm}
        onClose={() => { setConfirmAction(null); setRejectReason(""); }}
      />
    </div>
  );
}

export default function ReferralRewardsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <ReferralRewardsContent />
    </ProtectedRoute>
  );
}
