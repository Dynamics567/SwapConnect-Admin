"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import PageButton from "@/components/PageButton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface ReferrerSummary {
  id: number;
  name: string;
  email: string;
  totalReferrals?: number;
  qualifiedReferrals?: number;
}
interface ReferralRow {
  id: number;
  status: string;
  campaign: { id: number; name: string; qualifyingAction: string } | null;
  referrer: ReferrerSummary | null;
  referred: { id: number; name: string; email: string; accountType: string } | null;
  qualifiedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}
interface ReferrerRow {
  referrer: { id: number; name: string; email: string };
  totalReferrals: number;
  qualified: number;
  pending: number;
  expiredOrRejected: number;
  storeOwners: number;
  buyers: number;
  firstReferralAt: string;
  lastReferralAt: string;
}
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }

const STATUSES = ["", "registered", "awaiting_qualification", "qualification_pending_review", "qualified", "expired", "rejected"];
const ACCOUNT_TYPES = ["", "BUYER", "STORE_OWNER"];

// Combined, comma-separated values the Overview page's tiles link to (e.g.
// "registered,awaiting_qualification" for its "Awaiting Qualification"
// tile) -- these aren't individually selectable from the dropdown, which
// stays single-status, but a deep link carrying one must still be accepted
// and reflected rather than silently dropped back to "all statuses".
const VALID_STATUS_TOKENS = new Set(STATUSES.filter(Boolean));
function isValidStatusParam(value: string): boolean {
  return value.split(",").every((s) => VALID_STATUS_TOKENS.has(s.trim()));
}

const iso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "7d", label: "Last 7 days", range: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 6); return [iso(f), iso(t)]; } },
  { key: "30d", label: "Last 30 days", range: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 29); return [iso(f), iso(t)]; } },
  { key: "month", label: "This month", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; } },
  { key: "lastmonth", label: "Last month", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))]; } },
];

const inputClass = "border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm";

function ReferralsListContent() {
  const token = useAuthToken();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "referrers">("list");
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [referrers, setReferrers] = useState<ReferrerRow[]>([]);
  const [summary, setSummary] = useState<{ referrers: number; referrals: number } | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [accountType, setAccountType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [referrerFilter, setReferrerFilter] = useState<{ id: number; name: string } | null>(null);

  // Lets the Referral Overview page's summary cards deep-link straight into
  // the matching filtered view (e.g. ?status=qualified or
  // ?accountType=STORE_OWNER), instead of landing here with every referral
  // mixed together regardless of which number was clicked.
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl && isValidStatusParam(statusFromUrl)) setStatus(statusFromUrl);
    const accountTypeFromUrl = searchParams.get("accountType");
    if (accountTypeFromUrl && ACCOUNT_TYPES.includes(accountTypeFromUrl)) setAccountType(accountTypeFromUrl);
    if (searchParams.get("view") === "referrers") setView("referrers");
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [status, accountType, from, to, debouncedSearch, referrerFilter, view]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (accountType) params.set("accountType", accountType);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (view === "list" && referrerFilter) params.set("referrerId", String(referrerFilter.id));
      if (view === "referrers" && debouncedSearch) params.set("search", debouncedSearch);
      const path = view === "list" ? "referrals" : "referrers";
      const res = await fetch(`${API_URL}/api/admin/referrals/${path}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load referrals");
      if (view === "list") setRows(json.data);
      else {
        setReferrers(json.data);
        setSummary(json.summary);
      }
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status, accountType, from, to, view, referrerFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const activePreset = PRESETS.find((p) => { const [f, t] = p.range(); return f === from && t === to; })?.key ?? "";
  const showReferrer = (r: { id: number; name: string }) => {
    setReferrerFilter({ id: r.id, name: r.name });
    setView("list");
  };

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <ReferralTabs />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#353535]">Referrals</h1>
            <p className="text-sm text-[#6b7280] mt-1">Every referral attribution, across every campaign.</p>
          </div>
          <div className="inline-flex rounded-lg border border-[#e5e7eb] bg-white p-0.5 text-sm">
            {(["list", "referrers"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md transition-colors ${view === v ? "bg-[#037F44] text-white" : "text-[#6b7280] hover:text-[#353535]"}`}
              >
                {v === "list" ? "All referrals" : "By referrer"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-xs`}>
            {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>)}
            <option value="registered,awaiting_qualification">Awaiting qualification</option>
            <option value="expired,rejected">Expired or rejected</option>
          </select>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={`${inputClass} max-w-xs`}>
            <option value="">All account types</option>
            <option value="BUYER">Customers (Buyers)</option>
            <option value="STORE_OWNER">Store Owners</option>
          </select>
          <select
            value={activePreset}
            onChange={(e) => {
              const p = PRESETS.find((x) => x.key === e.target.value);
              if (p) { const [f, t] = p.range(); setFrom(f); setTo(t); } else { setFrom(""); setTo(""); }
            }}
            className={inputClass}
          >
            <option value="">{from || to ? "Custom range" : "All time"}</option>
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-[#6b7280]">
            From
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-[#6b7280]">
            To
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }} className="text-sm text-[#037F44] hover:underline">
              Clear dates
            </button>
          )}
          {view === "referrers" && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search referrer name or email"
              className={`${inputClass} w-64 max-w-full`}
            />
          )}
        </div>

        {view === "list" && referrerFilter && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-[#e6f9f0] text-[#037F44] rounded-full pl-3 pr-1.5 py-1">
              Referred by {referrerFilter.name}
              <button onClick={() => setReferrerFilter(null)} aria-label="Clear referrer filter" className="rounded-full p-0.5 hover:bg-[#037F44]/10">
                <X size={13} />
              </button>
            </span>
            {pagination && <span className="text-[#6b7280]">{pagination.totalItems} referral{pagination.totalItems === 1 ? "" : "s"}</span>}
          </div>
        )}

        {view === "referrers" && summary && (
          <p className="text-sm text-[#6b7280]">
            <span className="font-semibold text-[#353535]">{summary.referrers}</span> referrer{summary.referrers === 1 ? "" : "s"} brought in{" "}
            <span className="font-semibold text-[#353535]">{summary.referrals}</span> referral{summary.referrals === 1 ? "" : "s"}
            {from || to ? " in this period" : ""}.
          </p>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        {view === "list" ? (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Referred</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[#9ca3af]">No referrals match these filters.</td></tr>}
                {!loading && rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                    <td className="py-3 px-4">
                      {r.referrer ? (
                        <button onClick={() => showReferrer(r.referrer!)} className="text-left group" title="Show everyone this person referred">
                          <span className="text-[#353535] group-hover:text-[#037F44] group-hover:underline">{r.referrer.name}</span>
                          <span className="ml-2 inline-block text-[11px] font-semibold text-[#037F44] bg-[#e6f9f0] rounded-full px-2 py-0.5 align-middle">
                            {r.referrer.totalReferrals ?? 0} referred
                          </span>
                          <span className="block text-xs text-[#9ca3af]">{r.referrer.email}</span>
                        </button>
                      ) : (
                        <p className="text-[#353535]">—</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#353535]">{r.referred?.name || "—"}</p>
                      <p className="text-xs text-[#9ca3af]">{r.referred?.accountType}</p>
                    </td>
                    <td className="py-3 px-4 text-[#6b7280]">{r.campaign?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(r.status === "qualified" ? "success" : r.status === "expired" || r.status === "rejected" ? "failed" : "pending")}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                      {r.rejectionReason && <p className="text-[11px] text-red-600 mt-1 max-w-[160px]">{r.rejectionReason}</p>}
                    </td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{r.expiresAt ? fmtDate(r.expiresAt) : "No deadline"}</td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4 text-right">Total referred</th>
                  <th className="py-3 px-4 text-right">Store owners</th>
                  <th className="py-3 px-4 text-right">Buyers</th>
                  <th className="py-3 px-4 text-right">Qualified</th>
                  <th className="py-3 px-4 text-right">Pending</th>
                  <th className="py-3 px-4 text-right">Expired / rejected</th>
                  <th className="py-3 px-4">Last referral</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
                {!loading && referrers.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-[#9ca3af]">No referrers match these filters.</td></tr>}
                {!loading && referrers.map((r) => (
                  <tr
                    key={r.referrer.id}
                    onClick={() => showReferrer(r.referrer)}
                    className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb] cursor-pointer"
                    title="Show everyone this person referred"
                  >
                    <td className="py-3 px-4">
                      <p className="text-[#353535]">{r.referrer.name}</p>
                      <p className="text-xs text-[#9ca3af]">{r.referrer.email}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#037F44] tabular-nums">{r.totalReferrals}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.storeOwners}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.buyers}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.qualified}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.pending}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.expiredOrRejected}</td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.lastReferralAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <PageButton page={page} setPage={setPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} />
        )}
      </div>
    </div>
  );
}

export default function ReferralsListPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <Suspense fallback={null}>
        <ReferralsListContent />
      </Suspense>
    </ProtectedRoute>
  );
}
