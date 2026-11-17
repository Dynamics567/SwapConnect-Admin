"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Globe, Mail, Phone, Pencil, Trash2, Building2, ArrowLeft } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useRole } from "@/hooks/useRole";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PartnerForm, { type PartnerFull } from "./PartnerForm";
import PartnerIntegration from "./PartnerIntegration";
import AllPartnersReport from "./AllPartnersReport";
import { downloadAdminCsv } from "./CampaignReportCard";
import { Sheet, Field, INPUT, Pill } from "./Sheet";
import {
  api,
  BTN,
  fmtDate,
  PARTNER_STATUS_LABEL,
  PARTNER_STATUS_STYLE,
  PARTNER_ACTION_UI,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_STYLE,
  CAMPAIGN_TYPE_LABEL,
  INTEGRATION_LABEL,
  MEMBER_ROLE_LABEL,
  ACTIVITY_LABEL,
  type Meta,
  type PartnerStatus,
  type CampaignStatus,
} from "./campaignLabels";

interface PartnerRow extends PartnerFull {
  campaignCount: number;
  memberCount: number;
  createdAt: string;
}
interface Member {
  id: number;
  role: string;
  createdAt: string;
  Account: { id: number; firstName: string; lastName: string; email: string } | null;
}
interface ActivityRow {
  id: number;
  subjectType: "PARTNER" | "CAMPAIGN";
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorType: string;
  note: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  Actor: { firstName: string; lastName: string } | null;
}
interface PartnerDetail extends PartnerFull {
  statusReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  Members: Member[];
  Enquiry: { id: number; reference: string } | null;
  campaigns: { id: number; name: string; type: string; status: CampaignStatus; startAt: string | null; endAt: string | null }[];
  activity: ActivityRow[];
}

function Logo({ url, name, size = 36 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" style={{ width: size, height: size }} className="rounded-lg object-cover border border-gray-100 shrink-0" />
  ) : (
    <span style={{ width: size, height: size }} className="rounded-lg bg-[#eef1f5] text-[#5f6672] flex items-center justify-center text-xs font-bold shrink-0">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function PartnersTab({ meta }: { meta: Meta | null }) {
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canEdit = isAdmin || isSuperAdmin;
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PartnerDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerFull | null>(null);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MANAGER");
  const [removing, setRemoving] = useState<Member | null>(null);

  useEffect(() => {
    const id = Number(searchParams.get("partner"));
    if (id) setSelectedId(id);
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      if (search.trim()) p.set("search", search.trim());
      setRows(await api<PartnerRow[]>(token, `/partners?${p}`));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, status, search]);

  const loadDetail = useCallback(
    async (id: number) => {
      if (!token) return;
      try {
        setDetail(await api<PartnerDetail>(token, `/partners/${id}`));
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

  const refresh = async () => {
    await Promise.all([load(), selectedId ? loadDetail(selectedId) : null]);
  };

  const runStatus = async () => {
    if (!detail || !statusAction) return;
    const ui = PARTNER_ACTION_UI[statusAction];
    if (ui.reason && !reason.trim()) {
      toast.error("Give a reason for this change.");
      return;
    }
    setBusy(true);
    try {
      await api(token, `/partners/${detail.id}/status`, { method: "POST", body: JSON.stringify({ action: statusAction, reason: reason || undefined }) });
      toast.success(`${detail.name}: ${ui.label.toLowerCase()} done`);
      setStatusAction(null);
      setReason("");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addMember = async () => {
    if (!detail) return;
    if (!memberEmail.trim()) {
      toast.error("Enter the email of their SwapConnect account.");
      return;
    }
    setBusy(true);
    try {
      await api(token, `/partners/${detail.id}/members`, { method: "POST", body: JSON.stringify({ email: memberEmail.trim(), role: memberRole }) });
      toast.success("Team member added");
      setMemberEmail("");
      await loadDetail(detail.id);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (m: Member, role: string) => {
    if (!detail) return;
    try {
      await api(token, `/partners/${detail.id}/members/${m.id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      toast.success("Role updated");
      loadDetail(detail.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeMember = async () => {
    if (!detail || !removing) return;
    setBusy(true);
    try {
      await api(token, `/partners/${detail.id}/members/${removing.id}`, { method: "DELETE" });
      toast.success("Removed from the team");
      setRemoving(null);
      await loadDetail(detail.id);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const actions = detail ? Object.entries(PARTNER_ACTION_UI).filter(([, a]) => a.from.includes(detail.status as PartnerStatus)) : [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Partner platforms</h1>
          <p className="text-xs text-gray-500 mt-0.5">External platforms and organisations that run campaigns on SwapConnect.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg ${BTN.primary}`}
          >
            <Plus size={16} /> Register partner
          </button>
        )}
      </div>

      <AllPartnersReport token={token} onOpen={(id) => setSelectedId(id)} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
          <option value="">All statuses</option>
          {(Object.keys(PARTNER_STATUS_LABEL) as PartnerStatus[]).map((s) => (
            <option key={s} value={s}>
              {PARTNER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, identifier or email" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-64 max-w-full bg-white" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6">
        {/* List: hidden on small screens while a partner is open */}
        <div className={`bg-white rounded-xl shadow overflow-hidden ${detail ? "hidden xl:block" : ""}`}>
          {loading ? (
            <p className="text-center py-12 text-sm text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-14 px-6">
              <Building2 size={22} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">{status || search ? "No partners match these filters." : "No partner platforms yet."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setSelectedId(p.id)} className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${selectedId === p.id ? "bg-[#e6f9f0]" : ""}`}>
                    <Logo url={p.logoUrl} name={p.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 truncate">{p.name}</span>
                        <Pill className={PARTNER_STATUS_STYLE[p.status as PartnerStatus]}>{PARTNER_STATUS_LABEL[p.status as PartnerStatus]}</Pill>
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {p.slug} · {p.kind === "ORGANIZATION" ? "Organisation" : "Platform"} · registered {fmtDate(p.createdAt)}
                      </span>
                    </span>
                    <span className="hidden sm:flex flex-col items-end text-xs text-gray-500 tabular-nums shrink-0">
                      <span>
                        {p.campaignCount} campaign{p.campaignCount === 1 ? "" : "s"}
                      </span>
                      <span>
                        {p.memberCount} team member{p.memberCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`bg-white rounded-xl shadow p-5 ${detail ? "" : "hidden xl:block"}`}>
          {!detail ? (
            <div className="text-center py-20 text-gray-400 text-sm">Select a partner to see its details.</div>
          ) : (
            <div className="space-y-5">
              <button onClick={() => setSelectedId(null)} className="xl:hidden inline-flex items-center gap-1 text-xs text-[#037F44] font-medium">
                <ArrowLeft size={14} /> All partners
              </button>
              <div className="flex items-start gap-3">
                <Logo url={detail.logoUrl} name={detail.name} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-gray-800">{detail.name}</h2>
                    <Pill className={PARTNER_STATUS_STYLE[detail.status as PartnerStatus]}>{PARTNER_STATUS_LABEL[detail.status as PartnerStatus]}</Pill>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 break-all">
                    {detail.slug} · {detail.kind === "ORGANIZATION" ? "Organisation" : "Platform"} · registered {fmtDate(detail.createdAt)}
                    {detail.approvedAt ? ` · approved ${fmtDate(detail.approvedAt)}` : ""}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => {
                      setEditing(detail);
                      setFormOpen(true);
                    }}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#037F44] hover:border-[#037F44]"
                    aria-label="Edit partner"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              {detail.statusReason && detail.status !== "ACTIVE" && (
                <p className="text-xs bg-[#fdecec] text-[#8a1c12] rounded-lg px-3 py-2">Reason: {detail.statusReason}</p>
              )}

              {canEdit && actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map(([key, a]) => (
                    <button key={key} onClick={() => setStatusAction(key)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${BTN[a.tone]}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {detail.description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.description}</p>}

              <div className="text-xs space-y-1.5">
                {detail.contactName && <p className="text-gray-800 font-medium">{detail.contactName}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {detail.contactEmail && (
                    <a href={`mailto:${detail.contactEmail}`} className="inline-flex items-center gap-1 text-[#037F44] hover:underline">
                      <Mail size={12} /> {detail.contactEmail}
                    </a>
                  )}
                  {detail.contactPhone && (
                    <a href={`tel:${detail.contactPhone}`} className="inline-flex items-center gap-1 text-[#037F44] hover:underline">
                      <Phone size={12} /> {detail.contactPhone}
                    </a>
                  )}
                  {detail.websiteUrl && (
                    <a href={detail.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#037F44] hover:underline">
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
                {detail.Enquiry && (
                  <p className="text-gray-500">
                    From partnership enquiry{" "}
                    <Link href={`/dashboard/contributors?tab=partner&id=${detail.Enquiry.id}`} className="text-[#037F44] hover:underline tabular-nums">
                      {detail.Enquiry.reference}
                    </Link>
                  </p>
                )}
              </div>

              <div className="bg-[#f7f8fb] rounded-lg p-3 text-xs space-y-1.5">
                <p>
                  <span className="text-gray-500">Approved domains: </span>
                  <span className="text-gray-800">{detail.approvedDomains?.length ? detail.approvedDomains.join(", ") : "none yet"}</span>
                </p>
                <p>
                  <span className="text-gray-500">Integration: </span>
                  <span className="text-gray-800">{(detail.integrationTypes || []).map((t) => INTEGRATION_LABEL[t] || t).join(", ") || "—"}</span>
                </p>
                <p>
                  <span className="text-gray-500">Can draft campaigns: </span>
                  <span className="text-gray-800">{detail.permissions?.canCreateCampaigns === false ? "No" : "Yes"}</span>
                  <span className="text-gray-500"> · Can confirm winners: </span>
                  <span className="text-gray-800">{detail.permissions?.canConfirmWinners ? "Yes" : "No"}</span>
                </p>
                <p>
                  <span className="text-gray-500">Campaign types: </span>
                  <span className="text-gray-800">
                    {detail.permissions?.allowedCampaignTypes?.length ? detail.permissions.allowedCampaignTypes.map((t) => CAMPAIGN_TYPE_LABEL[t] || t).join(", ") : "All types"}
                  </span>
                </p>
              </div>

              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Team</p>
                <p className="text-[11px] text-gray-500 mb-3">SwapConnect accounts that act for this partner. Owners and managers can draft campaigns; viewers can only look.</p>
                {detail.Members.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-3">No one on the team yet.</p>
                ) : (
                  <ul className="space-y-2 mb-3">
                    {detail.Members.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block text-gray-800 font-medium truncate">{m.Account ? `${m.Account.firstName} ${m.Account.lastName}` : "Deleted account"}</span>
                          <span className="block text-gray-500 truncate">{m.Account?.email}</span>
                        </span>
                        {canEdit ? (
                          <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
                            {(meta?.memberRoles || Object.keys(MEMBER_ROLE_LABEL)).map((r) => (
                              <option key={r} value={r}>
                                {MEMBER_ROLE_LABEL[r] || r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-600">{MEMBER_ROLE_LABEL[m.role] || m.role}</span>
                        )}
                        {canEdit && (
                          <button onClick={() => setRemoving(m)} className="p-1.5 text-gray-400 hover:text-[#b42318]" aria-label="Remove from team">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canEdit && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} type="email" placeholder="Email of their SwapConnect account" className={`${INPUT} text-xs flex-1`} />
                    <div className="flex gap-2">
                      <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                        {(meta?.memberRoles || Object.keys(MEMBER_ROLE_LABEL)).map((r) => (
                          <option key={r} value={r}>
                            {MEMBER_ROLE_LABEL[r] || r}
                          </option>
                        ))}
                      </select>
                      <button onClick={addMember} disabled={busy} className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap disabled:opacity-60 ${BTN.primary}`}>
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <PartnerIntegration
                key={`int${detail.id}`}
                token={token}
                partnerId={detail.id}
                approvedDomains={detail.approvedDomains || []}
                apiEnabled={(detail.integrationTypes || []).includes("API")}
                meta={meta}
                canEdit={canEdit}
              />

              <section className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">Campaigns</p>
                  {detail.campaigns.length > 0 && (
                    <button onClick={() => downloadAdminCsv(token, `/partners/${detail.id}/report.csv`, `${detail.slug}-campaign-report.csv`)} className="text-[11px] font-semibold text-[#037F44] hover:underline">
                      Report CSV
                    </button>
                  )}
                </div>
                {detail.campaigns.length === 0 ? (
                  <p className="text-xs text-gray-400">No campaigns yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.campaigns.map((c) => (
                      <li key={c.id}>
                        <Link href={`/dashboard/campaigns?tab=campaigns&id=${c.id}`} className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 hover:bg-gray-50">
                          <span className="flex-1 min-w-0 truncate text-gray-800 font-medium">{c.name}</span>
                          <span className="text-gray-500 hidden sm:inline">{CAMPAIGN_TYPE_LABEL[c.type]}</span>
                          <Pill className={CAMPAIGN_STATUS_STYLE[c.status]}>{CAMPAIGN_STATUS_LABEL[c.status]}</Pill>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Activity</p>
                {detail.activity.length === 0 ? (
                  <p className="text-xs text-gray-400">No activity yet.</p>
                ) : (
                  <ol className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {detail.activity.map((a) => (
                      <li key={a.id} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-700">
                            {a.subjectType === "CAMPAIGN" ? "Campaign: " : ""}
                            {ACTIVITY_LABEL[a.action] || a.action}
                          </span>
                          <span className="text-gray-400 shrink-0">{fmtDate(a.createdAt, true)}</span>
                        </div>
                        {a.note && <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{a.note}</p>}
                        <p className="text-[11px] text-gray-400">
                          {a.Actor ? `${a.Actor.firstName} ${a.Actor.lastName}` : a.actorType === "SYSTEM" ? "System" : ""}
                          {a.actorType === "PARTNER" ? " (partner team)" : ""}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      <PartnerForm
        open={formOpen}
        token={token}
        meta={meta}
        partner={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(id) => {
          setFormOpen(false);
          setSelectedId(id);
          refresh();
          if (id) loadDetail(id);
        }}
      />

      <Sheet
        open={!!statusAction && !!detail}
        title={statusAction ? `${PARTNER_ACTION_UI[statusAction].label}: ${detail?.name}` : ""}
        onClose={() => {
          setStatusAction(null);
          setReason("");
        }}
        footer={
          <>
            <button onClick={() => setStatusAction(null)} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Cancel
            </button>
            <button
              onClick={runStatus}
              disabled={busy}
              className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${statusAction && PARTNER_ACTION_UI[statusAction].tone === "danger" ? "bg-[#b42318] text-white hover:bg-[#912018]" : BTN.primary}`}
            >
              {busy ? "Saving…" : statusAction ? PARTNER_ACTION_UI[statusAction].label : ""}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          {statusAction === "approve" && "The partner's team can then draft campaigns for SwapConnect review."}
          {statusAction === "suspend" && "The team keeps read access but cannot create or change campaigns until reactivated."}
          {statusAction === "deactivate" && "The team loses access to the partner portal. Campaign history is kept."}
          {statusAction === "reactivate" && "The team gets full access back."}
        </p>
        <Field label={statusAction && PARTNER_ACTION_UI[statusAction].reason ? "Reason" : "Note (optional)"} required={!!statusAction && PARTNER_ACTION_UI[statusAction].reason} hint="Shared with the partner's team.">
          <textarea className={`${INPUT} resize-none`} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Sheet>

      <ConfirmDialog
        open={!!removing}
        title="Remove from team?"
        message={removing?.Account ? `${removing.Account.firstName} ${removing.Account.lastName} will lose access to ${detail?.name}'s campaigns.` : "This member will lose access."}
        confirmLabel="Remove"
        variant="danger"
        loading={busy}
        onConfirm={removeMember}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
