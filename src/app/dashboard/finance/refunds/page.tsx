"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FinanceTabs from "@/components/finance/FinanceTabs";
import PageButton from "@/components/PageButton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtNaira, fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface RefundRow {
  id: number; reference: string; orderId: number | null; refundAmount: number; status: string; method: string;
  buyer: { id: number; name: string; email: string } | null; reason: string | null; disputeId: number | null;
  disputeStatus: string | null; createdAt: string;
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }

const REASON_LABELS: Record<string, string> = {
  item_not_as_described: "Item not as described",
  item_not_received: "Item not received",
  damaged_item: "Damaged item",
  wrong_item: "Wrong item",
  other: "Other",
};

function FinanceRefundsContent() {
  const token = useAuthToken();
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const res = await fetch(`${API_URL}/api/admin/finance/refunds?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load refunds");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <FinanceTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Refunds</h1>
          <p className="text-sm text-[#6b7280] mt-1 max-w-2xl">
            Refund transactions, joined to their originating dispute where one exists. SwapConnect has no
            card-network chargeback integration with Kora/Paystack -- true chargebacks aren&apos;t tracked anywhere
            and can&apos;t be shown here honestly, so this page covers refunds only.
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Dispute Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">No refunds in this period.</td></tr>}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                  <td className="py-3 px-4 font-medium text-[#353535]">{r.reference}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{r.orderId ?? "—"}</td>
                  <td className="py-3 px-4">
                    <p className="text-[#353535]">{r.buyer?.name || "—"}</p>
                    <p className="text-xs text-[#9ca3af]">{r.buyer?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#353535]">{fmtNaira(r.refundAmount)}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{r.reason ? REASON_LABELS[r.reason] || r.reason : "—"}</td>
                  <td className="py-3 px-4">
                    {r.disputeStatus ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(r.disputeStatus)}`}>{r.disputeStatus.replace(/_/g, " ")}</span> : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.createdAt)}</td>
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

export default function FinanceRefundsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <FinanceRefundsContent />
    </ProtectedRoute>
  );
}
