"use client";
import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
} from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import ProtectedRoute from "@/components/ProtectedRoute";
import { downloadCsv } from "@/lib/csv";

interface DayStat {
  date: string;
  count?: number | string;
  revenue?: number | string;
}

interface ReportData {
  summary: {
    totalRevenue: number | string;
    totalUsers: number | string;
    totalOrders: number | string;
  };
  revenueSeries: DayStat[];
  signupSeries: DayStat[];
}

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-NG");
}

function MiniBar({ series, valueKey, color }: { series: DayStat[]; valueKey: "revenue" | "count"; color: string }) {
  if (!series.length) return <p className="text-xs text-[#848484]">No data yet</p>;
  const vals = series.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-[3px] h-10 mt-2">
      {vals.map((v, i) => (
        <div
          key={i}
          title={`${series[i].date}: ${v}`}
          style={{ height: `${Math.max(4, (v / max) * 100)}%`, backgroundColor: color, flex: 1, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const token = useAuthToken();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Also pull recent signups and transactions from existing endpoints
  const [recentSignups, setRecentSignups] = useState<{ name: string; email: string; date: string }[]>([]);
  const [recentTxns, setRecentTxns] = useState<{ reference: string; amount: number; status: string; date: string }[]>([]);
  const [exporting, setExporting] = useState<"signups" | "transactions" | "trends" | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [rpt, signups, txns] = await Promise.all([
          fetch(`${API_URL}/api/admin/reports`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/admin/signups/recent`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/admin/transactions/recent`, { headers }).then((r) => r.json()),
        ]);
        if (rpt.success) setData(rpt.data);
        // Real response shape is { signups: [...] }, not { data: [...] } --
        // this previously always fell through to "No recent signups".
        if (signups.signups) {
          setRecentSignups(
            (signups.signups as { firstName?: string; lastName?: string; name?: string; email?: string; createdAt?: string }[]).slice(0, 8).map((u) => ({
              name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—",
              email: u.email || "—",
              date: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG") : "—",
            }))
          );
        }
        // The real response shape is { transactions: { combined: [...] } },
        // not a top-level `data` array -- this previously always fell
        // through to "No recent transactions" regardless of real data.
        if (txns.transactions?.combined) {
          setRecentTxns(
            (txns.transactions.combined as { reference?: string; amount?: number; status?: string; createdAt?: string }[]).slice(0, 8).map((t) => ({
              reference: t.reference || "—",
              amount: Number(t.amount || 0),
              status: t.status || "—",
              date: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-NG") : "—",
            }))
          );
        }
      } catch {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // These pull a much larger window than the 8-row on-screen preview --
  // a "download" that only ever exports the same 8 rows shown on screen
  // wouldn't be a real report.
  const exportSignups = async () => {
    setExporting("signups");
    try {
      const res = await fetch(`${API_URL}/api/admin/signups/recent?limit=5000&days=3650`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const rows = (json.signups || []).map((u: { firstName?: string; lastName?: string; email?: string; phone?: string; role?: string; createdAt?: string }) => ({
        Name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—",
        Email: u.email || "—",
        Phone: u.phone || "—",
        Role: u.role || "—",
        "Joined date": u.createdAt ? new Date(u.createdAt).toISOString() : "—",
      }));
      downloadCsv(`swapconnect-signups-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } finally {
      setExporting(null);
    }
  };

  const exportTransactions = async () => {
    setExporting("transactions");
    try {
      const res = await fetch(`${API_URL}/api/admin/transactions/recent?limit=5000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const rows = (json.transactions?.combined || []).map((t: { reference?: string; amount?: number; status?: string; createdAt?: string }) => ({
        Reference: t.reference || "—",
        "Amount (NGN)": Number(t.amount || 0),
        Status: t.status || "—",
        Date: t.createdAt ? new Date(t.createdAt).toISOString() : "—",
      }));
      downloadCsv(`swapconnect-transactions-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } finally {
      setExporting(null);
    }
  };

  const exportTrends = () => {
    if (!data) return;
    setExporting("trends");
    const byDate = new Map<string, { date: string; revenue: number; signups: number }>();
    data.revenueSeries.forEach((d) => {
      byDate.set(d.date, { date: d.date, revenue: Number(d.revenue ?? 0), signups: byDate.get(d.date)?.signups ?? 0 });
    });
    data.signupSeries.forEach((d) => {
      const existing = byDate.get(d.date);
      byDate.set(d.date, { date: d.date, revenue: existing?.revenue ?? 0, signups: Number(d.count ?? 0) });
    });
    const rows = Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ Date: d.date, "Revenue (NGN)": d.revenue, Signups: d.signups }));
    downloadCsv(`swapconnect-30day-trends-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setExporting(null);
  };

  const summary = [
    {
      label: "Total Revenue",
      value: data ? `₦${fmt(data.summary.totalRevenue)}` : "—",
      icon: <DollarSign size={20} className="text-[#037F44]" />,
      sub: "All successful transactions",
      trend: null,
    },
    {
      label: "Total Users",
      value: data ? fmt(data.summary.totalUsers) : "—",
      icon: <Users size={20} className="text-[#037F44]" />,
      sub: "Registered accounts",
      trend: null,
    },
    {
      label: "Total Orders",
      value: data ? fmt(data.summary.totalOrders) : "—",
      icon: <ShoppingBag size={20} className="text-[#037F44]" />,
      sub: "All time orders",
      trend: null,
    },
    {
      label: "30-day Signups",
      value: data
        ? fmt(data.signupSeries.reduce((s, d) => s + Number(d.count ?? 0), 0))
        : "—",
      icon: <TrendingUp size={20} className="text-[#037F44]" />,
      sub: "New users last 30 days",
      trend: null,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
      <div className="w-full min-w-0">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#353535]">Reports</h1>
            <p className="text-sm text-[#848484] mt-1">Platform overview and activity</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportSignups}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-[#e5e7eb] text-[#353535] hover:border-[#037F44] hover:text-[#037F44] transition disabled:opacity-60"
            >
              {exporting === "signups" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Signups CSV
            </button>
            <button
              onClick={exportTransactions}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-[#e5e7eb] text-[#353535] hover:border-[#037F44] hover:text-[#037F44] transition disabled:opacity-60"
            >
              {exporting === "transactions" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Transactions CSV
            </button>
            <button
              onClick={exportTrends}
              disabled={exporting !== null || !data}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-[#e5e7eb] text-[#353535] hover:border-[#037F44] hover:text-[#037F44] transition disabled:opacity-60"
            >
              {exporting === "trends" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              30-Day Trends CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5 animate-pulse h-[90px]" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm mb-8">{error}</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {summary.map((s) => (
                <div key={s.label} className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-[#f0faf5] rounded-lg p-2">{s.icon}</span>
                  </div>
                  <div className="text-xl font-bold text-[#353535]">{s.value}</div>
                  <div className="text-xs text-[#848484] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Revenue trend */}
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[#353535]">Revenue — Last 30 Days</h3>
                  <span className="text-xs text-[#848484]">Successful txns</span>
                </div>
                <div className="text-xl font-bold text-[#037F44] mb-1">
                  ₦{fmt(data?.revenueSeries.reduce((s, d) => s + Number(d.revenue ?? 0), 0) ?? 0)}
                </div>
                <MiniBar series={data?.revenueSeries ?? []} valueKey="revenue" color="#037F44" />
                <div className="flex justify-between text-[10px] text-[#c0c0c0] mt-1">
                  <span>30d ago</span><span>Today</span>
                </div>
              </div>

              {/* Signup trend */}
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[#353535]">New Users — Last 30 Days</h3>
                  <span className="text-xs text-[#848484]">Registrations</span>
                </div>
                <div className="text-xl font-bold text-[#d7a825] mb-1">
                  {fmt(data?.signupSeries.reduce((s, d) => s + Number(d.count ?? 0), 0) ?? 0)} users
                </div>
                <MiniBar series={data?.signupSeries ?? []} valueKey="count" color="#d7a825" />
                <div className="flex justify-between text-[10px] text-[#c0c0c0] mt-1">
                  <span>30d ago</span><span>Today</span>
                </div>
              </div>
            </div>

            {/* Tables row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent signups */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-sm font-semibold text-[#353535] mb-4">Recent Signups</h3>
                {recentSignups.length === 0 ? (
                  <p className="text-xs text-[#848484]">No recent signups</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f0f0f0]">
                        <th className="text-left text-[11px] font-semibold text-[#848484] pb-2 uppercase tracking-wide">Name</th>
                        <th className="text-left text-[11px] font-semibold text-[#848484] pb-2 uppercase tracking-wide">Email</th>
                        <th className="text-right text-[11px] font-semibold text-[#848484] pb-2 uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSignups.map((u, i) => (
                        <tr key={i} className="border-b border-[#f8f9fb] last:border-0">
                          <td className="py-2 font-medium text-[#353535] text-xs">{u.name}</td>
                          <td className="py-2 text-[#848484] text-xs">{u.email}</td>
                          <td className="py-2 text-right text-[#848484] text-xs">{u.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Recent transactions */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-sm font-semibold text-[#353535] mb-4">Recent Transactions</h3>
                {recentTxns.length === 0 ? (
                  <p className="text-xs text-[#848484]">No recent transactions</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f0f0f0]">
                        <th className="text-left text-[11px] font-semibold text-[#848484] pb-2 uppercase tracking-wide">Reference</th>
                        <th className="text-right text-[11px] font-semibold text-[#848484] pb-2 uppercase tracking-wide">Amount</th>
                        <th className="text-right text-[11px] font-semibold text-[#848484] pb-2 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTxns.map((t, i) => (
                        <tr key={i} className="border-b border-[#f8f9fb] last:border-0">
                          <td className="py-2 font-mono text-[11px] text-[#353535] truncate max-w-[140px]">{t.reference}</td>
                          <td className="py-2 text-right text-xs font-semibold text-[#353535]">₦{fmt(t.amount)}</td>
                          <td className="py-2 text-right">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              t.status === "success"
                                ? "bg-[#e6f9f0] text-[#037F44]"
                                : t.status === "failed"
                                ? "bg-red-50 text-red-600"
                                : "bg-[#fef9ec] text-[#b08000]"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
