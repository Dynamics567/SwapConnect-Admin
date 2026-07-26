"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tag,
  Plus,
  Copy,
  Check,
  X,
  Percent,
  Banknote,
  Users,
  Ticket,
  Receipt,
} from "lucide-react";
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

function StatusPill({ coupon }: { coupon: Coupon }) {
  const expired = isExpired(coupon.expiresAt);
  const label = !coupon.active ? "Inactive" : expired ? "Expired" : "Active";
  const styles = !coupon.active
    ? "bg-[#f3f4f6] text-[#6b7280]"
    : expired
    ? "bg-[#fef9ec] text-[#a9791f]"
    : "bg-[#e6f9f0] text-[#037f44]";
  const dot = !coupon.active ? "bg-[#9ca3af]" : expired ? "bg-[#a9791f]" : "bg-[#037f44]";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function UsageBar({ coupon }: { coupon: Coupon }) {
  if (coupon.maxUses == null) {
    return (
      <div className="text-xs text-[#848484]">
        {coupon.usedCount} <span className="text-[#c4c4c4]">/ ∞</span>
      </div>
    );
  }
  const pct = coupon.maxUses > 0 ? Math.min(100, (coupon.usedCount / coupon.maxUses) * 100) : 0;
  const atLimit = coupon.usedCount >= coupon.maxUses;
  return (
    <div className="w-28">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-[#353535]">{coupon.usedCount}</span>
        <span className="text-[10px] text-[#9ca3af]">of {coupon.maxUses}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? "bg-[#a9791f]" : "bg-[#037f44]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable -- no-op, the code is still visible to copy by hand
    }
  };
  return (
    <button
      onClick={copy}
      title="Copy code"
      className="inline-flex items-center gap-1.5 font-mono font-semibold text-sm text-[#353535] bg-[#f8f9fb] border border-[#e5e7eb] rounded-lg px-2.5 py-1 hover:border-[#037f44] transition-colors group"
    >
      {code}
      {copied ? (
        <Check size={12} className="text-[#037f44]" />
      ) : (
        <Copy size={12} className="text-[#9ca3af] group-hover:text-[#037f44]" />
      )}
    </button>
  );
}

export default function CouponsPage() {
  const token = useAuthToken();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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
    if (statusFilter === "active") return c.active && !isExpired(c.expiresAt);
    if (statusFilter === "inactive") return !c.active || isExpired(c.expiresAt);
    return true;
  });

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.active && !isExpired(c.expiresAt)).length;
    const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const totalRedeemable = coupons.filter((c) => c.usedCount > 0).length;
    return { total: coupons.length, active, totalUses, totalRedeemable };
  }, [coupons]);

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

  const summaryCards = [
    { label: "Total Coupons", value: stats.total, icon: <Ticket size={20} className="text-[#037F44]" /> },
    { label: "Currently Active", value: stats.active, icon: <Tag size={20} className="text-[#037F44]" /> },
    { label: "Total Redemptions", value: stats.totalUses, icon: <Receipt size={20} className="text-[#037F44]" /> },
    { label: "Codes In Use", value: stats.totalRedeemable, icon: <Users size={20} className="text-[#037F44]" /> },
  ];

  return (
    <div className="w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-10 min-h-screen bg-[#F8F9FB]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#353535]">Coupons & Campaigns</h1>
          <p className="text-sm text-[#848484] mt-1">Discount codes for marketing campaigns and promotions</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#037F44] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#026835] transition-colors shrink-0"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-[#f0faf5] rounded-lg p-2">{s.icon}</span>
            </div>
            <div className="text-xl font-bold text-[#353535]">{loading ? "—" : s.value}</div>
            <div className="text-xs text-[#848484] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter segmented control */}
      <div className="flex items-center gap-1 mb-4 bg-white border border-[#e5e7eb] rounded-lg p-1 w-fit">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              statusFilter === f ? "bg-[#037f44] text-white" : "text-[#6b7280] hover:bg-[#f8f9fb]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-[#848484]">Loading coupons…</div>
      ) : visibleCoupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 flex flex-col items-center text-center">
          <span className="bg-[#f0faf5] rounded-full p-4 mb-4">
            <Ticket size={28} className="text-[#037F44]" />
          </span>
          <h3 className="text-base font-semibold text-[#353535] mb-1">
            {coupons.length === 0 ? "No coupons yet" : "No coupons match this filter"}
          </h3>
          <p className="text-sm text-[#848484] max-w-sm mb-5">
            {coupons.length === 0
              ? "Create your first discount code to kick off a promotion or welcome campaign."
              : "Try a different status filter to see other coupons."}
          </p>
          {coupons.length === 0 && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#037F44] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#026835] transition-colors"
            >
              <Plus size={16} />
              Create Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#6b7280]">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#6b7280]">Discount</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#6b7280]">Usage</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#6b7280]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#6b7280]">Expiry</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {visibleCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f8f9fb]/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <CodeChip code={c.code} />
                      {c.description && (
                        <p className="text-xs text-[#9ca3af] mt-1 max-w-[220px] truncate" title={c.description}>
                          {c.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-[#353535]">
                        {c.discountType === "percentage" ? (
                          <Percent size={13} className="text-[#9ca3af]" />
                        ) : (
                          <Banknote size={13} className="text-[#9ca3af]" />
                        )}
                        {formatDiscount(c)}
                      </div>
                      {c.maxDiscountAmount != null && c.discountType === "percentage" && (
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">up to {formatNGN(c.maxDiscountAmount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <UsageBar coupon={c} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill coupon={c} />
                    </td>
                    <td className="px-4 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openRedemptions(c)}
                          className="text-xs bg-[#f8f9fb] hover:bg-[#f3f4f6] text-[#353535] px-3 py-1.5 rounded-lg font-medium whitespace-nowrap border border-[#e5e7eb]"
                        >
                          Redemptions
                        </button>
                        <button
                          onClick={() => handleToggleActive(c)}
                          disabled={togglingId === c.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap disabled:opacity-60 transition-colors ${
                            c.active
                              ? "bg-[#fef2f2] text-[#b91c1c] hover:bg-[#fee2e2]"
                              : "bg-[#e6f9f0] text-[#037f44] hover:bg-[#d1f2e3]"
                          }`}
                        >
                          {togglingId === c.id ? "Saving…" : c.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Coupon modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb] sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-[#353535]">Create Coupon</h2>
                <p className="text-xs text-[#848484] mt-0.5">Set the terms for this discount code</p>
              </div>
              <button
                onClick={closeCreate}
                className="text-[#9ca3af] hover:text-[#353535] hover:bg-[#f3f4f6] rounded-lg p-1.5 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#353535]">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => updateForm({ code: e.target.value })}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                  placeholder="e.g. WELCOME10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#353535]">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => updateForm({ discountType: e.target.value as DiscountType })}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#353535]">
                    Value {form.discountType === "percentage" ? "(0–100)" : "(₦)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={form.discountType === "percentage" ? 100 : undefined}
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => updateForm({ discountValue: e.target.value })}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#353535]">Min Order (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount}
                    onChange={(e) => updateForm({ minOrderAmount: e.target.value })}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#353535]">Max Discount (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount}
                    onChange={(e) => updateForm({ maxDiscountAmount: e.target.value })}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#353535]">Max Total Uses</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxUses}
                    onChange={(e) => updateForm({ maxUses: e.target.value })}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#353535]">Max Uses / User</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUsesPerUser}
                    onChange={(e) => updateForm({ maxUsesPerUser: e.target.value })}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#353535]">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => updateForm({ expiresAt: e.target.value })}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#353535]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={2}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] resize-none focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
                  placeholder="Shown to customers, e.g. 'Welcome discount for new customers'"
                />
              </div>

              {createError && (
                <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-sm rounded-lg px-3 py-2.5">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex-1 border border-[#e5e7eb] text-[#353535] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#f8f9fb] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#037F44] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#026835] transition-colors disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redemptions panel */}
      {redemptionsFor && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb] sticky top-0 bg-white">
              <div>
                <p className="text-xs text-[#848484] mb-0.5">Redemptions</p>
                <h2 className="text-lg font-bold font-mono text-[#353535]">{redemptionsFor.code}</h2>
              </div>
              <button
                onClick={closeRedemptions}
                className="text-[#9ca3af] hover:text-[#353535] hover:bg-[#f3f4f6] rounded-lg p-1.5 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-[#f0faf5] rounded-xl p-4 flex items-center justify-between mb-5">
                <span className="text-sm text-[#037f44] font-medium">Total Discount Given</span>
                <span className="text-lg font-bold text-[#037f44]">{formatNGN(totalDiscountGiven)}</span>
              </div>

              {redemptionsLoading ? (
                <div className="text-center py-10 text-[#848484] text-sm">Loading…</div>
              ) : redemptions.length === 0 ? (
                <div className="text-center py-10">
                  <Receipt size={24} className="text-[#d1d5db] mx-auto mb-2" />
                  <p className="text-sm text-[#9ca3af]">No redemptions yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {redemptions.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-[#f3f4f6] bg-[#f8f9fb]/60"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#353535]">Order #{r.orderId}</p>
                        <p className="text-xs text-[#9ca3af] mt-0.5">
                          User #{r.userId} · {formatDate(r.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#037f44]">{formatNGN(r.discountAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
