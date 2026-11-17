"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { api } from "./campaignLabels";

interface Stats {
  views: number;
  uniqueSessions: number;
  clickThroughs: number;
  entries: number;
  bySource: { source: string; VIEW: number; OUTBOUND_CLICK: number; ENTRY: number }[];
}

const SITE = "https://swapconnect.africa";

// Public link + traffic attribution for one campaign (no personal data).
export default function CampaignTraffic({ token, campaignId, slug, isPublic, partnerSlug }: { token: string | null; campaignId: number; slug: string; isPublic: boolean; partnerSlug?: string | null }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const url = `${SITE}/campaigns/${slug}`;
  const partnerLink = partnerSlug ? `${url}?utm_source=${encodeURIComponent(partnerSlug)}` : null;

  useEffect(() => {
    if (!token) return;
    api<Stats>(token, `/campaigns/${campaignId}/stats`)
      .then(setStats)
      .catch(() => setStats(null));
  }, [token, campaignId]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <section className="border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">Public link and traffic</p>
      <div className="flex items-center gap-2 text-xs">
        <a href={url} target="_blank" rel="noopener noreferrer" className={`flex-1 min-w-0 truncate inline-flex items-center gap-1 ${isPublic ? "text-[#037F44] hover:underline" : "text-gray-400 pointer-events-none"}`}>
          {url.replace("https://", "")} <ExternalLink size={11} className="shrink-0" />
        </a>
        <button onClick={() => copy(url)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#037F44]" aria-label="Copy link">
          <Copy size={13} />
        </button>
      </div>
      {partnerLink && (
        <p className="text-[11px] text-gray-500 mt-1.5 break-all">
          Partner&apos;s tracked link: <button onClick={() => copy(partnerLink)} className="text-[#037F44] hover:underline text-left">{partnerLink.replace("https://", "")}</button>
        </p>
      )}
      {!isPublic && <p className="text-[11px] text-gray-500 mt-1.5">The link works once the campaign is published and not private.</p>}
      {stats && (
        <>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {(
              [
                ["Views", stats.views],
                ["Unique", stats.uniqueSessions],
                ["Click-outs", stats.clickThroughs],
                ["Entries", stats.entries],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-lg bg-[#f7f8fb] px-2 py-2 text-center">
                <p className="text-base font-bold text-gray-800 tabular-nums">{n}</p>
                <p className="text-[10.5px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {stats.bySource.length > 0 && (
            <table className="w-full text-[11px] mt-3">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="font-medium py-1">Source</th>
                  <th className="font-medium py-1 text-right">Views</th>
                  <th className="font-medium py-1 text-right">Click-outs</th>
                  <th className="font-medium py-1 text-right">Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.bySource.map((s) => (
                  <tr key={s.source} className="text-gray-700">
                    <td className="py-1">{s.source === "direct" ? "Direct / unknown" : s.source}</td>
                    <td className="py-1 text-right tabular-nums">{s.VIEW}</td>
                    <td className="py-1 text-right tabular-nums">{s.OUTBOUND_CLICK}</td>
                    <td className="py-1 text-right tabular-nums">{s.ENTRY}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
