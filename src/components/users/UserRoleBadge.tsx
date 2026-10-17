const LABELS: Record<string, string> = {
  BUYER: "Buyer",
  STORE_OWNER: "Store Owner",
  STAFF: "Staff",
};

const STYLES: Record<string, string> = {
  BUYER: "bg-brand-emerald-light text-brand-emerald-hover",
  STORE_OWNER: "bg-brand-gold-light text-brand-gold-hover",
  STAFF: "bg-brand-obsidian-tint text-[#505050]",
};

export default function UserRoleBadge({ accountType }: { accountType?: string }) {
  const key = accountType || "BUYER";
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
        STYLES[key] || STYLES.BUYER
      }`}
    >
      {LABELS[key] || key}
    </span>
  );
}
