"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Store, Package, Receipt, ShieldAlert } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";

interface OrderParty {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface OrderProductDetail {
  id: number;
  name: string;
  imageUrl: string | null;
  price: string;
  quantity: number;
  seller: { id: number; name: string; email: string } | null;
}

interface OrderTransaction {
  id: number;
  amount: string;
  reference: string;
  type: string;
  method: string;
  purpose: string;
  status: string;
  createdAt: string;
}

interface OrderDetail {
  id: number;
  status: string;
  address: string;
  totalAmount: string;
  amountPaid: string;
  listedAmount: string | null;
  sellerPayoutAmount: string | null;
  platformCommissionAmount: string | null;
  paymentCompleted: boolean;
  paymentMode: string;
  escrowStatus: string;
  escrowReleaseAt: string | null;
  disputeHold: boolean;
  swapped: boolean;
  couponCode: string | null;
  discountAmount: string | null;
  rejectionReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: OrderParty | null;
  seller: OrderParty | null;
  products: OrderProductDetail[];
  transactions: OrderTransaction[];
  bid: { id: number; amount: string; status: string; createdAt: string } | null;
  disputes: { id: number; status: string; reason: string; createdAt: string }[];
}

function fmtNaira(v: string | number | null) {
  if (v === null) return "—";
  return `₦${Number(v).toLocaleString("en-NG")}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-bold text-[#353535]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PartyBlock({ party, emptyLabel }: { party: OrderParty | null; emptyLabel: string }) {
  if (!party) return <p className="text-sm text-[#9ca3af]">{emptyLabel}</p>;
  return (
    <div className="flex flex-col gap-1">
      <Link href={`/dashboard/user/${party.id}`} className="text-sm font-semibold text-brand-emerald hover:underline w-fit">
        {party.name || "—"}
      </Link>
      <p className="text-xs text-[#6b7280]">{party.email}</p>
      {party.phone && <p className="text-xs text-[#6b7280]">{party.phone}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[#9ca3af] mb-0.5">{label}</p>
      <p className="text-sm text-[#353535] font-medium">{value}</p>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId;
  const token = useAuthToken();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "Failed to load order");
      setOrder(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedRoute allowedRoles={["admin", "superadmin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <Link href="/dashboard/orders" className="flex items-center gap-2 text-sm font-medium text-[#505050] hover:text-brand-emerald w-fit">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-10 text-center text-[#9ca3af]">Loading order…</div>
        ) : error || !order ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error || "Order not found."}</div>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#353535]">Order #{order.id}</h1>
                <p className="text-sm text-[#6b7280] mt-1">Placed {fmtDate(order.createdAt)}</p>
              </div>
              <span className="inline-block px-3 py-1.5 rounded-full text-sm font-medium capitalize bg-brand-emerald-light text-brand-emerald">
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="Buyer" icon={<User size={16} className="text-brand-emerald" />}>
                <PartyBlock party={order.buyer} emptyLabel="No buyer on record" />
              </SectionCard>
              <SectionCard title="Seller" icon={<Store size={16} className="text-brand-emerald" />}>
                <PartyBlock party={order.seller} emptyLabel="No seller on record" />
              </SectionCard>
            </div>

            <SectionCard title="Items" icon={<Package size={16} className="text-brand-emerald" />}>
              <div className="flex flex-col divide-y divide-[#f0f0f0]">
                {order.products.length === 0 ? (
                  <p className="text-sm text-[#9ca3af]">No line items on record.</p>
                ) : (
                  order.products.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#F7F8FB] shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#F7F8FB] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#353535] truncate">{p.name}</p>
                        <p className="text-xs text-[#9ca3af]">
                          Qty {p.quantity} · {p.seller ? p.seller.name : "Unknown seller"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#353535] shrink-0">{fmtNaira(p.price)}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Payment & Escrow" icon={<Receipt size={16} className="text-brand-emerald" />}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Total" value={fmtNaira(order.totalAmount)} />
                <Field label="Paid" value={fmtNaira(order.amountPaid)} />
                <Field label="Payment mode" value={<span className="capitalize">{order.paymentMode}</span>} />
                <Field label="Payment completed" value={order.paymentCompleted ? "Yes" : "No"} />
                <Field label="Escrow status" value={<span className="capitalize">{order.escrowStatus}</span>} />
                <Field label="Escrow release" value={fmtDate(order.escrowReleaseAt)} />
                {order.listedAmount && <Field label="Listed price" value={fmtNaira(order.listedAmount)} />}
                {order.sellerPayoutAmount && <Field label="Seller payout" value={fmtNaira(order.sellerPayoutAmount)} />}
                {order.platformCommissionAmount && <Field label="Platform commission" value={fmtNaira(order.platformCommissionAmount)} />}
                {order.couponCode && <Field label="Coupon" value={order.couponCode} />}
                {order.discountAmount && Number(order.discountAmount) > 0 && <Field label="Discount" value={fmtNaira(order.discountAmount)} />}
                <Field label="Delivery address" value={order.address} />
                {order.completedAt && <Field label="Completed" value={fmtDate(order.completedAt)} />}
                {order.rejectionReason && <Field label="Rejection reason" value={order.rejectionReason} />}
              </div>

              {order.transactions.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
                  <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Transactions</p>
                  <div className="flex flex-col gap-2">
                    {order.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="text-[#353535] font-medium capitalize">{t.purpose} via {t.method}</p>
                          <p className="text-xs text-[#9ca3af] font-mono truncate">{t.reference}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-[#353535]">{fmtNaira(t.amount)}</p>
                          <p className="text-xs text-[#9ca3af] capitalize">{t.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.bid && (
                <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
                  <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Originating Offer</p>
                  <p className="text-sm text-[#353535]">
                    Bid #{order.bid.id} · {fmtNaira(order.bid.amount)} · <span className="capitalize">{order.bid.status}</span>
                  </p>
                </div>
              )}
            </SectionCard>

            {order.disputes.length > 0 && (
              <SectionCard title="Disputes" icon={<ShieldAlert size={16} className="text-red-600" />}>
                <div className="flex flex-col gap-2">
                  {order.disputes.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dashboard/disputes?id=${d.id}`}
                      className="flex items-center justify-between gap-3 text-sm rounded-lg p-2 -mx-2 hover:bg-[#F7F8FB] transition-colors"
                    >
                      <span className="text-[#353535]">{d.reason}</span>
                      <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                        {d.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
