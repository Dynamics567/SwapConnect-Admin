"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageButton from "@/components/PageButton";

interface OrderParty {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface OrderProductSummary {
  id: number;
  name: string;
  imageUrl: string | null;
  quantity: number;
}

interface OrderRow {
  id: number;
  status: string;
  totalAmount: string;
  amountPaid: string;
  paymentCompleted: boolean;
  paymentMode: string;
  escrowStatus: string;
  swapped: boolean;
  createdAt: string;
  buyer: OrderParty | null;
  seller: OrderParty | null;
  products: OrderProductSummary[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const STATUSES = ["", "pending", "accepted", "partially paid", "paid", "in progress", "completed", "rejected", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  "partially paid": "bg-amber-100 text-amber-800",
  paid: "bg-brand-emerald-light text-brand-emerald",
  "in progress": "bg-blue-100 text-blue-800",
  completed: "bg-brand-emerald-light text-brand-emerald",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-600",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function fmtNaira(v: string | number) {
  return `₦${Number(v).toLocaleString("en-NG")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function PartyCell({ party, fallback }: { party: OrderParty | null; fallback: string }) {
  if (!party) return <span className="text-[#9ca3af] text-xs">{fallback}</span>;
  return (
    <div className="min-w-0">
      <p className="text-[#353535] text-sm font-medium truncate">{party.name || "—"}</p>
      <p className="text-[#9ca3af] text-xs truncate">{party.email}</p>
    </div>
  );
}

export default function OrdersPage() {
  const token = useAuthToken();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_URL}/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "Failed to load orders");
      setOrders(json.data ?? []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedRoute allowedRoles={["admin", "superadmin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-[#353535]">Orders</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Every order on the platform -- who placed it, what it's for, and who they're buying from.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buyer, seller, or order #..."
              className="w-full pl-9 pr-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-white capitalize"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s : "All statuses"}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-emerald-light text-left">
                <th className="py-3 px-4 text-[#505050] font-normal">ORDER</th>
                <th className="py-3 px-4 text-[#505050] font-normal">BUYER</th>
                <th className="py-3 px-4 text-[#505050] font-normal">SELLER</th>
                <th className="py-3 px-4 text-[#505050] font-normal">ITEM(S)</th>
                <th className="py-3 px-4 text-[#505050] font-normal">AMOUNT</th>
                <th className="py-3 px-4 text-[#505050] font-normal">STATUS</th>
                <th className="py-3 px-4 text-[#505050] font-normal">DATE</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#9ca3af]">Loading orders…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#9ca3af]">No orders match your search and filters.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-b-0 cursor-pointer hover:bg-[#F7F8FB] transition"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <td className="py-3 px-4 text-[#353535] font-mono text-xs">#{order.id}</td>
                    <td className="py-3 px-4"><PartyCell party={order.buyer} fallback="No buyer on record" /></td>
                    <td className="py-3 px-4"><PartyCell party={order.seller} fallback="No seller on record" /></td>
                    <td className="py-3 px-4 text-[#353535] max-w-[220px] truncate">
                      {order.products.map((p) => p.name).join(", ") || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#353535] font-medium">{fmtNaira(order.totalAmount)}</td>
                    <td className="py-3 px-4"><StatusPill status={order.status} /></td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(order.createdAt)}</td>
                    <td className="py-3 px-4">
                      <ChevronRight size={16} className="text-[#9ca3af]" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-[#9ca3af]">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-[#9ca3af]">No orders match your search and filters.</div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 cursor-pointer transition-shadow hover:shadow-md active:bg-[#F7F8FB]"
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-[#9ca3af]">#{order.id}</span>
                  <StatusPill status={order.status} />
                </div>
                <p className="text-sm text-[#353535] font-medium truncate">
                  {order.products.map((p) => p.name).join(", ") || "—"}
                </p>
                <div className="flex items-center justify-between text-xs text-[#6b7280] gap-2">
                  <span className="truncate">Buyer: {order.buyer?.name ?? "—"}</span>
                  <span className="truncate">Seller: {order.seller?.name ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-emerald text-sm">{fmtNaira(order.totalAmount)}</span>
                  <span className="text-[#9ca3af] text-xs">{fmtDate(order.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {pagination && orders.length > 0 && (
          <PageButton
            page={page}
            setPage={setPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
