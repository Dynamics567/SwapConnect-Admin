// Shared formatting helpers for the Finance module -- matches the existing
// `₦${n.toLocaleString()}` convention already used in WalletContent.tsx.
export function fmtNaira(n: number | string | null | undefined) {
  const num = Number(n ?? 0);
  return Number.isFinite(num) ? `₦${num.toLocaleString()}` : "—";
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function fmtDateOnly(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export const STATUS_STYLES: Record<string, string> = {
  success: "bg-brand-emerald-light text-brand-emerald",
  completed: "bg-brand-emerald-light text-brand-emerald",
  released: "bg-brand-emerald-light text-brand-emerald",
  pending: "bg-brand-gold-light text-brand-gold-hover",
  held: "bg-brand-gold-light text-brand-gold-hover",
  underpaid: "bg-brand-gold-light text-brand-gold-hover",
  overpaid: "bg-brand-gold-light text-brand-gold-hover",
  requires_review: "bg-brand-gold-light text-brand-gold-hover",
  failed: "bg-red-50 text-red-700",
  abandoned: "bg-red-50 text-red-700",
  disputed: "bg-red-50 text-red-700",
  refunded: "bg-[#eef2ff] text-[#4338ca]",
};

export function statusBadgeClass(status: string | null | undefined) {
  return STATUS_STYLES[status || ""] || "bg-[#f3f4f6] text-[#6b7280]";
}
