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

interface SellerRow {
  sellerId: number; name: string; email: string; bookBalance: number; pendingRelease: number;
  reservedDisputed: number; withdrawableBalance: number; completedPayouts: number; outstandingLiabilities: number;
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }
interface SellerDetail {
  seller: { id: number; name: string; email: string };
  withdrawableBalance: number;
  contributingOrders: {
    orderId: number; totalAmount: number; sellerPayoutAmount: number; platformCommissionAmount: number | null;
    escrowStatus: string; escrowReleaseAt: string | null; status: string; createdAt: string; completedAt: string | null;
  }[];
}

function FinanceSellerBalancesContent() {
  const token = useAuthToken();
  const [rows, setRows] = useState<SellerRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [selected, setSelected] = useState<SellerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`${API_URL}/api/admin/finance/seller-balances?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load seller balances");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (sellerId: number) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/finance/seller-balances/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setSelected(json.data);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <FinanceTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Seller Balances &amp; Liabilities</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Book Balance = Withdrawable + Pending Release + Reserved/Disputed. A seller can only ever withdraw their
            <strong> Withdrawable Balance</strong> -- pending/disputed funds stay locked until escrow release or
            dispute resolution, enforced server-side, not by this display.
          </p>
        </div>

        <input
          placeholder="Search seller by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm max-w-xs focus:outline-none focus:border-brand-emerald"
        />

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4 text-right">Book Balance</th>
                <th className="py-3 px-4 text-right">Pending Release</th>
                <th className="py-3 px-4 text-right">Reserved/Disputed</th>
                <th className="py-3 px-4 text-right">Withdrawable</th>
                <th className="py-3 px-4 text-right">Completed Payouts</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[#9ca3af]">No sellers found.</td></tr>}
              {!loading && rows.map((s) => (
                <tr key={s.sellerId} onClick={() => openDetail(s.sellerId)} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb] cursor-pointer">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#353535]">{s.name}</p>
                    <p className="text-xs text-[#9ca3af]">{s.email}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#353535]">{fmtNaira(s.bookBalance)}</td>
                  <td className="py-3 px-4 text-right text-brand-gold-hover">{fmtNaira(s.pendingRelease)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{fmtNaira(s.reservedDisputed)}</td>
                  <td className="py-3 px-4 text-right text-brand-emerald font-semibold">{fmtNaira(s.withdrawableBalance)}</td>
                  <td className="py-3 px-4 text-right text-[#6b7280]">{fmtNaira(s.completedPayouts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <PageButton page={page} setPage={setPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} />
        )}
      </div>

      <SidePanel open={!!selected || detailLoading} title="Seller Balance Detail" onClose={() => setSelected(null)}>
        {detailLoading && !selected && <p className="text-sm text-[#9ca3af]">Loading…</p>}
        {selected && (
          <div>
            <DetailRow label="Seller" value={`${selected.seller.name} (${selected.seller.email})`} />
            <DetailRow label="Withdrawable Balance" value={fmtNaira(selected.withdrawableBalance)} />
            <h3 className="text-sm font-bold text-[#353535] mt-5 mb-2">Contributing Orders ({selected.contributingOrders.length})</h3>
            {selected.contributingOrders.map((o) => (
              <div key={o.orderId} className="py-2.5 border-b border-[#f3f4f6] text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-[#353535]">Order #{o.orderId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(o.escrowStatus)}`}>{o.escrowStatus}</span>
                </div>
                <div className="flex justify-between text-xs text-[#6b7280] mt-1">
                  <span>Payout {fmtNaira(o.sellerPayoutAmount)}</span>
                  <span>{fmtDate(o.completedAt || o.createdAt)}</span>
                </div>
              </div>
            ))}
            {selected.contributingOrders.length === 0 && <p className="text-sm text-[#9ca3af]">No contributing orders.</p>}
          </div>
        )}
      </SidePanel>
    </div>
  );
}

export default function FinanceSellerBalancesPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <FinanceSellerBalancesContent />
    </ProtectedRoute>
  );
}
