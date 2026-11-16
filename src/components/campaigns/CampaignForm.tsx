"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, Field, INPUT, ImagePicker } from "./Sheet";
import {
  api,
  BTN,
  toDateInput,
  CAMPAIGN_TYPE_LABEL,
  CAMPAIGN_TYPE_HINT,
  PARTICIPATION_LABEL,
  ALLOCATION_LABEL,
  VISIBILITY_LABEL,
  REQUIRED_FIELD_LABEL,
  type Meta,
  type PartnerBrief,
} from "./campaignLabels";

export interface CampaignFull {
  id: number;
  slug: string;
  ownerType: "SWAPCONNECT" | "PARTNER";
  partnerId: number | null;
  name: string;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  type: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  rulesText: string | null;
  eligibilityText: string | null;
  participationMode: string;
  requiresManualReview: boolean;
  requiredFields: string[];
  allocationMethod: string;
  visibility: string;
  externalUrl: string | null;
}

const blank = (type = "PUBLIC_GIVEAWAY") => ({
  partnerId: "",
  name: "",
  slug: "",
  summary: "",
  description: "",
  imageUrl: "",
  category: "",
  type,
  startAt: "",
  endAt: "",
  rulesText: "",
  eligibilityText: "",
  participationMode: "OPEN",
  requiresManualReview: true,
  requiredFields: [] as string[],
  allocationMethod: "RANDOM",
  visibility: "PUBLIC",
  externalUrl: "",
});

export default function CampaignForm({
  open,
  token,
  meta,
  partners,
  campaign,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: string | null;
  meta: Meta | null;
  partners: PartnerBrief[];
  campaign: CampaignFull | null;
  onClose: () => void;
  onSaved: (id: number) => void;
}) {
  const [f, setF] = useState(blank());
  const [saving, setSaving] = useState(false);
  const published = !!campaign && ["PUBLISHED", "ACTIVE", "COMPLETED"].includes(campaign.status);

  useEffect(() => {
    if (!open) return;
    if (campaign) {
      setF({
        partnerId: campaign.partnerId ? String(campaign.partnerId) : "",
        name: campaign.name,
        slug: campaign.slug,
        summary: campaign.summary || "",
        description: campaign.description || "",
        imageUrl: campaign.imageUrl || "",
        category: campaign.category || "",
        type: campaign.type,
        startAt: toDateInput(campaign.startAt),
        endAt: toDateInput(campaign.endAt),
        rulesText: campaign.rulesText || "",
        eligibilityText: campaign.eligibilityText || "",
        participationMode: campaign.participationMode,
        requiresManualReview: campaign.requiresManualReview,
        requiredFields: campaign.requiredFields || [],
        allocationMethod: campaign.allocationMethod,
        visibility: campaign.visibility,
        externalUrl: campaign.externalUrl || "",
      });
    } else {
      const b = blank();
      const preset = meta?.typePresets?.[b.type];
      setF(preset ? { ...b, ...preset } : b);
    }
  }, [open, campaign, meta]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  // Choosing a type on a new campaign applies its preset; editing keeps the
  // owner's explicit choices.
  const setType = (type: string) => {
    const preset = !campaign ? meta?.typePresets?.[type] : undefined;
    setF((p) => ({ ...p, type, ...(preset || {}) }));
  };
  const toggleField = (k: string) =>
    setF((p) => ({ ...p, requiredFields: p.requiredFields.includes(k) ? p.requiredFields.filter((x) => x !== k) : [...p.requiredFields, k] }));

  const save = async () => {
    if (!f.name.trim()) {
      toast.error("Campaign name is required.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: f.name,
        summary: f.summary,
        description: f.description,
        imageUrl: f.imageUrl,
        category: f.category,
        type: f.type,
        // Dates are whole days: start at the start of the day, end at its close (WAT).
        startAt: f.startAt ? `${f.startAt}T00:00:00+01:00` : null,
        endAt: f.endAt ? `${f.endAt}T23:59:59+01:00` : null,
        rulesText: f.rulesText,
        eligibilityText: f.eligibilityText,
        participationMode: f.participationMode,
        requiresManualReview: f.requiresManualReview,
        requiredFields: f.requiredFields,
        allocationMethod: f.allocationMethod,
        visibility: f.visibility,
        externalUrl: f.externalUrl,
      };
      if (f.slug.trim() && (!campaign || f.slug.trim() !== campaign.slug)) body.slug = f.slug.trim();
      if (!campaign && f.partnerId) body.partnerId = Number(f.partnerId);
      const out = await api<{ id: number }>(token, campaign ? `/campaigns/${campaign.id}` : "/campaigns", {
        method: campaign ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      toast.success(campaign ? "Campaign saved" : "Campaign created as a draft");
      onSaved(out?.id ?? campaign!.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const selectablePartners = partners.filter((p) => p.status !== "DEACTIVATED");

  return (
    <Sheet
      open={open}
      title={campaign ? `Edit ${campaign.name}` : "New campaign"}
      onClose={onClose}
      wide
      footer={
        <>
          <button onClick={onClose} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${BTN.primary}`}>
            {saving ? "Saving…" : campaign ? "Save changes" : "Create draft"}
          </button>
        </>
      }
    >
      {!campaign && (
        <Field label="Owner" hint="Who runs this campaign. A partner campaign shows the partner's name and branding, with SwapConnect as the platform behind it.">
          <select className={INPUT} value={f.partnerId} onChange={(e) => set("partnerId", e.target.value)}>
            <option value="">SwapConnect</option>
            {selectablePartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.status !== "ACTIVE" ? ` (${p.status.toLowerCase().replace("_", " ")})` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Campaign name" required>
          <input className={INPUT} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Rently Refer & Win" />
        </Field>
        <Field
          label="Link name"
          hint={published ? "Fixed once published, since the link may already be shared." : `swapconnect.africa/campaigns/${f.slug || "…"}. Blank = from the name.`}
        >
          <input className={INPUT} value={f.slug} disabled={published} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="rently-refer-win" />
        </Field>
      </div>

      <Field label="Campaign type" hint={CAMPAIGN_TYPE_HINT[f.type]}>
        <select className={INPUT} value={f.type} onChange={(e) => setType(e.target.value)}>
          {(meta?.campaignTypes || Object.keys(CAMPAIGN_TYPE_LABEL)).map((t) => (
            <option key={t} value={t}>
              {CAMPAIGN_TYPE_LABEL[t] || t}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Summary" hint="One or two lines shown on campaign cards. Up to 280 characters.">
        <input className={INPUT} maxLength={280} value={f.summary} onChange={(e) => set("summary", e.target.value)} />
      </Field>
      <Field label="Description">
        <textarea className={`${INPUT} resize-y`} rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <ImagePicker token={token} label="Campaign image" value={f.imageUrl} onChange={(u) => set("imageUrl", u)} />
        <Field label="Category">
          <input className={INPUT} value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="Electronics" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts">
          <input type="date" className={INPUT} value={f.startAt} onChange={(e) => set("startAt", e.target.value)} />
        </Field>
        <Field label="Ends">
          <input type="date" className={INPUT} value={f.endAt} min={f.startAt || undefined} onChange={(e) => set("endAt", e.target.value)} />
        </Field>
      </div>

      <p className="text-xs font-bold text-gray-800 pt-2">Rules and eligibility</p>
      <Field label="Rules" hint="Shown publicly. Required before review.">
        <textarea className={`${INPUT} resize-y`} rows={4} value={f.rulesText} onChange={(e) => set("rulesText", e.target.value)} />
      </Field>
      <Field label="Who is eligible">
        <textarea className={`${INPUT} resize-y`} rows={3} value={f.eligibilityText} onChange={(e) => set("eligibilityText", e.target.value)} />
      </Field>

      <p className="text-xs font-bold text-gray-800 pt-2">Participation and winners</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Who can take part">
          <select className={INPUT} value={f.participationMode} onChange={(e) => set("participationMode", e.target.value)}>
            {(meta?.participationModes || Object.keys(PARTICIPATION_LABEL)).map((m) => (
              <option key={m} value={m}>
                {PARTICIPATION_LABEL[m] || m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How winners are chosen">
          <select className={INPUT} value={f.allocationMethod} onChange={(e) => set("allocationMethod", e.target.value)}>
            {(meta?.allocationMethods || Object.keys(ALLOCATION_LABEL)).map((m) => (
              <option key={m} value={m}>
                {ALLOCATION_LABEL[m] || m}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {f.participationMode === "EXTERNAL" && (
        <Field label="Link to the partner's campaign page" hint="Must be on one of the partner's approved domains." required>
          <input className={INPUT} value={f.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://rently.ng/refer-and-win" />
        </Field>
      )}
      {f.participationMode !== "EXTERNAL" && (
        <>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-1 accent-[#037F44]" checked={f.requiresManualReview} onChange={(e) => set("requiresManualReview", e.target.checked)} />
            <span>
              Review every request by hand
              <span className="block text-[11px] text-gray-500">A request is never treated as a win until it is allocated.</span>
            </span>
          </label>
          <div>
            <span className="block text-xs font-semibold text-gray-700 mb-1.5">Ask participants for</span>
            <div className="flex flex-wrap gap-2">
              {(meta?.requiredFieldKeys || Object.keys(REQUIRED_FIELD_LABEL)).map((k) => (
                <label key={k} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${f.requiredFields.includes(k) ? "border-[#037F44] bg-[#e6f9f0] text-[#037F44]" : "border-gray-200 text-gray-600"}`}>
                  <input type="checkbox" className="sr-only" checked={f.requiredFields.includes(k)} onChange={() => toggleField(k)} />
                  {REQUIRED_FIELD_LABEL[k] || k}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <Field label="Visibility">
        <select className={INPUT} value={f.visibility} onChange={(e) => set("visibility", e.target.value)}>
          {(meta?.visibilities || Object.keys(VISIBILITY_LABEL)).map((v) => (
            <option key={v} value={v}>
              {VISIBILITY_LABEL[v] || v}
            </option>
          ))}
        </select>
      </Field>
    </Sheet>
  );
}
