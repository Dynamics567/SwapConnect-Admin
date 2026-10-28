"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Copy } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import SidePanel from "@/components/finance/SidePanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useAuthContext } from "@/context/AuthContext";
import { API_URL } from "@/lib/config";
import { fmtNaira, fmtDate, statusBadgeClass } from "@/lib/financeFormat";

type QualifyingAction = "registration" | "first_product_published" | "first_purchase" | "first_sale";
type ReferredUserType = "ANY" | "BUYER" | "STORE_OWNER";
type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";

interface CampaignStage {
  id?: number;
  name: string;
  qualifyingAction: QualifyingAction;
  rewardAmount: number;
  completionWindowDays: number | null;
  requiresManualReview: boolean | null;
  active?: boolean;
}

interface Campaign {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: CampaignStatus;
  referredUserType: ReferredUserType;
  qualifyingAction: QualifyingAction;
  rewardAmount: number;
  currency: string;
  completionWindowDays: number | null;
  maxRewardsPerReferrer: number | null;
  maxRewardsTotal: number | null;
  totalBudgetAmount: number | null;
  requiresManualReview: boolean;
  startAt: string | null;
  endAt: string | null;
  termsText: string | null;
  referralCount: number;
  rewardCount: number;
  budgetConsumed: number;
  updatedAt: string;
  Stages?: CampaignStage[];
}

const ACTION_LABELS: Record<QualifyingAction, string> = {
  registration: "Successful registration (verified)",
  first_product_published: "First eligible product published",
  first_purchase: "First successful purchase",
  first_sale: "First successful sale",
};

const STATUSES: CampaignStatus[] = ["draft", "scheduled", "active", "paused", "completed", "archived"];

interface StageFormState {
  id?: number;
  name: string;
  qualifyingAction: QualifyingAction;
  rewardAmount: string;
  completionWindowDays: string;
}

interface FormState {
  name: string;
  description: string;
  referredUserType: ReferredUserType;
  qualifyingAction: QualifyingAction;
  rewardAmount: string;
  completionWindowDays: string;
  maxRewardsPerReferrer: string;
  maxRewardsTotal: string;
  totalBudgetAmount: string;
  requiresManualReview: boolean;
  startAt: string;
  endAt: string;
  termsText: string;
  stages: StageFormState[];
}

const EMPTY_STAGE: StageFormState = { name: "", qualifyingAction: "first_sale", rewardAmount: "", completionWindowDays: "" };

const EMPTY_FORM: FormState = {
  name: "", description: "", referredUserType: "ANY", qualifyingAction: "first_purchase",
  rewardAmount: "", completionWindowDays: "", maxRewardsPerReferrer: "", maxRewardsTotal: "",
  totalBudgetAmount: "", requiresManualReview: false, startAt: "", endAt: "", termsText: "", stages: [],
};

// Campaign.startAt/endAt come back from the API as full ISO timestamps;
// an <input type="date"> needs just the yyyy-mm-dd portion.
function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function toForm(c: Campaign): FormState {
  return {
    name: c.name,
    description: c.description || "",
    referredUserType: c.referredUserType,
    qualifyingAction: c.qualifyingAction,
    rewardAmount: String(c.rewardAmount),
    completionWindowDays: c.completionWindowDays != null ? String(c.completionWindowDays) : "",
    maxRewardsPerReferrer: c.maxRewardsPerReferrer != null ? String(c.maxRewardsPerReferrer) : "",
    maxRewardsTotal: c.maxRewardsTotal != null ? String(c.maxRewardsTotal) : "",
    totalBudgetAmount: c.totalBudgetAmount != null ? String(c.totalBudgetAmount) : "",
    requiresManualReview: c.requiresManualReview,
    startAt: toDateInputValue(c.startAt),
    endAt: toDateInputValue(c.endAt),
    termsText: c.termsText || "",
    stages: (c.Stages || []).map((s) => ({
      id: s.id, name: s.name, qualifyingAction: s.qualifyingAction,
      rewardAmount: String(s.rewardAmount),
      completionWindowDays: s.completionWindowDays != null ? String(s.completionWindowDays) : "",
    })),
  };
}

const inputClass = "w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-emerald";
const labelClass = "text-xs font-medium text-[#6b7280] block mb-1";

function ReferralCampaignsContent() {
  const token = useAuthToken();
  const { role } = useAuthContext();
  const canEdit = role === "superadmin";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [statusConfirm, setStatusConfirm] = useState<{ campaign: Campaign; newStatus: CampaignStatus } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load campaigns");
      setCampaigns(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const buildPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    referredUserType: form.referredUserType,
    qualifyingAction: form.qualifyingAction,
    rewardAmount: Number(form.rewardAmount),
    completionWindowDays: form.completionWindowDays ? parseInt(form.completionWindowDays, 10) : null,
    maxRewardsPerReferrer: form.maxRewardsPerReferrer ? parseInt(form.maxRewardsPerReferrer, 10) : null,
    maxRewardsTotal: form.maxRewardsTotal ? parseInt(form.maxRewardsTotal, 10) : null,
    totalBudgetAmount: form.totalBudgetAmount ? Number(form.totalBudgetAmount) : null,
    requiresManualReview: form.requiresManualReview,
    startAt: form.startAt ? `${form.startAt}T00:00:00` : null,
    endAt: form.endAt ? `${form.endAt}T23:59:59` : null,
    termsText: form.termsText.trim() || null,
    stages: form.stages
      .filter((s) => s.name.trim() && s.rewardAmount)
      .map((s) => ({
        id: s.id,
        name: s.name.trim(),
        qualifyingAction: s.qualifyingAction,
        rewardAmount: Number(s.rewardAmount),
        completionWindowDays: s.completionWindowDays ? parseInt(s.completionWindowDays, 10) : null,
      })),
  });

  const handleCreate = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create campaign");
      setCreating(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editing) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/campaigns/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update campaign");
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!token || !statusConfirm) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/campaigns/${statusConfirm.campaign.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusConfirm.newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to change campaign status");
      setStatusConfirm(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (c: Campaign) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/campaigns/${c.id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to duplicate campaign");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const renderForm = (onSave: () => void) => (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Campaign name</label>
        <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Refer a Store Owner" />
      </div>
      <div>
        <label className={labelClass}>Description (internal)</label>
        <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Eligible referred user type</label>
          <select className={inputClass} value={form.referredUserType} onChange={(e) => setForm({ ...form, referredUserType: e.target.value as ReferredUserType })}>
            <option value="ANY">Any</option>
            <option value="BUYER">Customer (Buyer)</option>
            <option value="STORE_OWNER">Store Owner</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Qualifying action</label>
          <select className={inputClass} value={form.qualifyingAction} onChange={(e) => setForm({ ...form, qualifyingAction: e.target.value as QualifyingAction })}>
            {(Object.entries(ACTION_LABELS) as [QualifyingAction, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Reward amount (₦)</label>
          <input type="number" min="1" className={inputClass} value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Completion window (days, optional)</label>
          <input type="number" min="1" className={inputClass} value={form.completionWindowDays} onChange={(e) => setForm({ ...form, completionWindowDays: e.target.value })} placeholder="No deadline" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Max per referrer</label>
          <input type="number" min="1" className={inputClass} value={form.maxRewardsPerReferrer} onChange={(e) => setForm({ ...form, maxRewardsPerReferrer: e.target.value })} placeholder="No limit" />
        </div>
        <div>
          <label className={labelClass}>Max total rewards</label>
          <input type="number" min="1" className={inputClass} value={form.maxRewardsTotal} onChange={(e) => setForm({ ...form, maxRewardsTotal: e.target.value })} placeholder="No limit" />
        </div>
        <div>
          <label className={labelClass}>Budget cap (₦)</label>
          <input type="number" min="0" className={inputClass} value={form.totalBudgetAmount} onChange={(e) => setForm({ ...form, totalBudgetAmount: e.target.value })} placeholder="No cap" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#353535]">
        <input type="checkbox" checked={form.requiresManualReview} onChange={(e) => setForm({ ...form, requiresManualReview: e.target.checked })} />
        Require manual review before a reward is credited
      </label>
      <div>
        <label className={labelClass}>Program duration (optional)</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            className={inputClass}
            value={form.startAt}
            max={form.endAt || undefined}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
          <input
            type="date"
            className={inputClass}
            value={form.endAt}
            min={form.startAt || undefined}
            onChange={(e) => setForm({ ...form, endAt: e.target.value })}
          />
        </div>
        <p className="text-xs text-[#9ca3af] mt-1">
          Leave either blank for no limit. Outside this window the campaign cannot attribute new referrals or qualify rewards, even while its status is "active".
        </p>
      </div>
      <div className="border-t border-[#e5e7eb] pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>
            Additional reward stages (optional)
          </label>
          <button
            type="button"
            onClick={() => setForm({ ...form, stages: [...form.stages, { ...EMPTY_STAGE }] })}
            className="text-xs text-brand-emerald hover:underline"
          >
            + Add stage
          </button>
        </div>
        <p className="text-xs text-[#9ca3af] mb-3">
          The qualifying action/reward above is always "Stage 1". Each stage below only unlocks once the one before it (Stage 1, then stage 2, etc.) has already been earned -- e.g. Stage 2: first sale, after Stage 1: first product published.
        </p>
        {form.stages.length === 0 && <p className="text-xs text-[#9ca3af] italic">No additional stages -- this is a single-stage campaign.</p>}
        {form.stages.map((stage, i) => (
          <div key={i} className="border border-[#e5e7eb] rounded-lg p-3 mb-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Stage {i + 2}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, stages: form.stages.filter((_, j) => j !== i) })}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <input
              className={inputClass}
              placeholder="Stage name (e.g. First Sale)"
              value={stage.name}
              onChange={(e) => setForm({ ...form, stages: form.stages.map((s, j) => j === i ? { ...s, name: e.target.value } : s) })}
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                className={inputClass}
                value={stage.qualifyingAction}
                onChange={(e) => setForm({ ...form, stages: form.stages.map((s, j) => j === i ? { ...s, qualifyingAction: e.target.value as QualifyingAction } : s) })}
              >
                {(Object.entries(ACTION_LABELS) as [QualifyingAction, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="number" min="1" className={inputClass} placeholder="Reward (₦)"
                value={stage.rewardAmount}
                onChange={(e) => setForm({ ...form, stages: form.stages.map((s, j) => j === i ? { ...s, rewardAmount: e.target.value } : s) })}
              />
              <input
                type="number" min="1" className={inputClass} placeholder="Window (days)"
                value={stage.completionWindowDays}
                onChange={(e) => setForm({ ...form, stages: form.stages.map((s, j) => j === i ? { ...s, completionWindowDays: e.target.value } : s) })}
              />
            </div>
          </div>
        ))}
      </div>
      <div>
        <label className={labelClass}>Terms &amp; conditions (shown to users)</label>
        <textarea className={inputClass} rows={4} value={form.termsText} onChange={(e) => setForm({ ...form, termsText: e.target.value })} />
      </div>
      <button
        onClick={onSave}
        disabled={saving || !form.name.trim() || !form.rewardAmount}
        className="bg-brand-emerald hover:bg-brand-emerald-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save campaign"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-0 w-full min-w-0">
      <ReferralTabs />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#353535]">Campaigns</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Reward amounts, qualifying actions and limits are all configured here -- nothing is hardcoded.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => { setForm(EMPTY_FORM); setCreating(true); }}
              className="flex items-center gap-1.5 bg-brand-emerald hover:bg-brand-emerald-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} /> New campaign
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Qualifying action</th>
                <th className="py-3 px-4 text-right">Reward</th>
                <th className="py-3 px-4 text-right">Referrals</th>
                <th className="py-3 px-4 text-right">Rewards paid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="py-8 text-center text-[#9ca3af]">Loading…</td></tr>}
              {!loading && campaigns.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[#9ca3af]">No campaigns yet.</td></tr>}
              {!loading && campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f9fb]">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#353535]">{c.name}</p>
                    <p className="text-xs text-[#9ca3af]">{c.referredUserType === "ANY" ? "Any referred user" : c.referredUserType === "BUYER" ? "Customers" : "Store owners"}</p>
                    {(c.startAt || c.endAt) && (
                      <p className="text-[11px] text-[#9ca3af] mt-0.5">
                        {c.startAt ? fmtDate(c.startAt) : "No start"} – {c.endAt ? fmtDate(c.endAt) : "No end"}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#6b7280]">
                    {ACTION_LABELS[c.qualifyingAction]}
                    {!!c.Stages?.length && (
                      <span className="block text-[11px] text-brand-emerald mt-0.5">+{c.Stages.length} more stage{c.Stages.length > 1 ? "s" : ""}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#353535]">{fmtNaira(c.rewardAmount)}</td>
                  <td className="py-3 px-4 text-right text-[#6b7280]">{c.referralCount}</td>
                  <td className="py-3 px-4 text-right text-[#6b7280]">{c.rewardCount} ({fmtNaira(c.budgetConsumed)})</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(c.status === "active" ? "success" : c.status === "paused" ? "pending" : "")}`}>{c.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {canEdit ? (
                      <div className="flex items-center gap-2 text-xs">
                        <button onClick={() => { setForm(toForm(c)); setEditing(c); }} className="text-brand-emerald hover:underline">Edit</button>
                        {c.status === "active" ? (
                          <button onClick={() => setStatusConfirm({ campaign: c, newStatus: "paused" })} className="text-brand-gold-hover hover:underline">Pause</button>
                        ) : c.status !== "archived" ? (
                          <button onClick={() => setStatusConfirm({ campaign: c, newStatus: "active" })} className="text-brand-emerald hover:underline">Activate</button>
                        ) : null}
                        {c.status !== "archived" && (
                          <button onClick={() => setStatusConfirm({ campaign: c, newStatus: "archived" })} className="text-red-600 hover:underline">Archive</button>
                        )}
                        <button onClick={() => handleDuplicate(c)} className="text-[#6b7280] hover:underline flex items-center gap-1"><Copy size={12} /> Duplicate</button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#9ca3af]">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel open={creating} title="New campaign" onClose={() => setCreating(false)}>
        {renderForm(handleCreate)}
      </SidePanel>

      <SidePanel open={!!editing} title={`Edit — ${editing?.name || ""}`} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <p className="text-xs text-[#9ca3af] mb-4">
              Last updated {fmtDate(editing.updatedAt)}. Changing terms bumps the terms version -- existing referrals keep the version in effect when they joined.
            </p>
            {renderForm(handleUpdate)}
          </>
        )}
      </SidePanel>

      <ConfirmDialog
        open={!!statusConfirm}
        title={`${statusConfirm?.newStatus === "active" ? "Activate" : statusConfirm?.newStatus === "paused" ? "Pause" : "Archive"} "${statusConfirm?.campaign.name}"?`}
        message={
          statusConfirm?.newStatus === "archived"
            ? "Archiving stops new referrals from attributing to this campaign. Existing referrals and rewards are kept -- nothing is deleted."
            : "This changes which campaign new referrals attribute to immediately."
        }
        confirmLabel="Confirm"
        variant={statusConfirm?.newStatus === "archived" ? "danger" : "warning"}
        loading={saving}
        onConfirm={handleStatusChange}
        onClose={() => setStatusConfirm(null)}
      />
    </div>
  );
}

export default function ReferralCampaignsPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <ReferralCampaignsContent />
    </ProtectedRoute>
  );
}
