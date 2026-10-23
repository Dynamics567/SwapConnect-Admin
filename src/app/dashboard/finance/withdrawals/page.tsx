"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FinanceTabs from "@/components/finance/FinanceTabs";
import PageButton from "@/components/PageButton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtNaira, fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface WithdrawalRow {
  id: number; reference: string; seller: { id: number; name: string; email: string } | null;
  requestedAmount: number; withdrawalFee: number; netPayout: number; payoutDestination: string | null;
  providerReference: string | null; status: string; failureReason: string | null; requestedAt: string; completedAt: string | null;
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }

const STATUSES = ["", "pending", "success", "failed"];

function FinanceWithdrawalsContent() {
  const token = useAuthToken();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => { setPage(1); }, [status]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      const res = await fetch(`${API_URL}/api/admin/finance/withdrawals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load withdrawals");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <FinanceTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Withdrawals &amp; Payouts</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Every seller withdrawal across the platform, view-only. Retrying a failed payout isn&apos;t available
            here yet -- it needs an idempotency safeguard against double-paying a seller that this pass didn&apos;t
            build; verify the original Paystack transfer status manually before any manual retry.
          </p>
        </div>

        <div className="flex gap-2.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors ${
                status === s ? "bg-brand-emerald text-white border-brand-emerald" : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-brand-emerald"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4 text-right">Requested</th>
                <th className="py-3 px-4 text-right">Fee</th>
                <th className="py-3 px-4 text-right">Net Payout</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Requested</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">No withdrawals match these filters.</td></tr>}
              {!loading && rows.map((w) => (
                <tr key={w.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                  <td className="py-3 px-4 font-medium text-[#353535]">{w.reference}</td>
                  <td className="py-3 px-4">
                    <p className="text-[#353535]">{w.seller?.name || "—"}</p>
                    <p className="text-xs text-[#9ca3af]">{w.seller?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-right text-[#353535]">{fmtNaira(w.requestedAmount)}</td>
                  <td className="py-3 px-4 text-right text-[#6b7280]">{fmtNaira(w.withdrawalFee)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[#353535]">{fmtNaira(w.netPayout)}</td>
                  <td className="py-3 px-4 text-[#6b7280] text-xs">{w.payoutDestination || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(w.status)}`}>{w.status}</span>
                    {w.failureReason && <p className="text-[11px] text-red-600 mt-1 max-w-[160px]">{w.failureReason}</p>}
                  </td>
                  <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(w.requestedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <PageButton page={page} setPage={setPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} />
        )}
      </div>
    </div>
  );
}

export default function FinanceWithdrawalsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <FinanceWithdrawalsContent />
    </ProtectedRoute>
  );
}
