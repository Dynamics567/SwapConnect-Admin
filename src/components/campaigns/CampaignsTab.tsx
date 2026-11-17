"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, ArrowLeft, ExternalLink, Megaphone, CalendarDays } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useRole } from "@/hooks/useRole";
import CampaignForm, { type CampaignFull } from "./CampaignForm";
import CampaignPrizesEntries from "./CampaignPrizesEntries";
import { Sheet, Field, INPUT, Pill } from "./Sheet";
import {
  api,
  BTN,
  fmtDate,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_STYLE,
  CAMPAIGN_TYPE_LABEL,
  CAMPAIGN_ACTION_UI,
  PARTICIPATION_LABEL,
  ALLOCATION_LABEL,
  VISIBILITY_LABEL,
  REQUIRED_FIELD_LABEL,
  ACTIVITY_LABEL,
  type Meta,
  type PartnerBrief,
  type CampaignStatus,
} from "./campaignLabels";

interface CampaignRow {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  imageUrl: string | null;
  ownerType: "SWAPCONNECT" | "PARTNER";
  type: string;
  status: CampaignStatus;
  startAt: string | null;
  endAt: string | null;
  updatedAt: string;
  Partner: PartnerBrief | null;
}
interface CampaignDetail extends CampaignFull {
  status: CampaignStatus;
  suspendedFromStatus: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  Partner: (PartnerBrief & { approvedDomains: string[] }) | null;
  activity: {
    id: number;
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    actorType: string;
    note: string | null;
    meta: { fields?: string[] } | null;
    createdAt: string;
    Actor: { firstName: string; lastName: string } | null;
  }[];
}

const ACTION_ORDER = ["approve", "request_changes", "submit", "publish", "activate", "complete", "resume", "suspend", "cancel", "archive"];

function owner(c: { ownerType: string; Partner: PartnerBrief | null }) {
  return c.ownerType === "PARTNER" ? c.Partner?.name || "Partner" : "SwapConnect";
}

function dateRange(a: string | null, b: string | null) {
  if (!a && !b) return "Dates not set";
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

export default function CampaignsTab({ meta }: { meta: Meta | null }) {
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canEdit = isAdmin || isSuperAdmin;
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [partners, setPartners] = useState<PartnerBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignFull | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = Number(searchParams.get("id"));
    if (id) setSelectedId(id);
    const s = searchParams.get("status");
    if (s) setStatus(s);
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    api<PartnerBrief[]>(token, "/partners")
      .then((p) => setPartners(p))
      .catch(() => {});
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      if (type) p.set("type", type);
      if (partnerId === "swapconnect") p.set("ownerType", "SWAPCONNECT");
      else if (partnerId) p.set("partnerId", partnerId);
      if (search.trim()) p.set("search", search.trim());
      setRows(await api<CampaignRow[]>(token, `/campaigns?${p}`));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, status, type, partnerId, search]);

  const loadDetail = useCallback(
    async (id: number) => {
      if (!token) return;
      try {
        setDetail(await api<CampaignDetail>(token, `/campaigns/${id}`));
      } catch (e) {
        toast.error((e as Error).message);
        setSelectedId(null);
      }
    },
    [token]
  );

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);
  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "PENDING_REVIEW").length, [rows]);

  // Admin-side actions available from the current status.
  const actions = useMemo(() => {
    if (!detail || !meta) return [];
    return ACTION_ORDER.filter((a) => {
      const rule = meta.campaignActions[a];
      return rule && rule.by.includes("admin") && rule.from.includes(detail.status);
    });
  }, [detail, meta]);

  const needsNote = (a: string | null) =>
    !!a && (meta?.campaignActions[a]?.noteRequired || (a === "cancel" && detail && !["DRAFT", "PENDING_REVIEW"].includes(detail.status)));

  const runAction = async () => {
    if (!detail || !action) return;
    if (needsNote(action) && !note.trim()) {
      toast.error("Add a note explaining this change.");
      return;
    }
    setBusy(true);
    try {
      await api(token, `/campaigns/${detail.id}/transition`, { method: "POST", body: JSON.stringify({ action, note: note || undefined }) });
      toast.success(`${detail.name}: ${CAMPAIGN_ACTION_UI[action].label.toLowerCase()} done`);
      setAction(null);
      setNote("");
      await Promise.all([load(), loadDetail(detail.id)]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const editable = detail && canEdit && ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "ACTIVE", "SUSPENDED"].includes(detail.status);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Campaigns</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Campaigns run by SwapConnect and its partners.
            {pendingCount > 0 && (
              <button onClick={() => setStatus("PENDING_REVIEW")} className="ml-1 font-semibold text-[#9a6b0f] hover:underline">
                {pendingCount} waiting for review
              </button>
            )}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg ${BTN.primary}`}
          >
            <Plus size={16} /> New campaign
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
          <option value="">All statuses</option>
          {(Object.keys(CAMPAIGN_STATUS_LABEL) as CampaignStatus[]).map((s) => (
            <option key={s} value={s}>
              {CAMPAIGN_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
          <option value="">All owners</option>
          <option value="swapconnect">SwapConnect</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
          <option value="">All types</option>
          {Object.entries(CAMPAIGN_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or link" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-56 max-w-full bg-white" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-6">
        <div className={`bg-white rounded-xl shadow overflow-hidden ${detail ? "hidden xl:block" : ""}`}>
          {loading ? (
            <p className="text-center py-12 text-sm text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-14 px-6">
              <Megaphone size={22} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">{status || type || partnerId || search ? "No campaigns match these filters." : "No campaigns yet."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelectedId(c.id)} className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${selectedId === c.id ? "bg-[#e6f9f0]" : ""}`}>
                    <span className="h-11 w-11 rounded-lg bg-[#eef1f5] overflow-hidden shrink-0 flex items-center justify-center">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Megaphone size={16} className="text-gray-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 truncate">{c.name}</span>
                        <Pill className={CAMPAIGN_STATUS_STYLE[c.status]}>{CAMPAIGN_STATUS_LABEL[c.status]}</Pill>
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {owner(c)} · {CAMPAIGN_TYPE_LABEL[c.type] || c.type}
                      </span>
                    </span>
                    <span className="hidden md:block text-xs text-gray-500 tabular-nums shrink-0 text-right">{dateRange(c.startAt, c.endAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`bg-white rounded-xl shadow p-5 ${detail ? "" : "hidden xl:block"}`}>
          {!detail ? (
            <div className="text-center py-20 text-gray-400 text-sm">Select a campaign to review it.</div>
          ) : (
            <div className="space-y-5">
              <button onClick={() => setSelectedId(null)} className="xl:hidden inline-flex items-center gap-1 text-xs text-[#037F44] font-medium">
                <ArrowLeft size={14} /> All campaigns
              </button>

              {detail.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.imageUrl} alt="" className="w-full aspect-[16/7] object-cover rounded-lg border border-gray-100" />
              )}

              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-gray-800">{detail.name}</h2>
                    <Pill className={CAMPAIGN_STATUS_STYLE[detail.status]}>{CAMPAIGN_STATUS_LABEL[detail.status]}</Pill>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {owner(detail)} · {CAMPAIGN_TYPE_LABEL[detail.type]} · /campaigns/{detail.slug}
                  </p>
                </div>
                {editable && (
                  <button
                    onClick={() => {
                      setEditing(detail);
                      setFormOpen(true);
                    }}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#037F44] hover:border-[#037F44]"
                    aria-label="Edit campaign"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              {detail.status === "PENDING_REVIEW" && (
                <p className="text-xs bg-[#fef6e4] text-[#7a560c] rounded-lg px-3 py-2">
                  {detail.ownerType === "PARTNER" ? `${owner(detail)} submitted this for review.` : "Waiting for review."} Check the rules, dates and partner link, then approve or send it back.
                </p>
              )}
              {detail.status === "SUSPENDED" && detail.suspendedFromStatus && (
                <p className="text-xs bg-[#fdecec] text-[#8a1c12] rounded-lg px-3 py-2">
                  Suspended while {CAMPAIGN_STATUS_LABEL[detail.suspendedFromStatus as CampaignStatus]?.toLowerCase()}. Resuming returns it there.
                </p>
              )}
              {detail.reviewNote && ["DRAFT", "CANCELLED"].includes(detail.status) && (
                <p className="text-xs bg-[#f7f8fb] text-gray-700 rounded-lg px-3 py-2">Last review note: {detail.reviewNote}</p>
              )}

              {canEdit && actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <button key={a} onClick={() => setAction(a)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${BTN[CAMPAIGN_ACTION_UI[a].tone]}`}>
                      {CAMPAIGN_ACTION_UI[a].label}
                    </button>
                  ))}
                </div>
              )}

              {detail.summary && <p className="text-sm text-gray-800 font-medium">{detail.summary}</p>}
              {detail.description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.description}</p>}

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs bg-[#f7f8fb] rounded-lg p-3">
                <div>
                  <dt className="text-gray-500">Runs</dt>
                  <dd className="text-gray-800 inline-flex items-center gap-1">
                    <CalendarDays size={12} /> {dateRange(detail.startAt, detail.endAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Visibility</dt>
                  <dd className="text-gray-800">{VISIBILITY_LABEL[detail.visibility]?.split(",")[0]}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Who can take part</dt>
                  <dd className="text-gray-800">{PARTICIPATION_LABEL[detail.participationMode]}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">How winners are chosen</dt>
                  <dd className="text-gray-800">{ALLOCATION_LABEL[detail.allocationMethod]}</dd>
                </div>
                {detail.participationMode !== "EXTERNAL" && (
                  <>
                    <div>
                      <dt className="text-gray-500">Requests reviewed by hand</dt>
                      <dd className="text-gray-800">{detail.requiresManualReview ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Asks participants for</dt>
                      <dd className="text-gray-800">{detail.requiredFields?.length ? detail.requiredFields.map((k) => REQUIRED_FIELD_LABEL[k] || k).join(", ") : "Account details only"}</dd>
                    </div>
                  </>
                )}
                {detail.externalUrl && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Partner campaign page</dt>
                    <dd>
                      <a href={detail.externalUrl} target="_blank" rel="noopener noreferrer" className="text-[#037F44] hover:underline inline-flex items-center gap-1 break-all">
                        {detail.externalUrl} <ExternalLink size={11} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {(detail.rulesText || detail.eligibilityText) && (
                <div className="space-y-3">
                  {detail.rulesText && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Rules</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{detail.rulesText}</p>
                    </div>
                  )}
                  {detail.eligibilityText && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Who is eligible</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{detail.eligibilityText}</p>
                    </div>
                  )}
                </div>
              )}

              <CampaignPrizesEntries
                key={detail.id}
                token={token}
                campaignId={detail.id}
                campaignStatus={detail.status}
                participationMode={detail.participationMode}
                canEdit={canEdit}
              />

              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">History</p>
                <ol className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {detail.activity.map((a) => (
                    <li key={a.id} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-gray-700">
                          {ACTIVITY_LABEL[a.action] || a.action}
                          {a.toStatus && a.fromStatus ? ` (${CAMPAIGN_STATUS_LABEL[a.fromStatus as CampaignStatus]} → ${CAMPAIGN_STATUS_LABEL[a.toStatus as CampaignStatus]})` : ""}
                        </span>
                        <span className="text-gray-400 shrink-0">{fmtDate(a.createdAt, true)}</span>
                      </div>
                      {a.meta?.fields?.length ? <p className="text-gray-500">Changed: {a.meta.fields.join(", ")}</p> : null}
                      {a.note && <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{a.note}</p>}
                      <p className="text-[11px] text-gray-400">
                        {a.Actor ? `${a.Actor.firstName} ${a.Actor.lastName}` : a.actorType === "SYSTEM" ? "System" : ""}
                        {a.actorType === "PARTNER" ? " (partner team)" : a.actorType === "ADMIN" ? " (SwapConnect)" : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </div>
      </div>

      <CampaignForm
        open={formOpen}
        token={token}
        meta={meta}
        partners={partners}
        campaign={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(id) => {
          setFormOpen(false);
          setSelectedId(id);
          load();
          loadDetail(id);
        }}
      />

      <Sheet
        open={!!action && !!detail}
        title={action ? `${CAMPAIGN_ACTION_UI[action].label}: ${detail?.name}` : ""}
        onClose={() => {
          setAction(null);
          setNote("");
        }}
        footer={
          <>
            <button onClick={() => setAction(null)} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Back
            </button>
            <button
              onClick={runAction}
              disabled={busy}
              className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${action && CAMPAIGN_ACTION_UI[action].tone === "danger" ? "bg-[#b42318] text-white hover:bg-[#912018]" : BTN.primary}`}
            >
              {busy ? "Saving…" : action ? CAMPAIGN_ACTION_UI[action].label : ""}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">{action ? CAMPAIGN_ACTION_UI[action].confirm : ""}</p>
        <Field
          label={needsNote(action) ? "Note" : "Note (optional)"}
          required={!!needsNote(action)}
          hint={detail?.ownerType === "PARTNER" ? "The partner's team sees this note." : undefined}
        >
          <textarea className={`${INPUT} resize-none`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Sheet>
    </div>
  );
}
