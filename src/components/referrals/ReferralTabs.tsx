"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overview", href: "/dashboard/marketing/referrals" },
  { label: "Campaigns", href: "/dashboard/marketing/referrals/campaigns" },
  { label: "Referrals", href: "/dashboard/marketing/referrals/referrals" },
  { label: "Rewards", href: "/dashboard/marketing/referrals/rewards" },
];

export default function ReferralTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] mb-6 -mx-4 px-4 md:mx-0 md:px-0">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              active
                ? "border-brand-emerald text-brand-emerald"
                : "border-transparent text-[#6b7280] hover:text-[#353535]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
