"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { Download, Mail, Phone, Globe, UserCheck, UserMinus } from "lucide-react";
import {
  TYPE_LABELS,
  ENTITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  DETAIL_FIELD_TITLES,
  renderDetailValue,
  fmtDate,
  type ContributionType,
  type EntityType,
  type EnquiryStatus,
} from "./contributorLabels";

interface AdminRef {
  id: number;
  firstName: string;
  lastName: string;
}
interface Activity {
  id: number;
  kind: "NOTE" | "FOLLOW_UP" | "CONTACT" | "STATUS_CHANGE" | "ASSIGNMENT";
  body: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  Admin: AdminRef | null;
}
interface Enquiry {
  id: number;
  reference: string;
  type: ContributionType;
  entityType: EntityType;
  classification: string;
  organisationName: string | null;
  website: string | null;
  contactName: string;
  email: string;
  phone: string | null;
  location: string | null;
  details: Record<string, unknown>;
  status: EnquiryStatus;
  accountId: number | null;
  giveListingsCount: number;
  createdAt: string;
  Account: { id: number; firstName: string; lastName: string; accountType: string } | null;
  AssignedAdmin: AdminRef | null;
  Activities?: Activity[];
  otherEnquiries?: { id: number; reference: string; type: ContributionType; status: EnquiryStatus; createdAt: string }[];
}

const KIND_LABEL: Record<Activity["kind"], string> = {
  NOTE: "Note",
  FOLLOW_UP: "Follow-up",
  CONTACT: "Contact",
  STATUS_CHANGE: "Status change",
  ASSIGNMENT: "Assignment",
};

export default function EnquiriesTab({ type }: { type: ContributionType }) {
  const token = useAuthToken();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [entityType, setEntityType] = useState("");
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [assigned, setAssigned] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Enquiry | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [activityKind, setActivityKind] = useState<"NOTE" | "FOLLOW_UP" | "CONTACT">("NOTE");
  const [contactChannel, setContactChannel] = useState("EMAIL");
  const [activityBody, setActivityBody] = useState("");

  // Deep links from the Overview tiles / Follow-ups tab.
  useEffect(() => {
    const a = searchParams.get("assigned");
    if (a === "me" || a === "unassigned") setAssigned(a);
    const id = Number(searchParams.get("id"));
    if (id) setSelectedId(id);
  }, [searchParams]);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ type });
    if (status) p.set("status", status);
    if (entityType) p.set("entityType", entityType);
    if (location.trim()) p.set("location", location.trim());
    if (search.trim()) p.set("search", search.trim());
    if (assigned) p.set("assigned", assigned);
    return p.toString();
  }, [type, status, entityType, location, search, assigned]);

  const fetchRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/contributors?${buildParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRows(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, buildParams]);

  const loadDetail = useCallback(
    async (id: number) => {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/contributors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setDetail(data.data);
        setNextStatus(data.data.status);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);
  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const post = async (path: string, method: string, body: unknown) => {
    if (!token || !selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/contributors/${selectedId}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || "Something went wrong.");
        return false;
      }
      await Promise.all([loadDetail(selectedId), fetchRows()]);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!nextStatus || nextStatus === detail?.status) return;
    const ok = await post("/status", "PATCH", { status: nextStatus, note: statusNote || undefined });
    if (ok) setStatusNote("");
  };
  const assignMe = (assign: "me" | "none") => post("/assign", "PATCH", { assign });
  const addActivity = async () => {
    if (!activityBody.trim()) {
      setError("Write a note first.");
      return;
    }
    const ok = await post("/activities", "POST", {
      kind: activityKind,
      body: activityBody,
      meta: activityKind === "CONTACT" ? { channel: contactChannel } : undefined,
    });
    if (ok) setActivityBody("");
  };

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/contributors/export?${buildParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export failed. Exports are restricted to admin/superadmin roles.");
      const blob = await res.blob();
      const m = (res.headers.get("Content-Disposition") || "").match(/filename="(.+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = m?.[1] || "contributor_enquiries.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const detailEntries = detail
    ? Object.entries(detail.details || {}).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0))
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{TYPE_LABELS[type]} Enquiries</h1>
          <p className="text-xs text-gray-500 mt-0.5">Expressions of interest from the Give / Sponsor / Partner onboarding pathway.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || rows.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={14} /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">All contributor types</option>
          {(Object.keys(ENTITY_LABELS) as EntityType[]).map((k) => (
            <option key={k} value={k}>
              {ENTITY_LABELS[k]}
            </option>
          ))}
        </select>
        <select value={assigned} onChange={(e) => setAssigned(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">Any assignee</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-36" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, organisation or reference"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-72 max-w-full"
        />
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5">Reference</th>
                  <th className="text-left px-4 py-2.5">Contributor</th>
                  <th className="text-left px-4 py-2.5">Classification</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Assigned</th>
                  <th className="text-left px-4 py-2.5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No enquiries match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer hover:bg-gray-50 ${selectedId === r.id ? "bg-[#e6f9f0]" : ""}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800 tabular-nums">{r.reference}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-gray-800">{r.organisationName || r.contactName}</div>
                        <div className="text-xs text-gray-400">{r.organisationName ? r.contactName : r.location || ""}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{r.classification}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{r.AssignedAdmin ? `${r.AssignedAdmin.firstName} ${r.AssignedAdmin.lastName}` : "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          {!detail ? (
            <div className="text-center py-20 text-gray-400 text-sm">Select an enquiry to review it.</div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-gray-800 tabular-nums">{detail.reference}</h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[detail.status]}`}>{STATUS_LABELS[detail.status]}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {detail.classification} · {ENTITY_LABELS[detail.entityType]} · submitted {fmtDate(detail.createdAt)}
                </p>
              </div>

              <div className="text-sm space-y-1.5">
                {detail.organisationName && <p className="font-semibold text-gray-800">{detail.organisationName}</p>}
                <p className="text-gray-700">{detail.contactName}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-1 text-[#037F44] hover:underline">
                    <Mail size={12} /> {detail.email}
                  </a>
                  {detail.phone && (
                    <a href={`tel:${detail.phone}`} className="inline-flex items-center gap-1 text-[#037F44] hover:underline">
                      <Phone size={12} /> {detail.phone}
                    </a>
                  )}
                  {detail.website && (
                    <a href={detail.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#037F44] hover:underline">
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
                {detail.location && <p className="text-xs text-gray-500">{detail.location}</p>}
                <p className="text-xs text-gray-500">
                  Account:{" "}
                  {detail.Account ? (
                    <a href={`/dashboard/user/${detail.Account.id}`} className="text-[#037F44] hover:underline">
                      {detail.Account.firstName} {detail.Account.lastName} ({detail.Account.accountType})
                    </a>
                  ) : (
                    "no SwapConnect account yet"
                  )}
                  {detail.type === "GIVE" && detail.accountId ? ` · ${detail.giveListingsCount} device(s) actually listed via Give` : ""}
                </p>
              </div>

              {detailEntries.length > 0 && (
                <div className="bg-[#f7f8fb] rounded-lg p-3 space-y-1.5">
                  {detailEntries.map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <span className="text-gray-500">{DETAIL_FIELD_TITLES[k] ?? k}: </span>
                      <span className="text-gray-800 whitespace-pre-wrap">{renderDetailValue(k, v)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                {detail.AssignedAdmin ? (
                  <>
                    <span className="text-xs text-gray-500">
                      Assigned to {detail.AssignedAdmin.firstName} {detail.AssignedAdmin.lastName}
                    </span>
                    <button onClick={() => assignMe("none")} disabled={saving} className="inline-flex items-center gap-1 text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-60">
                      <UserMinus size={12} /> Unassign
                    </button>
                  </>
                ) : (
                  <button onClick={() => assignMe("me")} disabled={saving} className="inline-flex items-center gap-1 text-xs bg-[#037F44] text-white px-2.5 py-1 rounded-lg disabled:opacity-60">
                    <UserCheck size={12} /> Assign to me
                  </button>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Update status</p>
                <div className="flex gap-2">
                  <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs flex-1">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button onClick={updateStatus} disabled={saving || nextStatus === detail.status} className="text-xs bg-[#037F44] text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
                    Save
                  </button>
                </div>
                <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Reason / internal note (optional)" rows={2} className="w-full border rounded-lg px-3 py-2 text-xs resize-none" />
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Add to the record</p>
                <div className="flex gap-2">
                  <select value={activityKind} onChange={(e) => setActivityKind(e.target.value as typeof activityKind)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
                    <option value="NOTE">Internal note</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="CONTACT">Contact made</option>
                  </select>
                  {activityKind === "CONTACT" && (
                    <select value={contactChannel} onChange={(e) => setContactChannel(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
                      {["EMAIL", "PHONE", "WHATSAPP", "MEETING", "OTHER"].map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0) + c.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <textarea value={activityBody} onChange={(e) => setActivityBody(e.target.value)} placeholder="What happened / what's next" rows={3} className="w-full border rounded-lg px-3 py-2 text-xs resize-none" />
                <button onClick={addActivity} disabled={saving} className="text-xs border border-[#037F44] text-[#037F44] px-3 py-1.5 rounded-lg font-medium hover:bg-[#e6f9f0] disabled:opacity-50">
                  Record
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Activity</p>
                {!detail.Activities?.length ? (
                  <p className="text-xs text-gray-400">No activity yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {detail.Activities.map((a) => (
                      <li key={a.id} className="text-xs border border-gray-100 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                          <span className="font-semibold text-gray-700">
                            {KIND_LABEL[a.kind]}
                            {a.kind === "STATUS_CHANGE" && a.meta ? `: ${STATUS_LABELS[a.meta.from as EnquiryStatus] ?? a.meta.from} → ${STATUS_LABELS[a.meta.to as EnquiryStatus] ?? a.meta.to}` : ""}
                            {a.kind === "CONTACT" && a.meta?.channel ? ` via ${String(a.meta.channel).toLowerCase()}` : ""}
                          </span>
                          <span>{fmtDate(a.createdAt)}</span>
                        </div>
                        {a.body && <p className="text-gray-700 mt-1 whitespace-pre-wrap">{a.body}</p>}
                        {a.Admin && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {a.Admin.firstName} {a.Admin.lastName}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {detail.otherEnquiries && detail.otherEnquiries.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Other enquiries from this contact</p>
                  <ul className="space-y-1">
                    {detail.otherEnquiries.map((o) => (
                      <li key={o.id} className="text-xs text-gray-600">
                        <a href={`/dashboard/contributors?tab=${o.type.toLowerCase()}&id=${o.id}`} className="text-[#037F44] hover:underline tabular-nums">
                          {o.reference}
                        </a>{" "}
                        · {TYPE_LABELS[o.type]} · {STATUS_LABELS[o.status]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
