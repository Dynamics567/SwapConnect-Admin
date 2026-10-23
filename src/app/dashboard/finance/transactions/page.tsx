"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FinanceTabs from "@/components/finance/FinanceTabs";
import PageButton from "@/components/PageButton";
import SidePanel, { DetailRow } from "@/components/finance/SidePanel";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { API_URL } from "@/lib/config";
import { fmtNaira, fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface PartySummary { id: number; name: string; email: string }
interface TxRow {
  id: number; reference: string; orderId: number | null; transactionType: string; purposeLabel: string;
  type: string; method: string; purpose: string; status: string; amount: number; feeAmount: number | null;
  netAmount: number | null; buyer: PartySummary | null; seller: PartySummary | null; description: string | null;
  createdAt: string; updatedAt: string;
}
interface TxDetail extends TxRow {
  feeSnapshot: Record<string, unknown> | null;
  providerData: Record<string, unknown> | null;
  order: {
    id: number; transactionType: string; totalAmount: number; listedAmount: number | null;
    sellerPayoutAmount: number | null; platformCommissionAmount: number | null; discountAmount: number | null;
    status: string; paymentCompleted: boolean; escrowStatus: string; escrowReleaseAt: string | null;
    disputeHold: boolean; createdAt: string; completedAt: string | null;
  } | null;
  relatedTransactions: { id: number; reference: string; purpose: string; type: string; amount: number; status: string; createdAt: string }[];
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }

const PURPOSES = ["", "purchase", "withdrawal", "refund", "commission", "escrow_release", "deposit", "transfer", "referral"];
const STATUSES = ["", "pending", "success", "failed", "abandoned", "underpaid", "overpaid", "requires_review"];
const METHODS = ["", "wallet", "paystack", "kora"];

function FinanceTransactionsContent() {
  const token = useAuthToken();
  const [rows, setRows] = useState<TxRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reference, setReference] = useState("");
  const debouncedReference = useDebouncedValue(reference, 400);
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [orderId, setOrderId] = useState("");
  const debouncedOrderId = useDebouncedValue(orderId, 400);

  const [selected, setSelected] = useState<TxDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { setPage(1); }, [debouncedReference, purpose, status, method, debouncedOrderId]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedReference.trim()) params.set("reference", debouncedReference.trim());
      if (purpose) params.set("purpose", purpose);
      if (status) params.set("status", status);
      if (method) params.set("method", method);
      if (debouncedOrderId.trim()) params.set("orderId", debouncedOrderId.trim());
      const res = await fetch(`${API_URL}/api/admin/finance/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load transactions");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedReference, purpose, status, method, debouncedOrderId]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: number) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/finance/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setSelected(json.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const inputClass = "border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-brand-emerald";

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <FinanceTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Transactions</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Purchases (normal + swap), withdrawals, refunds, commission and escrow-release entries -- server-side
            filtered and searched.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <input placeholder="Search reference…" value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
          <input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} className={`${inputClass} w-28`} />
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass}>
            {PURPOSES.map((p) => <option key={p} value={p}>{p || "All types"}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
            {METHODS.map((m) => <option key={m} value={m}>{m || "All methods"}</option>)}
          </select>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">No transactions match these filters.</td></tr>}
              {!loading && rows.map((t) => (
                <tr key={t.id} onClick={() => openDetail(t.id)} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb] cursor-pointer">
                  <td className="py-3 px-4 font-medium text-[#353535]">{t.reference}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{t.purposeLabel}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{t.buyer?.name || "—"}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{t.seller?.name || "—"}</td>
                  <td className="py-3 px-4 text-right font-medium text-[#353535]">{fmtNaira(t.amount)}</td>
                  <td className="py-3 px-4 text-[#6b7280] capitalize">{t.method}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <PageButton page={page} setPage={setPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} />
        )}
      </div>

      <SidePanel open={!!selected || detailLoading} title="Transaction Detail" onClose={() => setSelected(null)}>
        {detailLoading && !selected && <p className="text-sm text-[#9ca3af]">Loading…</p>}
        {selected && (
          <div>
            <DetailRow label="Reference" value={selected.reference} />
            <DetailRow label="Type" value={selected.purposeLabel} />
            <DetailRow label="Status" value={<span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(selected.status)}`}>{selected.status}</span>} />
            <DetailRow label="Gross Amount" value={fmtNaira(selected.amount)} />
            {selected.feeAmount != null && <DetailRow label="Fee" value={fmtNaira(selected.feeAmount)} />}
            {selected.netAmount != null && <DetailRow label="Net Amount" value={fmtNaira(selected.netAmount)} />}
            <DetailRow label="Method" value={<span className="capitalize">{selected.method}</span>} />
            <DetailRow label="Buyer" value={selected.buyer ? `${selected.buyer.name} (${selected.buyer.email})` : "—"} />
            <DetailRow label="Seller" value={selected.seller ? `${selected.seller.name} (${selected.seller.email})` : "—"} />
            <DetailRow label="Created" value={fmtDate(selected.createdAt)} />
            <DetailRow label="Updated" value={fmtDate(selected.updatedAt)} />

            {selected.order && (
              <>
                <h3 className="text-sm font-bold text-[#353535] mt-5 mb-2">Order #{selected.order.id}</h3>
                <DetailRow label="Order Total" value={fmtNaira(selected.order.totalAmount)} />
                <DetailRow label="Listed Amount" value={fmtNaira(selected.order.listedAmount)} />
                <DetailRow label="Seller Payout" value={fmtNaira(selected.order.sellerPayoutAmount)} />
                <DetailRow label="Platform Commission" value={fmtNaira(selected.order.platformCommissionAmount)} />
                {selected.order.discountAmount ? <DetailRow label="Discount Applied" value={fmtNaira(selected.order.discountAmount)} /> : null}
                <DetailRow label="Order Status" value={selected.order.status} />
                <DetailRow label="Escrow Status" value={selected.order.escrowStatus} />
                {selected.order.escrowReleaseAt && <DetailRow label="Escrow Release" value={fmtDate(selected.order.escrowReleaseAt)} />}
              </>
            )}

            {selected.relatedTransactions.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-[#353535] mt-5 mb-2">Related Transactions</h3>
                {selected.relatedTransactions.map((r) => (
                  <DetailRow key={r.id} label={`${r.purpose} (${r.status})`} value={fmtNaira(r.amount)} />
                ))}
              </>
            )}
          </div>
        )}
      </SidePanel>
    </div>
  );
}

export default function FinanceTransactionsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <FinanceTransactionsContent />
    </ProtectedRoute>
  );
}
