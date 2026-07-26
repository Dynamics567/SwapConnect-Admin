"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

type DiscountType = "percentage" | "fixed";

interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number | string;
  minOrderAmount: number | string | null;
  maxDiscountAmount: number | string | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number;
  expiresAt: string | null;
  active: boolean;
  description: string | null;
  createdByAdminId: number | string;
  createdAt: string;
  updatedAt: string;
}

interface CouponRedemption {
  id: number;
  couponId: number;
  userId: number;
  orderId: number;
  discountAmount: number | string;
  createdAt: string;
}

interface FormState {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  maxUses: string;
  maxUsesPerUser: string;
  expiresAt: string;
  description: string;
}

const DEFAULT_FORM: FormState = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  maxUses: "",
  maxUsesPerUser: "1",
  expiresAt: "",
  description: "",
};

const formatNGN = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
};

const formatDate = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No expiry";

const formatDiscount = (c: Coupon) =>
  c.discountType === "percentage" ? `${Number(c.discountValue)}%` : formatNGN(c.discountValue);

const isExpired = (v: string | null) => !!v && new Date(v) < new Date();

export default function CouponsPage() {
  const token = useAuthToken();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [redemptionsFor, setRedemptionsFor] = useState<Coupon | null>(null);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [totalDiscountGiven, setTotalDiscountGiven] = useState<number>(0);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCoupons(data.data?.coupons ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const visibleCoupons = coupons.filter((c) => {
    if (statusFilter === "active") return c.active;
    if (statusFilter === "inactive") return !c.active;
    return true;
  });

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setCreateError(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setShowCreate(false);
  };

  const updateForm = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError(null);

    const body: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
    };
    if (form.minOrderAmount) body.minOrderAmount = Number(form.minOrderAmount);
    if (form.maxDiscountAmount) body.maxDiscountAmount = Number(form.maxDiscountAmount);
    if (form.maxUses) body.maxUses = Number(form.maxUses);
    if (form.maxUsesPerUser) body.maxUsesPerUser = Number(form.maxUsesPerUser);
    if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
    if (form.description.trim()) body.description = form.description.trim();

    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create coupon.");
        return;
      }
      setShowCreate(false);
      await fetchCoupons();
    } catch {
      setCreateError("Failed to create coupon. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    if (!token) return;
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${coupon.id}/active`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated: Coupon | undefined = data.data?.coupon;
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: updated ? updated.active : !c.active } : c))
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const openRedemptions = async (coupon: Coupon) => {
    setRedemptionsFor(coupon);
    if (!token) return;
    setRedemptionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${coupon.id}/redemptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRedemptions(data.data?.redemptions ?? []);
      setTotalDiscountGiven(data.data?.totalDiscountGiven ?? 0);
    } finally {
      setRedemptionsLoading(false);
    }
  };

  const closeRedemptions = () => {
    setRedemptionsFor(null);
    setRedemptions([]);
    setTotalDiscountGiven(0);
  };

  return (
    <div className="pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Coupons & Campaigns</h1>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "inactive")}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={openCreate}
            className="bg-[#037F44] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#026835] transition-colors"
          >
            + Create Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : visibleCoupons.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No coupons yet.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Value</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Usage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Expiry</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleCoupons.map((c) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">{c.code}</td>
                    <td className="px-4 py-3 capitalize">{c.discountType}</td>
                    <td className="px-4 py-3 font-medium">{formatDiscount(c)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          !c.active
                            ? "bg-gray-100 text-gray-600"
                            : expired
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {!c.active ? "Inactive" : expired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openRedemptions(c)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
                        >
                          Redemptions
                        </button>
                        <button
                          onClick={() => handleToggleActive(c)}
                          disabled={togglingId === c.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap disabled:opacity-60 ${
                            c.active
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {togglingId === c.id ? "Saving…" : c.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Coupon drawer */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Create Coupon</h2>
              <button
                onClick={closeCreate}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1 text-[#505050]">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => updateForm({ code: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 uppercase"
                  placeholder="e.g. WELCOME10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-[#505050]">Discount Type *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => updateForm({ discountType: e.target.value as DiscountType })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 text-[#505050]">
                  Discount Value * {form.discountType === "percentage" ? "(0–100)" : "(₦)"}
                </label>
                <input
                  type="number"
                  min={0}
                  max={form.discountType === "percentage" ? 100 : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => updateForm({ discountValue: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-[#505050]">Min Order (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount}
                    onChange={(e) => updateForm({ minOrderAmount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[#505050]">Max Discount (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount}
                    onChange={(e) => updateForm({ maxDiscountAmount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-[#505050]">Max Total Uses</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxUses}
                    onChange={(e) => updateForm({ maxUses: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[#505050]">Max Uses / User</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUsesPerUser}
                    onChange={(e) => updateForm({ maxUsesPerUser: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-[#505050]">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => updateForm({ expiresAt: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-[#505050]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 resize-none"
                  placeholder="Shown to customers, e.g. 'Welcome discount for new customers'"
                />
              </div>

              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#037F44] text-white py-3 rounded-lg font-semibold hover:bg-[#026835] transition-colors disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Redemptions drawer */}
      {redemptionsFor && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold font-mono">{redemptionsFor.code} — Redemptions</h2>
              <button
                onClick={closeRedemptions}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
              <span className="text-gray-500">Total Discount Given</span>
              <span className="font-semibold text-green-700">{formatNGN(totalDiscountGiven)}</span>
            </div>

            {redemptionsLoading ? (
              <div className="text-center py-10 text-gray-500">Loading…</div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No redemptions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Order</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">User</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Discount</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {redemptions.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">#{r.orderId}</td>
                        <td className="px-3 py-2 text-gray-600">#{r.userId}</td>
                        <td className="px-3 py-2 font-medium text-green-700">{formatNGN(r.discountAmount)}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
