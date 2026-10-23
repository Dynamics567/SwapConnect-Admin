"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FinanceTabs from "@/components/finance/FinanceTabs";
import PageButton from "@/components/PageButton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { API_URL } from "@/lib/config";
import { fmtNaira, fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface LedgerRow {
  entryId: number; transactionDate: string; postingDate: string; reference: string; orderId: number | null;
  accountName: string; description: string; debit: number; credit: number; currency: string;
  relatedParty: { id: number; name: string; email: string } | null; transactionType: string; provider: string; status: string;
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }

const PURPOSES = ["", "purchase", "withdrawal", "refund", "commission", "escrow_release", "deposit", "transfer", "referral"];

function FinanceLedgerContent() {
  const token = useAuthToken();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [purpose, setPurpose] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const debouncedFrom = useDebouncedValue(from, 400);
  const debouncedTo = useDebouncedValue(to, 400);

  useEffect(() => { setPage(1); }, [purpose, debouncedFrom, debouncedTo]);

  const buildParams = useCallback((forPage?: number) => {
    const params = new URLSearchParams();
    if (forPage != null) { params.set("page", String(forPage)); params.set("limit", "25"); }
    if (purpose) params.set("purpose", purpose);
    if (debouncedFrom) params.set("from", debouncedFrom);
    if (debouncedTo) params.set("to", debouncedTo);
    return params;
  }, [purpose, debouncedFrom, debouncedTo]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/finance/ledger?${buildParams(page)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load the ledger");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, buildParams]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/finance/ledger/export?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || `SwapConnect_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const inputClass = "border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-brand-emerald";

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <FinanceTabs />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#353535]">Financial Ledger</h1>
            <p className="text-sm text-[#6b7280] mt-1 max-w-2xl">
              One row per real transaction record (Debit/Credit derived from its actual type). This is a
              transaction-level ledger, not a double-entry journal -- SwapConnect has no chart-of-accounts system,
              so no balanced journal entries are fabricated here.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-brand-emerald hover:bg-brand-emerald-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            <Download size={15} /> {exporting ? "Exporting…" : "Download CSV"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass}>
            {PURPOSES.map((p) => <option key={p} value={p}>{p || "All types"}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          <span className="self-center text-[#9ca3af] text-sm">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Entry</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-[#9ca3af]">No ledger entries match these filters.</td></tr>}
              {!loading && rows.map((r) => (
                <tr key={r.entryId} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                  <td className="py-3 px-4 text-[#9ca3af]">#{r.entryId}</td>
                  <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.transactionDate)}</td>
                  <td className="py-3 px-4 font-medium text-[#353535]">{r.reference}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{r.orderId ?? "—"}</td>
                  <td className="py-3 px-4 text-[#6b7280]">{r.accountName}</td>
                  <td className="py-3 px-4 text-right text-[#353535]">{r.debit ? fmtNaira(r.debit) : "—"}</td>
                  <td className="py-3 px-4 text-right text-[#353535]">{r.credit ? fmtNaira(r.credit) : "—"}</td>
                  <td className="py-3 px-4 text-[#6b7280] capitalize">{r.provider}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
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

export default function FinanceLedgerPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <FinanceLedgerContent />
    </ProtectedRoute>
  );
}
