"use client";

import { useState, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FinanceTabs from "@/components/finance/FinanceTabs";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { fmtNaira } from "@/lib/financeFormat";

type Period = "today" | "7d" | "30d" | "this_month" | "last_month" | "custom";

interface Metric {
  value: number | null;
  available: boolean;
  definition: string;
  partial?: boolean;
  pointInTime?: boolean;
  count?: number;
  breakdown?: Record<string, number>;
}

interface OverviewData {
  period: { from: string; to: string };
  currency: string;
  metrics: Record<string, Metric>;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Previous month" },
  { key: "custom", label: "Custom range" },
];

const METRIC_LABELS: Record<string, string> = {
  grossTransactionValue: "Gross Transaction Value",
  totalSuccessfulCollections: "Successful Collections",
  totalPlatformCommissionEarned: "Platform Commission Earned",
  totalWithdrawalFeesEarned: "Withdrawal Fees Earned",
  paymentProcessingFees: "Payment Processing Fees",
  refundsIssued: "Refunds Issued",
  chargebacksAndDisputedAmounts: "Disputed Amount",
  pendingSettlements: "Pending Settlements",
  sellerFundsPendingRelease: "Seller Funds Pending Release",
  sellerFundsAvailableForWithdrawal: "Seller Funds Withdrawable",
  totalSellerPayouts: "Total Seller Payouts",
  failedAndPendingPayouts: "Failed/Pending Payouts",
  netPlatformRevenue: "Net Platform Revenue",
  reconciliationDiscrepancies: "Reconciliation Discrepancies",
};

function MetricCard({ name, metric }: { name: string; metric: Metric }) {
  if (!metric.available) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-[#e5e7eb] p-5">
        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">{METRIC_LABELS[name] || name}</p>
        <p className="text-sm text-[#9ca3af] mb-2">Not available</p>
        <p className="text-xs text-[#9ca3af] leading-relaxed">{metric.definition}</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 group relative">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{METRIC_LABELS[name] || name}</p>
        <Info size={13} className="text-[#d1d5db] shrink-0" />
      </div>
      <p className="text-2xl font-bold text-[#353535]">
        {fmtNaira(metric.value)}
        {metric.count != null && <span className="text-xs font-normal text-[#9ca3af] ml-1.5">({metric.count})</span>}
      </p>
      {metric.partial && <p className="text-[11px] text-brand-gold-hover mt-1">Partial data -- see definition</p>}
      {metric.pointInTime && <p className="text-[11px] text-[#9ca3af] mt-1">Current state, not period-scoped</p>}
      <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity absolute left-5 right-5 top-full bg-white border border-[#e5e7eb] rounded-lg p-2.5 shadow-lg z-10">
        {metric.definition}
      </p>
    </div>
  );
}

function FinanceOverviewContent() {
  const token = useAuthToken();
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period === "custom") {
        if (customFrom) params.set("from", customFrom);
        if (customTo) params.set("to", customTo);
      } else {
        params.set("period", period);
      }
      const res = await fetch(`${API_URL}/api/admin/finance/overview?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load financial overview");
      setData(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, period, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div>
        <h1 className="text-xl font-bold text-[#353535]">Financial Overview</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Real, period-scoped financial metrics. Cards with a dashed border reflect data that genuinely isn&apos;t
          available yet (no fabricated numbers) -- hover a solid card for its exact definition.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              period === p.key
                ? "bg-brand-emerald text-white border-brand-emerald"
                : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-brand-emerald"
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm" />
            <span className="text-[#9ca3af] text-sm">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm" />
          </div>
        )}
      </div>

      {data && (
        <p className="text-xs text-[#9ca3af]">
          Period: {new Date(data.period.from).toLocaleDateString("en-NG")} — {new Date(data.period.to).toLocaleDateString("en-NG")} · {data.currency}
        </p>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
      {loading && <div className="text-sm text-[#6b7280] p-6">Loading…</div>}

      {data && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.metrics).map(([name, metric]) => (
            <MetricCard key={name} name={name} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinanceOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <div className="flex flex-col gap-0 w-full min-w-0">
        <FinanceTabs />
        <FinanceOverviewContent />
      </div>
    </ProtectedRoute>
  );
}
