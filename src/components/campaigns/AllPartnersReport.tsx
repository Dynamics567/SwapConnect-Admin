"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChevronDown, ChevronRight, Download } from "lucide-react";
import { api } from "./campaignLabels";
import { downloadAdminCsv } from "./CampaignReportCard";

interface Row {
  id: number;
  name: string;
  status: string;
  campaigns: number;
  live: number;
  views: number;
  entries: number;
  winners: number;
  delivered: number;
  activeKeys: number;
  activeWebhooks: number;
  failingDeliveries: number;
}

// Every partner side by side: campaign reach and outcomes, plus integration
// health (keys, webhooks, failing deliveries) so problems are visible here.
export default function AllPartnersReport({ token, onOpen }: { token: string | null; onOpen: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    if (!open || !token) return;
    api<Row[]>(token, "/reports/partners")
      .then(setRows)
      .catch(() => setRows([]));
  }, [open, token]);
  const failing = rows?.filter((r) => r.failingDeliveries > 0).length || 0;
  const num = (n: number) => n.toLocaleString("en-NG");

  return (
    <div className="bg-white rounded-xl shadow mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <BarChart3 size={15} className="text-[#037F44]" /> Partners report
        </button>
        <button onClick={() => downloadAdminCsv(token, "/reports/partners.csv", "partners-report.csv")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#037F44] hover:underline">
          <Download size={13} /> CSV
        </button>
      </div>
      {open && (
        <div className="border-t border-gray-100">
          {rows === null ? (
            <p className="px-4 py-6 text-xs text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-6 text-xs text-gray-500">No partners yet.</p>
          ) : (
            <>
              {failing > 0 && (
                <p className="mx-4 mt-3 text-xs rounded-lg bg-[#fef6e4] text-[#7a560c] px-3 py-2">
                  {failing} partner{failing === 1 ? " has" : "s have"} webhook deliveries failing. Open the partner to see why and re-send.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-gray-500 text-left">
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2 font-medium">Partner</th>
                      <th className="px-3 py-2 font-medium text-right">Campaigns</th>
                      <th className="px-3 py-2 font-medium text-right">Live</th>
                      <th className="px-3 py-2 font-medium text-right">Views</th>
                      <th className="px-3 py-2 font-medium text-right">Entries</th>
                      <th className="px-3 py-2 font-medium text-right">Winners</th>
                      <th className="px-3 py-2 font-medium text-right">Delivered</th>
                      <th className="px-3 py-2 font-medium text-right">API keys</th>
                      <th className="px-3 py-2 font-medium text-right">Webhooks</th>
                      <th className="px-4 py-2 font-medium text-right">Failing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 tabular-nums">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onOpen(r.id)}>
                        <td className="px-4 py-2 font-semibold text-gray-800 whitespace-nowrap">{r.name}</td>
                        <td className="px-3 py-2 text-right">{num(r.campaigns)}</td>
                        <td className="px-3 py-2 text-right">{num(r.live)}</td>
                        <td className="px-3 py-2 text-right">{num(r.views)}</td>
                        <td className="px-3 py-2 text-right">{num(r.entries)}</td>
                        <td className="px-3 py-2 text-right">{num(r.winners)}</td>
                        <td className="px-3 py-2 text-right">{num(r.delivered)}</td>
                        <td className="px-3 py-2 text-right">{num(r.activeKeys)}</td>
                        <td className="px-3 py-2 text-right">{num(r.activeWebhooks)}</td>
                        <td className={`px-4 py-2 text-right ${r.failingDeliveries ? "text-[#b42318] font-semibold" : ""}`}>{num(r.failingDeliveries)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
