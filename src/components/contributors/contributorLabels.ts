// Label catalog for contributor enquiries. Keys mirror the backend
// whitelists in backend/src/services/contributor.js.

export type ContributionType = "GIVE" | "SPONSOR" | "PARTNER";
export type EntityType = "INDIVIDUAL" | "BUSINESS" | "NGO" | "INSTITUTION" | "OTHER";
export type EnquiryStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "CONTACTED"
  | "DISCUSSION_ONGOING"
  | "APPROVED"
  | "ACTIVE"
  | "COMPLETED"
  | "DECLINED"
  | "ARCHIVED";

export const TYPE_LABELS: Record<ContributionType, string> = {
  GIVE: "Device Donation",
  SPONSOR: "Sponsorship",
  PARTNER: "Partnership",
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  INDIVIDUAL: "Individual",
  BUSINESS: "Business / Company",
  NGO: "NGO / Foundation",
  INSTITUTION: "Institution / Government Agency",
  OTHER: "Other Organisation",
};

export const STATUSES: EnquiryStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "CONTACTED",
  "DISCUSSION_ONGOING",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "DECLINED",
  "ARCHIVED",
];

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  CONTACTED: "Contacted",
  DISCUSSION_ONGOING: "Discussion Ongoing",
  APPROVED: "Approved",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  ARCHIVED: "Archived",
};

export const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-800",
  CONTACTED: "bg-purple-50 text-purple-700",
  DISCUSSION_ONGOING: "bg-purple-50 text-purple-700",
  APPROVED: "bg-[#e6f9f0] text-[#037F44]",
  ACTIVE: "bg-[#e6f9f0] text-[#037F44]",
  COMPLETED: "bg-gray-100 text-gray-700",
  DECLINED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const dict = (pairs: [string, string][]) => Object.fromEntries(pairs) as Record<string, string>;

export const DETAIL_LABELS: Record<string, Record<string, string>> = {
  donationScope: dict([
    ["SINGLE", "A single device"],
    ["MULTIPLE", "Multiple devices"],
  ]),
  deviceCategories: dict([
    ["PHONES", "Phones"],
    ["LAPTOPS", "Laptops"],
    ["TABLETS", "Tablets"],
    ["ACCESSORIES", "Accessories"],
    ["AUDIO", "Audio"],
    ["SMARTWATCHES", "Smartwatches"],
    ["GAMING", "Gaming"],
    ["OTHER", "Other"],
  ]),
  deviceCondition: dict([
    ["WORKING", "Working"],
    ["MINOR_FAULTS", "Minor faults"],
    ["NOT_WORKING", "Not working"],
    ["MIXED", "Mixed"],
    ["UNKNOWN", "Not sure"],
  ]),
  acknowledgement: dict([
    ["ANONYMOUS", "Anonymous"],
    ["PUBLIC", "Publicly acknowledged"],
  ]),
  programmeInterests: dict([
    ["SPONSOR_INDIVIDUAL", "Sponsor an individual student or graduate"],
    ["SPONSOR_MULTIPLE", "Sponsor multiple students"],
    ["DEVICE_ACCESS", "Device-access programmes"],
    ["PORTABLE_POWER", "Portable power support"],
    ["CONNECTIVITY", "Internet connectivity support"],
    ["COMMUNITY_DEVICES", "Community device programmes"],
    ["OTHER", "Other impact initiatives"],
  ]),
  contributionType: dict([
    ["FUNDING", "Funding"],
    ["DEVICES", "Devices"],
    ["IN_KIND", "In-kind support"],
    ["MIXED", "A mix"],
    ["UNDECIDED", "Not sure yet"],
  ]),
  budgetRange: dict([
    ["UNDER_250K", "Under ₦250,000"],
    ["250K_1M", "₦250,000 – ₦1m"],
    ["1M_5M", "₦1m – ₦5m"],
    ["5M_20M", "₦5m – ₦20m"],
    ["OVER_20M", "Over ₦20m"],
    ["UNDISCLOSED", "Prefer not to say"],
  ]),
  partnershipInterests: dict([
    ["CORPORATE_DEVICE_RECOVERY", "Corporate device recovery"],
    ["UNIVERSITY_STUDENT", "University and student partnerships"],
    ["COMMUNITY_DEVELOPMENT", "Community development programmes"],
    ["REFURBISHMENT_REPAIR", "Device refurbishment and repair"],
    ["RECYCLING_MATERIAL_RECOVERY", "Recycling and material recovery"],
    ["CONNECTIVITY", "Internet connectivity"],
    ["PORTABLE_POWER", "Portable power solutions"],
    ["TECHNOLOGY_INFRASTRUCTURE", "Technology and infrastructure"],
    ["LOGISTICS_DISTRIBUTION", "Logistics and distribution"],
    ["INSTITUTIONAL_DEVELOPMENT", "Institutional and development partnerships"],
    ["OTHER", "Other"],
  ]),
};

export const DETAIL_FIELD_TITLES: Record<string, string> = {
  donationScope: "Donation",
  deviceCategories: "Device categories",
  approximateQuantity: "Approximate quantity",
  deviceCondition: "Condition",
  acknowledgement: "Acknowledgement",
  programmeInterests: "Programme interests",
  contributionType: "Proposed contribution",
  budgetRange: "Budget range",
  targetLocation: "Target location / community",
  peopleOrDevices: "People or devices",
  partnershipInterests: "Partnership interests",
  proposal: "Proposed collaboration",
  additionalInfo: "Additional information",
};

export function renderDetailValue(field: string, value: unknown): string {
  if (value == null || value === "") return "";
  const map = DETAIL_LABELS[field];
  if (Array.isArray(value)) return value.map((v) => map?.[String(v)] ?? String(v)).join(", ");
  if (map) return map[String(value)] ?? String(value);
  return String(value);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}
