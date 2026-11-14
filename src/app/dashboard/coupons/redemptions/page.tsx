"use client";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import PageButton from "@/components/PageButton";

interface Redemption {
  id: number;
  coupon: { id: number; code: string; discountType: "percentage" | "fixed"; discountValue: number | string } | null;
  user: { id: number; name: string; email: string } | null;
  orderId: number;
  orderAmount: string | number | null;
  discountAmount: string | number;
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

function fmtNaira(v: string | number | null) {
  if (v === null) return "—";
  return `₦${Number(v).toLocaleString("en-NG")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function discountLabel(coupon: Redemption["coupon"]) {
  if (!coupon) return "—";
  return coupon.discountType === "percentage" ? `${coupon.discountValue}% off` : `${fmtNaira(coupon.discountValue)} off`;
}

function CouponRedemptionsPageContent() {
  const token = useAuthToken();
  const [rows, setRows] = useState<Redemption[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`${API_URL}/api/admin/coupons/redemptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load redemptions");
      setRows(json.data ?? []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load redemptions.");
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full min-w-0 flex flex-col gap-5">
      <Link href="/dashboard/coupons" className="flex items-center gap-2 text-sm font-medium text-[#505050] hover:text-brand-emerald w-fit">
        <ArrowLeft size={16} /> Back to Coupons
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#353535]">Coupon Redemptions</h1>
        <p className="text-sm text-[#848484] mt-1">Every time a coupon was used, across every code.</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coupon code or user..."
          className="w-full pl-9 pr-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm bg-white"
        />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-emerald-light text-left">
              <th className="py-3 px-4 text-[#505050] font-normal">CODE</th>
              <th className="py-3 px-4 text-[#505050] font-normal">REDEEMED BY</th>
              <th className="py-3 px-4 text-[#505050] font-normal">ORDER</th>
              <th className="py-3 px-4 text-[#505050] font-normal">ORDER TOTAL</th>
              <th className="py-3 px-4 text-[#505050] font-normal">DISCOUNT GIVEN</th>
              <th className="py-3 px-4 text-[#505050] font-normal">DATE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-10 text-center text-[#9ca3af]">Loading redemptions…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-[#9ca3af]">No redemptions match your search.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="py-3 px-4">
                    <p className="font-mono text-sm font-semibold text-[#353535]">{r.coupon?.code ?? "—"}</p>
                    <p className="text-xs text-[#9ca3af]">{discountLabel(r.coupon)}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[#353535] text-sm">{r.user?.name ?? "—"}</p>
                    <p className="text-xs text-[#9ca3af]">{r.user?.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/orders/${r.orderId}`} className="text-brand-emerald font-mono text-xs hover:underline">
                      #{r.orderId}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-[#353535]">{fmtNaira(r.orderAmount)}</td>
                  <td className="py-3 px-4 text-[#353535] font-medium">{fmtNaira(r.discountAmount)}</td>
                  <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-[#9ca3af]">Loading redemptions…</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-[#9ca3af]">No redemptions match your search.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-[#353535]">{r.coupon?.code ?? "—"}</p>
                  <p className="text-xs text-[#9ca3af]">{discountLabel(r.coupon)}</p>
                </div>
                <Link href={`/dashboard/orders/${r.orderId}`} className="text-brand-emerald font-mono text-xs hover:underline shrink-0">
                  Order #{r.orderId}
                </Link>
              </div>
              <p className="text-xs text-[#6b7280]">{r.user?.name ?? "—"} · {r.user?.email}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-emerald text-sm">{fmtNaira(r.discountAmount)} discount</span>
                <span className="text-[#9ca3af] text-xs">{fmtDate(r.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && rows.length > 0 && (
        <PageButton
          page={page}
          setPage={setPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
        />
      )}
    </div>
  );
}

export default function CouponRedemptionsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <CouponRedemptionsPageContent />
    </ProtectedRoute>
  );
}
