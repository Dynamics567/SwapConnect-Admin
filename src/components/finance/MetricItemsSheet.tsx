"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { Sheet } from "@/components/campaigns/Sheet";
import { API_URL } from "@/lib/config";
import { fmtDate, fmtNaira, STATUS_STYLES } from "@/lib/financeFormat";
import EnvBadge from "@/components/finance/EnvBadge";

interface Party { id: number; name: string | null; email: string }

interface LineItem {
  kind: "order" | "transaction" | "wallet";
  id: number | string;
  date: string;
  amount: number;
  label: string;
  reference?: string;
  status?: string;
  escrowStatus?: string;
  method?: string;
  environment?: string | null;
  orderId?: number | null;
  party?: Party | null;
  seller?: Party | null;
  source: string;
}

interface ItemsResponse {
  data: { total: number; items: LineItem[]; truncated?: boolean };
  pagination: { totalItems: number; totalPages: number; currentPage: number };
}

const SOURCE_LABELS: Record<string, string> = {
  totalPlatformCommissionEarned: "Commission",
  totalWithdrawalFeesEarned: "Withdrawal fee",
  refundsIssued: "Refund",
};

const PARTY_ROLE: Record<string, string> = {
  order: "Buyer",
  transaction: "Customer",
  wallet: "Wallet owner",
};

/**
 * The line items behind one Financial Overview card. Rows come from the same
 * server-side definition as the card's figure, so they always add up to it.
 */
export default function MetricItemsSheet({
  token,
  metric,
  title,
  cardValue,
  periodParams,
  onClose,
}: {
  token: string | null;
  metric: string | null;
  title: string;
  cardValue: number | null;
  periodParams: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<ItemsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPage(1); setRes(null); }, [metric, periodParams]);

  useEffect(() => {
    if (!metric || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/admin/finance/overview/${metric}/items?${periodParams}&page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json?.error || "Could not load the line items");
        if (!cancelled) setRes(json);
      })
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [metric, token, periodParams, page]);

  const items = res?.data.items ?? [];
  const pg = res?.pagination;

  return (
    <Sheet
      open={!!metric}
      title={title}
      onClose={onClose}
      wide
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <p className="text-xs text-[#6b7280]">
            {pg ? `${pg.totalItems} ${pg.totalItems === 1 ? "item" : "items"}` : ""}
            {res && cardValue != null && res.data.total === cardValue && " · adds up to the card figure"}
          </p>
          {pg && pg.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-[#6b7280] tabular-nums">{page} / {pg.totalPages}</span>
              <button
                type="button"
                disabled={page >= pg.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="flex items-baseline justify-between rounded-xl bg-[#f7f8fb] px-4 py-3">
        <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Total</span>
        <span className="text-xl font-bold text-[#353535] tabular-nums">{fmtNaira(res?.data.total ?? cardValue)}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>}

      {loading && !res && (
        <div className="flex items-center gap-2 text-sm text-[#6b7280] py-6 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading line items…
        </div>
      )}

      {res && items.length === 0 && !loading && (
        <p className="text-sm text-[#6b7280] text-center py-8">Nothing makes up this figure in the selected period.</p>
      )}

      {items.length > 0 && (
        <ul className={`divide-y divide-gray-100 border border-gray-100 rounded-xl ${loading ? "opacity-60" : ""}`}>
          {items.map((it) => {
            const status = it.escrowStatus && it.escrowStatus !== "none" ? it.escrowStatus : it.status;
            return (
              <li key={`${it.source}-${it.kind}-${it.id}`} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {SOURCE_LABELS[it.source] && metric === "netPlatformRevenue" && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{SOURCE_LABELS[it.source]}</span>
                    )}
                    {it.orderId ? (
                      <Link href={`/dashboard/orders/${it.orderId}`} className="text-sm font-semibold text-brand-emerald hover:underline inline-flex items-center gap-1">
                        {it.kind === "order" ? it.label : `${it.label} · Order #${it.orderId}`}
                        <ExternalLink size={11} />
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-[#353535]">{it.label}</span>
                    )}
                    {status && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
                        {status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b7280]">
                    {fmtDate(it.date)}
                    {it.method && ` · ${it.method}`}
                    {it.reference && <span className="font-mono"> · {it.reference}</span>}
                  </p>
                  {it.party && (
                    <p className="text-xs text-[#6b7280]">
                      {PARTY_ROLE[it.kind]}:{" "}
                      <Link href={`/dashboard/user/${it.party.id}`} className="text-[#353535] hover:text-brand-emerald hover:underline">
                        {it.party.name || it.party.email}
                      </Link>
                      {it.seller && (
                        <>
                          {" · Seller: "}
                          <Link href={`/dashboard/user/${it.seller.id}`} className="text-[#353535] hover:text-brand-emerald hover:underline">
                            {it.seller.name || it.seller.email}
                          </Link>
                        </>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${it.amount < 0 ? "text-red-600" : "text-[#353535]"}`}>
                    {it.amount < 0 ? `−${fmtNaira(-it.amount)}` : fmtNaira(it.amount)}
                  </span>
                  {it.kind !== "wallet" && <EnvBadge env={it.environment} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {res?.data.truncated && (
        <p className="text-[11px] text-[#9ca3af]">Showing the most recent rows only for this combined figure.</p>
      )}
    </Sheet>
  );
}
