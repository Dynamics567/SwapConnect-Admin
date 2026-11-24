// Test / Live marker for a payment: which Korapay/Paystack keys it ran on.
// Test payments moved no real money. Internal wallet movements show "—".
export default function EnvBadge({ env }: { env?: string | null }) {
  if (env === "live") {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-emerald-light text-brand-emerald whitespace-nowrap">
        Live
      </span>
    );
  }
  if (env === "test") {
    return (
      <span
        title="Made with test keys -- no real money moved"
        className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"
      >
        Test
      </span>
    );
  }
  return <span className="text-[11px] text-[#9ca3af]" title="Internal wallet movement">—</span>;
}
