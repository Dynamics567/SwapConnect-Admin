import { ProfileCompletion } from "./types";

interface ProfileCompletionIndicatorProps {
  profileCompletion?: ProfileCompletion;
  density?: "compact" | "comfortable";
}

export default function ProfileCompletionIndicator({
  profileCompletion,
  density = "compact",
}: ProfileCompletionIndicatorProps) {
  const pct = profileCompletion?.percentage ?? 0;
  const atFull = pct >= 100;
  const missing = profileCompletion?.requiredMissing ?? [];

  return (
    <div className={density === "comfortable" ? "w-full" : "w-28"}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-[#353535]">
          Profile: <span className="font-semibold">{pct}%</span>
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div
          className={`h-full rounded-full transition-all ${
            atFull ? "bg-brand-emerald" : "bg-brand-gold"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {density === "comfortable" && !atFull && missing.length > 0 && (
        <p className="text-[11px] text-[#848484] mt-1 truncate">
          Missing: {missing.join(", ")}
        </p>
      )}
    </div>
  );
}
