"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { TYPE_LABELS, STATUS_LABELS, STATUS_STYLES, fmtDate, type ContributionType, type EnquiryStatus } from "./contributorLabels";

interface FollowUp {
  id: number;
  kind: string;
  body: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  Admin: { id: number; firstName: string; lastName: string } | null;
  Enquiry: {
    id: number;
    reference: string;
    type: ContributionType;
    status: EnquiryStatus;
    contactName: string;
    organisationName: string | null;
  } | null;
}

export default function FollowUpsTab() {
  const token = useAuthToken();
  const [kind, setKind] = useState<"FOLLOW_UP" | "CONTACT" | "">("FOLLOW_UP");
  const [rows, setRows] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const p = new URLSearchParams();
    if (kind) p.set("kind", kind);
    fetch(`${API_URL}/api/admin/contributors/activities?${p}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(d.data ?? []))
      .finally(() => setLoading(false));
  }, [token, kind]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Follow-ups</h1>
          <p className="text-xs text-gray-500 mt-0.5">Recent follow-up and contact activity across all contributor enquiries.</p>
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <option value="FOLLOW_UP">Follow-ups</option>
          <option value="CONTACT">Contact records</option>
          <option value="">All activity</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Nothing recorded yet.</div>
        ) : (
          rows.map((a) => (
            <div key={a.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
              <div className="sm:w-56 shrink-0">
                {a.Enquiry ? (
                  <Link href={`/dashboard/contributors?tab=${a.Enquiry.type.toLowerCase()}&id=${a.Enquiry.id}`} className="text-sm font-semibold text-[#037F44] hover:underline tabular-nums">
                    {a.Enquiry.reference}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
                {a.Enquiry && (
                  <p className="text-xs text-gray-500">
                    {a.Enquiry.organisationName || a.Enquiry.contactName} · {TYPE_LABELS[a.Enquiry.type]}
                  </p>
                )}
                {a.Enquiry && <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.Enquiry.status]}`}>{STATUS_LABELS[a.Enquiry.status]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.body || <span className="text-gray-400">(no note)</span>}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {a.kind.replace("_", " ").toLowerCase()}
                  {a.meta?.channel ? ` via ${String(a.meta.channel).toLowerCase()}` : ""} · {a.Admin ? `${a.Admin.firstName} ${a.Admin.lastName}` : "system"} · {fmtDate(a.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
