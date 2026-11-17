import { API_URL } from "@/lib/config";

// Labels and status styles for the Cross-Platform Campaign Integration
// screens. Enum values mirror backend src/services/campaignRules.js.

export type PartnerStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type CampaignStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED"
  | "SUSPENDED"
  | "CANCELLED";

export const PARTNER_STATUS_LABEL: Record<PartnerStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DEACTIVATED: "Deactivated",
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

// Pill styles: green = live, amber = needs someone, red = stopped, grey = closed.
const TONE = {
  live: "bg-[#e6f9f0] text-[#037F44]",
  wait: "bg-[#fef6e4] text-[#9a6b0f]",
  info: "bg-[#eaf2fd] text-[#1e5bb8]",
  stop: "bg-[#fdecec] text-[#b42318]",
  quiet: "bg-[#f1f2f4] text-[#5f6672]",
};
export const PARTNER_STATUS_STYLE: Record<PartnerStatus, string> = {
  PENDING_APPROVAL: TONE.wait,
  ACTIVE: TONE.live,
  SUSPENDED: TONE.stop,
  DEACTIVATED: TONE.quiet,
};
export const CAMPAIGN_STATUS_STYLE: Record<CampaignStatus, string> = {
  DRAFT: TONE.quiet,
  PENDING_REVIEW: TONE.wait,
  APPROVED: TONE.info,
  PUBLISHED: TONE.info,
  ACTIVE: TONE.live,
  COMPLETED: TONE.quiet,
  ARCHIVED: TONE.quiet,
  SUSPENDED: TONE.stop,
  CANCELLED: TONE.stop,
};

export const CAMPAIGN_TYPE_LABEL: Record<string, string> = {
  PUBLIC_GIVEAWAY: "Public giveaway",
  REFERRAL_COMPETITION: "Referral competition",
  REWARD: "Reward campaign",
  COMMUNITY_SUPPORT: "Community support",
  PROMOTIONAL: "Promotional",
  PARTNER_SPONSORED: "Partner-sponsored",
  CONTEST: "Contest",
};
export const CAMPAIGN_TYPE_HINT: Record<string, string> = {
  PUBLIC_GIVEAWAY: "Anyone eligible can ask; winners are drawn at random.",
  REFERRAL_COMPETITION: "Run on the partner's platform; the partner confirms the winner.",
  REWARD: "Rewards people who meet set eligibility rules.",
  COMMUNITY_SUPPORT: "Beneficiaries are assessed and chosen by hand.",
  PROMOTIONAL: "Rewards customers after a verified transaction, first come first served.",
  PARTNER_SPONSORED: "A partner funds items given through SwapConnect.",
  CONTEST: "Entries are scored; the highest scores win.",
};

export const PARTICIPATION_LABEL: Record<string, string> = {
  OPEN: "Open to anyone eligible",
  RESTRICTED: "Restricted to set criteria",
  INVITE_ONLY: "Invitation only",
  EXTERNAL: "Runs on the partner's platform",
};
export const ALLOCATION_LABEL: Record<string, string> = {
  MANUAL: "Manual selection",
  FIRST_COME: "First come, first served",
  RANDOM: "Random draw",
  SCORE: "Highest score",
  ELIGIBILITY: "Everyone eligible",
  PARTNER_CONFIRMED: "Partner confirms the winner",
  ADMIN_APPROVED: "SwapConnect approves each allocation",
};
export const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: "Public, listed on the campaigns page",
  UNLISTED: "Unlisted, reachable by link only",
  PRIVATE: "Private, not shown publicly",
};
export const REQUIRED_FIELD_LABEL: Record<string, string> = {
  phone: "Phone number",
  location: "Location",
  ageBand: "Age band",
  reason: "Reason for requesting",
  externalId: "Partner participant ID",
};
export const INTEGRATION_LABEL: Record<string, string> = {
  DIRECT_LINK: "Direct link",
  EMBED: "Embedded widget",
  API: "API",
};
export const MEMBER_ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

// Admin-side actions, in the order buttons show. `tone` picks the button style.
export const CAMPAIGN_ACTION_UI: Record<string, { label: string; tone: "primary" | "secondary" | "danger"; confirm: string }> = {
  approve: { label: "Approve", tone: "primary", confirm: "Approve this campaign? The owner can then publish it." },
  request_changes: { label: "Send back for changes", tone: "secondary", confirm: "Send this campaign back to draft so the owner can make changes." },
  submit: { label: "Submit for review", tone: "primary", confirm: "Submit this campaign for review." },
  publish: { label: "Publish", tone: "primary", confirm: "Publish this campaign. It becomes visible according to its visibility setting." },
  activate: { label: "Mark active", tone: "primary", confirm: "Mark this campaign as running." },
  complete: { label: "Mark completed", tone: "secondary", confirm: "Mark this campaign as finished." },
  resume: { label: "Resume", tone: "primary", confirm: "Resume this campaign where it was before it was suspended." },
  suspend: { label: "Suspend", tone: "danger", confirm: "Suspend this campaign. It stops being shown until resumed." },
  cancel: { label: "Cancel campaign", tone: "danger", confirm: "Cancel this campaign. This cannot be undone." },
  archive: { label: "Archive", tone: "secondary", confirm: "Archive this campaign." },
};

export const PARTNER_ACTION_UI: Record<string, { label: string; tone: "primary" | "secondary" | "danger"; from: PartnerStatus[]; reason: boolean }> = {
  approve: { label: "Approve partner", tone: "primary", from: ["PENDING_APPROVAL"], reason: false },
  reactivate: { label: "Reactivate", tone: "primary", from: ["SUSPENDED", "DEACTIVATED"], reason: false },
  suspend: { label: "Suspend", tone: "danger", from: ["ACTIVE"], reason: true },
  deactivate: { label: "Deactivate", tone: "danger", from: ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED"], reason: true },
};

export const ACTIVITY_LABEL: Record<string, string> = {
  created: "Created",
  updated: "Edited",
  approve: "Approved",
  suspend: "Suspended",
  reactivate: "Reactivated",
  deactivate: "Deactivated",
  member_added: "Team member added",
  member_role_changed: "Team member role changed",
  member_removed: "Team member removed",
  submit: "Submitted for review",
  request_changes: "Sent back for changes",
  publish: "Published",
  activate: "Marked active",
  complete: "Completed",
  archive: "Archived",
  resume: "Resumed",
  cancel: "Cancelled",
  item_added: "Prize added",
  item_removed: "Prize removed",
  entry_approve: "Entry accepted",
  entry_reject: "Entry rejected",
};

export function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// yyyy-mm-dd for <input type="date"> from an ISO timestamp.
export function toDateInput(iso?: string | null) {
  if (!iso) return "";
  // Campaign dates are saved as WAT (UTC+1) day bounds; read them back in
  // WAT or a start date shows as the day before.
  return new Date(new Date(iso).getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const BTN = {
  primary: "bg-[#037F44] text-white hover:bg-[#026835]",
  secondary: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  danger: "border border-[#f3c4c4] text-[#b42318] hover:bg-[#fdecec]",
};

export const CAMPAIGN_API = `${API_URL}/api/admin/campaign-integration`;

export async function api<T = unknown>(token: string | null, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CAMPAIGN_API}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || "Something went wrong. Try again.");
  return body?.data as T;
}

export interface Meta {
  campaignTypes: string[];
  participationModes: string[];
  allocationMethods: string[];
  visibilities: string[];
  requiredFieldKeys: string[];
  integrationTypes: string[];
  memberRoles: string[];
  typePresets: Record<string, { participationMode: string; requiresManualReview: boolean; allocationMethod: string }>;
  campaignActions: Record<string, { from: string[]; by: string[]; noteRequired: boolean }>;
}

export interface PartnerBrief {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  status: PartnerStatus;
}
