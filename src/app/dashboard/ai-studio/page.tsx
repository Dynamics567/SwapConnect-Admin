"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Flag, BarChart2, Database, Gauge, Search, Plus, X, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useRole } from "@/hooks/useRole";
import ProtectedRoute from "@/components/ProtectedRoute";

// This admin app has no toast library installed anywhere -- a lightweight
// local notification banner instead of pulling in a new dependency for one page.
type Notice = { type: "success" | "error"; text: string } | null;
let noticeSetter: ((n: Notice) => void) | null = null;
const toast = {
  success: (text: string) => noticeSetter?.({ type: "success", text }),
  error: (text: string) => noticeSetter?.({ type: "error", text }),
};
function NoticeBanner() {
  const [notice, setNotice] = useState<Notice>(null);
  useEffect(() => {
    noticeSetter = setNotice;
    return () => { noticeSetter = null; };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  if (!notice) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
        notice.type === "success" ? "bg-[#037F44] text-white" : "bg-red-600 text-white"
      }`}
    >
      {notice.text}
    </div>
  );
}

type Tab = "analytics" | "review" | "catalog" | "limits";

interface FlaggedImage {
  id: number;
  angle: string;
  url: string | null;
  flaggedReason: string | null;
  createdAt: string;
  Job?: { accountId: number; Account?: { firstName: string; lastName: string; email: string } };
}

interface Analytics {
  totalJobs: number;
  jobsByStatus: { status: string; count: number }[];
  totalImages: number;
  flaggedImages: number;
  topVendors: { accountId: number; jobCount: number; account: { firstName: string; lastName: string; email: string } | null }[];
}

interface CatalogEntry {
  id: number;
  brand: string;
  model: string;
  category: string | null;
  releaseYear: number | null;
  basePriceNgn: number | null;
  isActive: boolean;
}

export default function AiStudioPage() {
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canManage = isAdmin || isSuperAdmin;
  const [tab, setTab] = useState<Tab>("analytics");

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <NoticeBanner />
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#037F44] flex items-center gap-2">
              <Sparkles size={22} /> AI Product Studio
            </h2>
            <p className="text-sm text-[#848484] mt-1">Review generated content, monitor usage, and manage the device catalog.</p>
          </div>
        </div>

        <div className="flex gap-2 bg-white rounded-xl shadow p-2 w-fit flex-wrap">
          {([
            ["analytics", "Analytics", BarChart2],
            ["review", "Review Queue", Flag],
            ["catalog", "Device Catalog", Database],
            ["limits", "Usage Limits", Gauge],
          ] as [Tab, string, typeof BarChart2][]).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition ${
                tab === key ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === "analytics" && <AnalyticsTab token={token} />}
        {tab === "review" && <ReviewQueueTab token={token} />}
        {tab === "catalog" && <CatalogTab token={token} canManage={canManage} />}
        {tab === "limits" && <LimitsTab token={token} canManage={canManage} />}
      </div>
    </ProtectedRoute>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl shadow p-6">{children}</div>;
}

function AnalyticsTab({ token }: { token: string | null }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/ai-studio/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Card><p className="text-[#848484]">Loading analytics…</p></Card>;
  if (!data) return <Card><p className="text-[#848484]">No data available.</p></Card>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[#848484] mb-1">Total generation jobs</p>
          <p className="text-3xl font-bold text-[#353535]">{data.totalJobs}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[#848484] mb-1">Total images generated</p>
          <p className="text-3xl font-bold text-[#353535]">{data.totalImages}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[#848484] mb-1">Flagged images</p>
          <p className="text-3xl font-bold text-red-600">{data.flaggedImages}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-bold text-[#353535] mb-3">Jobs by status</h3>
        {data.jobsByStatus.length === 0 ? (
          <p className="text-sm text-[#848484]">No generation jobs yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.jobsByStatus.map((s) => (
              <span key={s.status} className="px-3 py-1.5 rounded-lg bg-[#F7F8FB] text-sm text-[#353535]">
                <span className="font-semibold capitalize">{s.status}</span>: {s.count}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-bold text-[#353535] mb-3">Top vendors by usage</h3>
        {data.topVendors.length === 0 ? (
          <p className="text-sm text-[#848484]">No usage yet.</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                <th className="py-2 px-4 font-normal">Vendor</th>
                <th className="py-2 px-4 font-normal">Email</th>
                <th className="py-2 px-4 font-normal">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {data.topVendors.map((v) => (
                <tr key={v.accountId} className="text-[#434343]">
                  <td className="py-2 px-4">{v.account ? `${v.account.firstName} ${v.account.lastName}` : `#${v.accountId}`}</td>
                  <td className="py-2 px-4">{v.account?.email ?? "—"}</td>
                  <td className="py-2 px-4">{v.jobCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function ReviewQueueTab({ token }: { token: string | null }) {
  const [images, setImages] = useState<FlaggedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/ai-studio/review-queue`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setImages(json.data.flagged))
      .catch(() => toast.error("Failed to load review queue"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Card><p className="text-[#848484]">Loading…</p></Card>;

  return (
    <Card>
      <h3 className="text-base font-bold text-[#353535] mb-1">Flagged images</h3>
      <p className="text-sm text-[#848484] mb-4">Generated images flagged as inappropriate or inaccurate.</p>
      {images.length === 0 ? (
        <p className="text-sm text-[#848484] py-6 text-center">Nothing flagged right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border border-[#e5e7eb] rounded-xl overflow-hidden">
              <div className="aspect-square bg-[#F7F8FB] flex items-center justify-center">
                {img.url ? <img src={img.url} alt={img.angle} className="w-full h-full object-cover" /> : <Flag size={20} className="text-[#848484]" />}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-[#353535] capitalize">{img.angle}</p>
                <p className="text-[11px] text-[#848484] truncate">{img.flaggedReason || "No reason given"}</p>
                {img.Job?.Account && (
                  <p className="text-[11px] text-[#037F44] truncate mt-1">{img.Job.Account.firstName} {img.Job.Account.lastName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CatalogTab({ token, canManage }: { token: string | null; canManage: boolean }) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ brand: "", model: "", category: "phone", releaseYear: "", basePriceNgn: "" });

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/admin/ai-studio/device-catalog`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setEntries(json.data))
      .catch(() => toast.error("Failed to load device catalog"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(load, [load]);

  const filtered = entries.filter((e) =>
    `${e.brand} ${e.model}`.toLowerCase().includes(search.toLowerCase())
  );

  const submitForm = async () => {
    if (!form.brand.trim() || !form.model.trim()) {
      toast.error("Brand and model are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/ai-studio/device-catalog`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          brand: form.brand.trim(),
          model: form.model.trim(),
          category: form.category,
          releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
          basePriceNgn: form.basePriceNgn ? Number(form.basePriceNgn) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add device");
      toast.success("Device added to catalog");
      setForm({ brand: "", model: "", category: "phone", releaseYear: "", basePriceNgn: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add device");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (entry: CatalogEntry) => {
    try {
      const res = await fetch(`${API_URL}/admin/ai-studio/device-catalog/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !entry.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, isActive: !e.isActive } : e)));
    } catch {
      toast.error("Failed to update device status");
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand or model"
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-gray-50"
          />
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 bg-[#037F44] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#025e2e]"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Add device"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-[#e5e7eb] rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
            <option value="phone">Phone</option>
            <option value="laptop">Laptop</option>
            <option value="tablet">Tablet</option>
            <option value="watch">Watch</option>
          </select>
          <input placeholder="Release year" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Base price (₦)" value={form.basePriceNgn} onChange={(e) => setForm({ ...form, basePriceNgn: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={submitForm} disabled={saving} className="col-span-2 sm:col-span-5 bg-[#037F44] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} Save device
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-[#848484]">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                <th className="py-2 px-4 font-normal">Brand</th>
                <th className="py-2 px-4 font-normal">Model</th>
                <th className="py-2 px-4 font-normal">Category</th>
                <th className="py-2 px-4 font-normal">Year</th>
                <th className="py-2 px-4 font-normal">Base price</th>
                <th className="py-2 px-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="text-[#434343]">
                  <td className="py-2 px-4">{e.brand}</td>
                  <td className="py-2 px-4">{e.model}</td>
                  <td className="py-2 px-4 capitalize">{e.category || "—"}</td>
                  <td className="py-2 px-4">{e.releaseYear || "—"}</td>
                  <td className="py-2 px-4">{e.basePriceNgn ? `₦${e.basePriceNgn.toLocaleString()}` : "—"}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => canManage && toggleActive(e)}
                      disabled={!canManage}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${e.isActive ? "bg-[#e6f9f0] text-[#037F44]" : "bg-gray-100 text-gray-500"}`}
                    >
                      {e.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-gray-400">No devices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function LimitsTab({ token, canManage }: { token: string | null; canManage: boolean }) {
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState<{ id: number; firstName: string; lastName: string; email: string } | null>(null);
  const [limit, setLimit] = useState<{ dailyLimit: number; monthlyLimit: number; dailyUsed: number; monthlyUsed: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const search = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setAccount(null);
    setLimit(null);
    try {
      const res = await fetch(`${API_URL}/admin/ai-studio/vendors/lookup?email=${encodeURIComponent(email.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Vendor not found");
      setAccount(data.data);

      const limitRes = await fetch(`${API_URL}/admin/ai-studio/limits/${data.data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const limitData = await limitRes.json();
      if (limitRes.ok) setLimit(limitData.data.limit);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vendor not found");
    } finally {
      setSearching(false);
    }
  };

  const saveLimits = async () => {
    if (!account || !limit) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/ai-studio/limits/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dailyLimit: limit.dailyLimit, monthlyLimit: limit.monthlyLimit }),
      });
      if (!res.ok) throw new Error("Failed to update limits");
      toast.success("Limits updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update limits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h3 className="text-base font-bold text-[#353535] mb-1">Vendor generation limits</h3>
      <p className="text-sm text-[#848484] mb-4">Look up a vendor by email to view or adjust their AI generation caps.</p>
      <div className="flex gap-2 mb-4 max-w-md">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="vendor@email.com"
          className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50"
        />
        <button onClick={search} disabled={searching} className="bg-[#037F44] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Find
        </button>
      </div>

      {account && limit && (
        <div className="border border-[#e5e7eb] rounded-xl p-4 max-w-md">
          <p className="text-sm font-semibold text-[#353535] mb-3">{account.firstName} {account.lastName} — {account.email}</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-[#353535] block mb-1">Daily limit</label>
              <input
                type="number"
                value={limit.dailyLimit}
                onChange={(e) => setLimit({ ...limit, dailyLimit: Number(e.target.value) })}
                disabled={!canManage}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              />
              <p className="text-[11px] text-[#848484] mt-1">Used today: {limit.dailyUsed}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#353535] block mb-1">Monthly limit</label>
              <input
                type="number"
                value={limit.monthlyLimit}
                onChange={(e) => setLimit({ ...limit, monthlyLimit: Number(e.target.value) })}
                disabled={!canManage}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              />
              <p className="text-[11px] text-[#848484] mt-1">Used this month: {limit.monthlyUsed}</p>
            </div>
          </div>
          {canManage && (
            <button onClick={saveLimits} disabled={saving} className="w-full bg-[#037F44] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save limits
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
