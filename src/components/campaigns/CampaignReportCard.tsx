"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { api, CAMPAIGN_API } from "./campaignLabels";
import { Funnel, DailyActivity, type FunnelStage, type DailyPoint } from "@/components/reports/CampaignReportCharts";

interface Report {
  totals: { delivered: number; receiptConfirmed: number };
  funnel: FunnelStage[];
  daily: DailyPoint[];
}

/** Downloads a CSV from the admin campaign-integration API. */
export async function downloadAdminCsv(token: string | null, path: string, fallback: string) {
  try {
    const res = await fetch(`${CAMPAIGN_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || (res.status === 403 ? "Exports are limited to admins." : "Download failed."));
    }
    const blob = await res.blob();
    const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] || fallback;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    toast.error((e as Error).message);
  }
}

export default function CampaignReportCard({ token, campaignId, slug, external }: { token: string | null; campaignId: number; slug: string; external: boolean }) {
  const [report, setReport] = useState<Report | null>(null);
  const [days, setDays] = useState(30);
  useEffect(() => {
    if (!token) return;
    api<Report>(token, `/campaigns/${campaignId}/report?days=${days}`)
      .then(setReport)
      .catch(() => setReport(null));
  }, [token, campaignId, days]);

  return (
    <section className="border-t border-gray-100 pt-4 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-700">Report</p>
        <div className="flex flex-wrap gap-2">
          {!external && (
            <button onClick={() => downloadAdminCsv(token, `/campaigns/${campaignId}/entries.csv`, `${slug}-entries.csv`)} className="inline-flex items-center gap-1 text-[11px] font-semibold border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">
              <Download size={12} /> Entries CSV
            </button>
          )}
          <button onClick={() => downloadAdminCsv(token, `/campaigns/${campaignId}/winners.csv`, `${slug}-winners.csv`)} className="inline-flex items-center gap-1 text-[11px] font-semibold border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">
            <Download size={12} /> Winners CSV
          </button>
        </div>
      </div>
      {!report ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <>
          <Funnel stages={report.funnel} />
          <div>
            <div className="flex justify-end mb-2">
              <div className="flex rounded-lg border border-gray-200 p-0.5 text-[11px]" role="group" aria-label="Time range">
                {[7, 30, 90].map((d) => (
                  <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={`px-2 py-0.5 rounded-md font-medium ${days === d ? "bg-[#101512] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {/* The detail panel is narrow: stack the two daily charts. */}
            <DailyActivity points={report.daily} showEntries={!external} stacked />
          </div>
          {report.totals.delivered > 0 && (
            <p className="text-[11px] text-gray-500">
              {report.totals.receiptConfirmed} of {report.totals.delivered} delivered prize{report.totals.delivered === 1 ? "" : "s"} confirmed received by the winner.
            </p>
          )}
        </>
      )}
    </section>
  );
}
