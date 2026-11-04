"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import PageButton from "@/components/PageButton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtDate, statusBadgeClass } from "@/lib/financeFormat";

interface ReferralRow {
  id: number;
  status: string;
  campaign: { id: number; name: string; qualifyingAction: string } | null;
  referrer: { id: number; name: string; email: string } | null;
  referred: { id: number; name: string; email: string; accountType: string } | null;
  qualifiedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
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

function ReferralsListContent() {
  const token = useAuthToken();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [accountType, setAccountType] = useState("");

  // Lets the Referral Overview page's summary cards deep-link straight into
  // the matching filtered view (e.g. ?status=qualified or
  // ?accountType=STORE_OWNER), instead of landing here with every referral
  // mixed together regardless of which number was clicked.
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl && isValidStatusParam(statusFromUrl)) setStatus(statusFromUrl);
    const accountTypeFromUrl = searchParams.get("accountType");
    if (accountTypeFromUrl && ACCOUNT_TYPES.includes(accountTypeFromUrl)) setAccountType(accountTypeFromUrl);
  }, [searchParams]);

  useEffect(() => { setPage(1); }, [status, accountType]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (accountType) params.set("accountType", accountType);
      const res = await fetch(`${API_URL}/api/admin/referrals/referrals?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load referrals");
      setRows(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status, accountType]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <ReferralTabs />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">Referrals</h1>
          <p className="text-sm text-[#6b7280] mt-1">Every referral attribution, across every campaign.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm max-w-xs">
            {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>)}
            <option value="registered,awaiting_qualification">Awaiting qualification</option>
            <option value="expired,rejected">Expired or rejected</option>
          </select>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm max-w-xs">
            <option value="">All account types</option>
            <option value="BUYER">Customers (Buyers)</option>
            <option value="STORE_OWNER">Store Owners</option>
          </select>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

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
                    <p className="text-[#353535]">{r.referrer?.name || "—"}</p>
                    <p className="text-xs text-[#9ca3af]">{r.referrer?.email}</p>
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
