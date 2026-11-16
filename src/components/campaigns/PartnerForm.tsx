"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, Field, INPUT, ImagePicker } from "./Sheet";
import { api, BTN, CAMPAIGN_TYPE_LABEL, INTEGRATION_LABEL, type Meta } from "./campaignLabels";

export interface PartnerFull {
  id: number;
  slug: string;
  name: string;
  kind: "PLATFORM" | "ORGANIZATION";
  status: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  approvedDomains: string[];
  integrationTypes: string[];
  permissions: { canCreateCampaigns: boolean; canConfirmWinners: boolean; allowedCampaignTypes: string[] };
}

const EMPTY = {
  name: "",
  slug: "",
  kind: "PLATFORM",
  description: "",
  websiteUrl: "",
  logoUrl: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  approvedDomains: "",
  integrationTypes: ["DIRECT_LINK"] as string[],
  canCreateCampaigns: true,
  canConfirmWinners: false,
  allowedCampaignTypes: [] as string[],
};

export default function PartnerForm({
  open,
  token,
  meta,
  partner,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: string | null;
  meta: Meta | null;
  partner: PartnerFull | null;
  onClose: () => void;
  onSaved: (id: number) => void;
}) {
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(
      partner
        ? {
            name: partner.name,
            slug: partner.slug,
            kind: partner.kind,
            description: partner.description || "",
            websiteUrl: partner.websiteUrl || "",
            logoUrl: partner.logoUrl || "",
            contactName: partner.contactName || "",
            contactEmail: partner.contactEmail || "",
            contactPhone: partner.contactPhone || "",
            approvedDomains: (partner.approvedDomains || []).join(", "),
            integrationTypes: partner.integrationTypes || [],
            canCreateCampaigns: partner.permissions?.canCreateCampaigns !== false,
            canConfirmWinners: !!partner.permissions?.canConfirmWinners,
            allowedCampaignTypes: partner.permissions?.allowedCampaignTypes || [],
          }
        : EMPTY
    );
  }, [open, partner]);

  const set = (k: keyof typeof EMPTY, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "integrationTypes" | "allowedCampaignTypes", v: string) =>
    setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  const save = async () => {
    if (!f.name.trim()) {
      toast.error("Platform name is required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: f.name,
        ...(f.slug.trim() ? { slug: f.slug.trim() } : {}),
        kind: f.kind,
        description: f.description,
        websiteUrl: f.websiteUrl,
        logoUrl: f.logoUrl,
        contactName: f.contactName,
        contactEmail: f.contactEmail,
        contactPhone: f.contactPhone,
        approvedDomains: f.approvedDomains,
        integrationTypes: f.integrationTypes,
        permissions: {
          canCreateCampaigns: f.canCreateCampaigns,
          canConfirmWinners: f.canConfirmWinners,
          allowedCampaignTypes: f.allowedCampaignTypes,
        },
      };
      const out = await api<{ id: number }>(token, partner ? `/partners/${partner.id}` : "/partners", {
        method: partner ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      toast.success(partner ? "Partner saved" : "Partner registered. Approve it when ready.");
      onSaved(out.id ?? partner?.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      title={partner ? `Edit ${partner.name}` : "Register a partner platform"}
      onClose={onClose}
      wide
      footer={
        <>
          <button onClick={onClose} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${BTN.primary}`}>
            {saving ? "Saving…" : partner ? "Save changes" : "Register partner"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Platform name" required>
          <input className={INPUT} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Rently Hub" />
        </Field>
        <Field label="Platform identifier" hint="Used in links and the API. Leave blank to generate it from the name.">
          <input className={INPUT} value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="rently-hub" />
        </Field>
        <Field label="Partner type">
          <select className={INPUT} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="PLATFORM">Platform or app</option>
            <option value="ORGANIZATION">Business or organisation</option>
          </select>
        </Field>
        <Field label="Website">
          <input className={INPUT} value={f.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://rently.ng" />
        </Field>
      </div>
      <ImagePicker token={token} label="Logo" value={f.logoUrl} onChange={(u) => set("logoUrl", u)} />
      <Field label="Description">
        <textarea className={`${INPUT} resize-none`} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <p className="text-xs font-bold text-gray-800 pt-2">Contact</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Name">
          <input className={INPUT} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={INPUT} type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={INPUT} value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </Field>
      </div>

      <p className="text-xs font-bold text-gray-800 pt-2">Integration</p>
      <Field label="Approved domains" hint="Campaign links and embeds are only allowed on these domains and their subdomains. Separate with commas.">
        <input className={INPUT} value={f.approvedDomains} onChange={(e) => set("approvedDomains", e.target.value)} placeholder="rently.ng, app.rently.ng" />
      </Field>
      <div>
        <span className="block text-xs font-semibold text-gray-700 mb-1.5">Integration types</span>
        <div className="flex flex-wrap gap-2">
          {(meta?.integrationTypes || Object.keys(INTEGRATION_LABEL)).map((t) => (
            <label key={t} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${f.integrationTypes.includes(t) ? "border-[#037F44] bg-[#e6f9f0] text-[#037F44]" : "border-gray-200 text-gray-600"}`}>
              <input type="checkbox" className="sr-only" checked={f.integrationTypes.includes(t)} onChange={() => toggle("integrationTypes", t)} />
              {INTEGRATION_LABEL[t] || t}
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs font-bold text-gray-800 pt-2">Campaign permissions</p>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" className="mt-1 accent-[#037F44]" checked={f.canCreateCampaigns} onChange={(e) => set("canCreateCampaigns", e.target.checked)} />
        <span>
          Can draft campaigns
          <span className="block text-[11px] text-gray-500">Drafts still need SwapConnect approval before anything is published.</span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" className="mt-1 accent-[#037F44]" checked={f.canConfirmWinners} onChange={(e) => set("canConfirmWinners", e.target.checked)} />
        <span>
          Can confirm winners
          <span className="block text-[11px] text-gray-500">For campaigns where the partner decides the winner, such as a referral competition.</span>
        </span>
      </label>
      <div>
        <span className="block text-xs font-semibold text-gray-700 mb-1.5">Allowed campaign types</span>
        <p className="text-[11px] text-gray-500 mb-2">None selected means every type is allowed.</p>
        <div className="flex flex-wrap gap-2">
          {(meta?.campaignTypes || Object.keys(CAMPAIGN_TYPE_LABEL)).map((t) => (
            <label key={t} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${f.allowedCampaignTypes.includes(t) ? "border-[#037F44] bg-[#e6f9f0] text-[#037F44]" : "border-gray-200 text-gray-600"}`}>
              <input type="checkbox" className="sr-only" checked={f.allowedCampaignTypes.includes(t)} onChange={() => toggle("allowedCampaignTypes", t)} />
              {CAMPAIGN_TYPE_LABEL[t] || t}
            </label>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
