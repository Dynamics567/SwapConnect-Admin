import { FormattedUserRow, User } from "./types";

export function formatDateJoined(dateJoined?: string): string {
  if (!dateJoined) return "N/A";
  const parsed = new Date(dateJoined);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatAmountSpent(amount: unknown): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function formatUserRow(
  user: User,
  opts: { canDirectUpgrade: boolean }
): FormattedUserRow {
  return {
    ...user,
    dateJoinedLabel: formatDateJoined(user.date_joined),
    amountSpentLabel: formatAmountSpent(user.amount_spent),
    canUpgrade: opts.canDirectUpgrade && user.accountType === "BUYER",
  };
}
