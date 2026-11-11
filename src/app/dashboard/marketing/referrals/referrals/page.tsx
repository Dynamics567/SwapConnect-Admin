"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { X, Info, UserRound } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import PageButton from "@/components/PageButton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface SignupRow {
  referred: { id: number; name: string; email: string; accountType: string };
  referrer: { id: number; name: string; email: string; totalSignups: number };
  referralId: number | null;
  campaign: { id: number; name: string } | null;
  status: string;
  expiresAt: string | null;
  qualifiedAt: string | null;
  rejectionReason: string | null;
  signedUpAt: string;
}
interface ReferrerRow {
  referrer: { id: number; name: string; email: string };
  totalSignups: number;
  counted: number;
  notCounted: number;
  qualified: number;
  pending: number;
  expiredOrRejected: number;
  storeOwners: number;
  buyers: number;
  lastSignupAt: string;
}
interface Summary { referrers?: number; signups: number; counted: number; notCounted: number }
interface Pagination { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number }
interface Campaign { id: number; name: string; status: string }

const STATUSES = ["", "registered", "awaiting_qualification", "qualification_pending_review", "qualified", "expired", "rejected"];
const ACCOUNT_TYPES = ["", "BUYER", "STORE_OWNER"];

// Combined, comma-separated values the Overview page's tiles link to (e.g.
// "registered,awaiting_qualification" for its "Awaiting Qualification"
// tile) -- these aren't individually selectable from the dropdown, which
// stays single-status, but a deep link carrying one must still be accepted
// and reflected rather than silently dropped back to "all statuses".
const VALID_STATUS_TOKENS = new Set([...STATUSES.filter(Boolean), "not_counted"]);
function isValidStatusParam(value: string): boolean {
  return value.split(",").every((s) => VALID_STATUS_TOKENS.has(s.trim()));
}

const SIGNUP_SORTS = [
  { key: "newest", label: "Newest signups" },
  { key: "oldest", label: "Oldest signups" },
  { key: "referrer", label: "Referrer A–Z" },
  { key: "campaign", label: "Campaign" },
];
const REFERRER_SORTS = [
  { key: "signups", label: "Most signups" },
  { key: "counted", label: "Most counted" },
  { key: "qualified", label: "Most qualified" },
  { key: "recent", label: "Most recent signup" },
  { key: "name", label: "Name A–Z" },
];

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

const inputClass = "border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm bg-white";

function StatusBadge({ status }: { status: string }) {
  if (status === "not_counted") {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Not counted</span>;
  }
  const tone = status === "qualified" ? "success" : status === "expired" || status === "rejected" ? "failed" : "pending";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(tone)}`}>{status.replace(/_/g, " ")}</span>;
}

// Opens the account's admin profile. stopPropagation so it never also
// triggers a clickable row's "filter to this referrer" action.
function ProfileLink({ id, label = "View profile" }: { id: number; label?: string }) {
  return (
    <Link
      href={`/dashboard/user/${id}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6b7280] hover:text-[#037F44] hover:underline"
    >
      <UserRound size={11} /> {label}
    </Link>
  );
}

function ReferralsListContent() {
  const token = useAuthToken();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"signups" | "referrers">("signups");
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [referrers, setReferrers] = useState<ReferrerRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [accountType, setAccountType] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [signupSort, setSignupSort] = useState("newest");
  const [referrerSort, setReferrerSort] = useState("signups");
  const [referrerFilter, setReferrerFilter] = useState<{ id: number; name: string } | null>(null);

  // Lets the Referral Overview page's summary cards deep-link straight into
  // the matching filtered view (e.g. ?status=qualified or
  // ?accountType=STORE_OWNER).
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl && isValidStatusParam(statusFromUrl)) setStatus(statusFromUrl);
    const accountTypeFromUrl = searchParams.get("accountType");
    if (accountTypeFromUrl && ACCOUNT_TYPES.includes(accountTypeFromUrl)) setAccountType(accountTypeFromUrl);
    const campaignFromUrl = searchParams.get("campaignId");
    if (campaignFromUrl) setCampaignId(campaignFromUrl);
    if (searchParams.get("view") === "referrers") setView("referrers");
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/referrals/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => setCampaigns(Array.isArray(j?.data) ? j.data : []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [status, accountType, campaignId, from, to, debouncedSearch, referrerFilter, view, signupSort, referrerSort]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (accountType) params.set("accountType", accountType);
      if (campaignId) params.set("campaignId", campaignId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (view === "signups") {
        params.set("sort", signupSort);
        if (referrerFilter) params.set("referrerId", String(referrerFilter.id));
      } else {
        params.set("sort", referrerSort);
      }
      const res = await fetch(`${API_URL}/api/admin/referrals/${view}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load referrals");
      if (view === "signups") setSignups(json.data);
      else setReferrers(json.data);
      setSummary(json.summary);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status, accountType, campaignId, from, to, view, referrerFilter, debouncedSearch, signupSort, referrerSort]);

  useEffect(() => { load(); }, [load]);

  const activePreset = PRESETS.find((p) => { const [f, t] = p.range(); return f === from && t === to; })?.key ?? "";
  const showReferrer = (r: { id: number; name: string }) => {
    setReferrerFilter({ id: r.id, name: r.name });
    setSearch("");
    setView("signups");
  };
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <ReferralTabs />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#353535]">Referrals</h1>
            <p className="text-sm text-[#6b7280] mt-1">Everyone who signed up through a referral link, and the campaign each signup counted toward.</p>
          </div>
          <div className="inline-flex rounded-lg border border-[#e5e7eb] bg-white p-0.5 text-sm">
            {(["signups", "referrers"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md transition-colors ${view === v ? "bg-[#037F44] text-white" : "text-[#6b7280] hover:text-[#353535]"}`}
              >
                {v === "signups" ? "All signups" : "By referrer"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={`${inputClass} max-w-xs`} aria-label="Campaign">
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}{c.status !== "active" ? ` (${c.status})` : ""}
              </option>
            ))}
            <option value="none">No campaign (not counted)</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-xs`} aria-label="Status">
            {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>)}
            <option value="registered,awaiting_qualification">Awaiting qualification</option>
            <option value="expired,rejected">Expired or rejected</option>
            <option value="not_counted">Not counted</option>
          </select>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={`${inputClass} max-w-xs`} aria-label="Account type">
            <option value="">All account types</option>
            <option value="BUYER">Customers (Buyers)</option>
            <option value="STORE_OWNER">Store Owners</option>
          </select>
          <select
            value={view === "signups" ? signupSort : referrerSort}
            onChange={(e) => (view === "signups" ? setSignupSort(e.target.value) : setReferrerSort(e.target.value))}
            className={inputClass}
            aria-label="Sort"
          >
            {(view === "signups" ? SIGNUP_SORTS : REFERRER_SORTS).map((s) => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view === "signups" ? "Search referrer or referred" : "Search referrer name or email"}
            className={`${inputClass} w-60 max-w-full`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 -mt-2">
          <select
            value={activePreset}
            onChange={(e) => {
              const p = PRESETS.find((x) => x.key === e.target.value);
              if (p) { const [f, t] = p.range(); setFrom(f); setTo(t); } else { setFrom(""); setTo(""); }
            }}
            className={inputClass}
            aria-label="Signup date"
          >
            <option value="">{from || to ? "Custom range" : "All time"}</option>
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-[#6b7280]">
            Signed up from
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-[#6b7280]">
            to
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }} className="text-sm text-[#037F44] hover:underline">
              Clear dates
            </button>
          )}
        </div>

        {view === "signups" && referrerFilter && (
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#e6f9f0] text-[#037F44] rounded-full pl-3 pr-1.5 py-1 text-sm">
              Referred by {referrerFilter.name}
              <button onClick={() => setReferrerFilter(null)} aria-label="Clear referrer filter" className="rounded-full p-0.5 hover:bg-[#037F44]/10">
                <X size={13} />
              </button>
            </span>
          </div>
        )}

        {summary && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm">
            {view === "referrers" && summary.referrers != null && (
              <span><span className="font-bold text-[#353535] tabular-nums">{summary.referrers}</span> <span className="text-[#6b7280]">referrers</span></span>
            )}
            <span><span className="font-bold text-[#353535] tabular-nums">{summary.signups}</span> <span className="text-[#6b7280]">signups</span></span>
            <span><span className="font-bold text-[#037F44] tabular-nums">{summary.counted}</span> <span className="text-[#6b7280]">counted by a campaign</span></span>
            <span><span className="font-bold text-[#6b7280] tabular-nums">{summary.notCounted}</span> <span className="text-[#6b7280]">not counted</span></span>
            {summary.notCounted > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#6b7280] basis-full">
                <Info size={13} className="shrink-0" />
                &ldquo;Not counted&rdquo; means no active campaign covered that account type when they signed up, so it earns no reward.
              </span>
            )}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        {view === "signups" ? (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Signed up</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Signup date</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
                {!loading && signups.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[#9ca3af]">No signups match these filters.</td></tr>}
                {!loading && signups.map((r) => (
                  <tr key={r.referred.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                    <td className="py-3 px-4">
                      <button onClick={() => showReferrer(r.referrer)} className="text-left group" title="Show everyone this person referred">
                        <span className="text-[#353535] group-hover:text-[#037F44] group-hover:underline">{r.referrer.name}</span>
                        <span className="ml-2 inline-block text-[11px] font-semibold text-[#037F44] bg-[#e6f9f0] rounded-full px-2 py-0.5 align-middle">
                          {plural(r.referrer.totalSignups, "signup")}
                        </span>
                        <span className="block text-xs text-[#9ca3af]">{r.referrer.email}</span>
                      </button>
                      <div className="mt-0.5"><ProfileLink id={r.referrer.id} /></div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#353535]">{r.referred.name}</p>
                      <p className="text-xs text-[#9ca3af]">{r.referred.accountType}</p>
                      <div className="mt-0.5"><ProfileLink id={r.referred.id} /></div>
                    </td>
                    <td className="py-3 px-4">
                      {r.campaign ? <span className="text-[#6b7280]">{r.campaign.name}</span> : <span className="text-[#9ca3af] italic">No campaign</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                      {r.rejectionReason && <p className="text-[11px] text-red-600 mt-1 max-w-[160px]">{r.rejectionReason}</p>}
                    </td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{r.referralId ? (r.expiresAt ? fmtDate(r.expiresAt) : "No deadline") : "—"}</td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.signedUpAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4 text-right">Signups</th>
                  <th className="py-3 px-4 text-right">Counted</th>
                  <th className="py-3 px-4 text-right">Not counted</th>
                  <th className="py-3 px-4 text-right">Store owners</th>
                  <th className="py-3 px-4 text-right">Buyers</th>
                  <th className="py-3 px-4 text-right">Qualified</th>
                  <th className="py-3 px-4 text-right">Pending</th>
                  <th className="py-3 px-4 text-right">Expired / rejected</th>
                  <th className="py-3 px-4">Last signup</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={10} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
                {!loading && referrers.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-[#9ca3af]">No referrers match these filters.</td></tr>}
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
                      <div className="mt-0.5"><ProfileLink id={r.referrer.id} /></div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#353535] tabular-nums">{r.totalSignups}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#037F44] tabular-nums">{r.counted}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#6b7280]">{r.notCounted}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.storeOwners}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.buyers}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.qualified}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.pending}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#353535]">{r.expiredOrRejected}</td>
                    <td className="py-3 px-4 text-[#9ca3af] text-xs">{fmtDate(r.lastSignupAt)}</td>
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
