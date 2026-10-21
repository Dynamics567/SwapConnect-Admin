"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ToggleLeft, ToggleRight, Percent, Wallet, Info, CheckCircle2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useAuthContext } from "@/context/AuthContext";
import { API_URL } from "@/lib/config";

type FeeType = "PLATFORM_COMMISSION" | "WITHDRAWAL_FEE";

interface FeeSetting {
  id: number;
  feeType: FeeType;
  enabled: boolean;
  rate: number; // fraction, e.g. 0.05
  capEnabled: boolean;
  capAmount: number | null;
  minFeeEnabled: boolean;
  minFeeAmount: number | null;
  minWithdrawalAmount: number | null;
  currency: string;
  updatedByAdminName: string | null;
  updatedAt: string;
}

// Draft form state mirrors FeeSetting but keeps the rate as a human-entered
// percentage (5 meaning 5%) rather than the API's fraction (0.05) -- avoids
// re-deriving one from the other on every keystroke.
interface FeeDraft {
  enabled: boolean;
  ratePercent: string;
  capEnabled: boolean;
  capAmount: string;
  minFeeEnabled: boolean;
  minFeeAmount: string;
  minWithdrawalAmount: string;
}

function toDraft(setting: FeeSetting): FeeDraft {
  return {
    enabled: setting.enabled,
    ratePercent: String(round2(setting.rate * 100)),
    capEnabled: setting.capEnabled,
    capAmount: setting.capAmount != null ? String(setting.capAmount) : "",
    minFeeEnabled: setting.minFeeEnabled,
    minFeeAmount: setting.minFeeAmount != null ? String(setting.minFeeAmount) : "",
    minWithdrawalAmount: setting.minWithdrawalAmount != null ? String(setting.minWithdrawalAmount) : "",
  };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function fmtNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n);
}

/** Mirrors backend/src/services/feeMath.js's computeCommissionFromSetting exactly, for a live preview before saving. */
function previewCommission(listedAmount: number, draft: FeeDraft) {
  if (!draft.enabled) {
    return { buyerTotal: listedAmount, sellerPayout: listedAmount, platformCommission: 0 };
  }
  const rate = (Number(draft.ratePercent) || 0) / 100;
  const rawCombined = round2(listedAmount * rate * 2);
  const cap = draft.capEnabled ? Number(draft.capAmount) || 0 : null;
  const cappedCombined = cap != null ? Math.min(rawCombined, cap) : rawCombined;
  const half = round2(cappedCombined / 2);
  return {
    buyerTotal: round2(listedAmount + half),
    sellerPayout: round2(listedAmount - half),
    platformCommission: round2(cappedCombined),
  };
}

/** Mirrors backend/src/services/feeMath.js's computeWithdrawalFeeFromSetting exactly, for a live preview before saving. */
function previewWithdrawal(amount: number, draft: FeeDraft) {
  if (!draft.enabled) {
    return { feeAmount: 0, netPayout: amount };
  }
  const rate = (Number(draft.ratePercent) || 0) / 100;
  let fee = round2(amount * rate);
  if (draft.capEnabled && draft.capAmount) fee = Math.min(fee, Number(draft.capAmount));
  if (draft.minFeeEnabled && draft.minFeeAmount) fee = Math.max(fee, Number(draft.minFeeAmount));
  fee = round2(Math.max(fee, 0));
  return { feeAmount: fee, netPayout: round2(amount - fee) };
}

function Toggle({ on, onChange, disabled, labelOn = "Enabled", labelOff = "Disabled" }: {
  on: boolean; onChange: () => void; disabled?: boolean; labelOn?: string; labelOff?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        on ? "text-brand-emerald hover:text-brand-emerald-hover" : "text-[#9ca3af] hover:text-[#6b7280]"
      }`}
    >
      {on ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
      {on ? labelOn : labelOff}
    </button>
  );
}

function NumberField({ label, value, onChange, disabled, suffix, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; suffix?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#6b7280] block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#353535] focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald disabled:bg-[#f8f9fb] disabled:text-[#9ca3af]"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9ca3af]">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function FeeCard({
  icon, title, description, setting, draft, setDraft, readOnly, exampleAmount, previewLines, onSave, saving,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  setting: FeeSetting;
  draft: FeeDraft;
  setDraft: (d: FeeDraft) => void;
  readOnly: boolean;
  exampleAmount: number;
  previewLines: { label: string; value: string; emphasis?: boolean }[];
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="rounded-full p-2.5 bg-brand-emerald-light text-brand-emerald shrink-0">{icon}</span>
        <div>
          <h2 className="text-base font-bold text-[#353535]">{title}</h2>
          <p className="text-xs text-[#6b7280] mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#f3f4f6]">
        <span className="text-sm font-medium text-[#353535]">Status</span>
        <Toggle on={draft.enabled} onChange={() => setDraft({ ...draft, enabled: !draft.enabled })} disabled={readOnly} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <NumberField
          label="Rate"
          value={draft.ratePercent}
          onChange={(v) => setDraft({ ...draft, ratePercent: v })}
          disabled={readOnly || !draft.enabled}
          suffix="%"
        />
        <div>
          <label className="text-xs font-medium text-[#6b7280] block mb-1">Cap</label>
          <Toggle
            on={draft.capEnabled}
            onChange={() => setDraft({ ...draft, capEnabled: !draft.capEnabled })}
            disabled={readOnly || !draft.enabled}
            labelOn="Capped"
            labelOff="No cap"
          />
        </div>
      </div>

      {draft.capEnabled && (
        <div className="mb-4">
          <NumberField
            label="Maximum fee (₦)"
            value={draft.capAmount}
            onChange={(v) => setDraft({ ...draft, capAmount: v })}
            disabled={readOnly || !draft.enabled}
            placeholder="e.g. 10000"
          />
        </div>
      )}

      {setting.feeType === "WITHDRAWAL_FEE" && (
        <div className="mb-4">
          <NumberField
            label="Minimum withdrawal amount (₦, optional)"
            value={draft.minWithdrawalAmount}
            onChange={(v) => setDraft({ ...draft, minWithdrawalAmount: v })}
            disabled={readOnly}
            placeholder="No minimum"
          />
        </div>
      )}

      {/* Live preview */}
      <div className="bg-[#f8f9fb] rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
          Preview on {fmtNaira(exampleAmount)}
        </p>
        <div className="space-y-1.5">
          {previewLines.map((line) => (
            <div key={line.label} className="flex justify-between text-sm">
              <span className="text-[#6b7280]">{line.label}</span>
              <span className={line.emphasis ? "font-bold text-brand-emerald" : "font-medium text-[#353535]"}>
                {line.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9ca3af]">
          {setting.updatedByAdminName
            ? `Last updated by ${setting.updatedByAdminName} on ${new Date(setting.updatedAt).toLocaleString()}`
            : `Last updated ${new Date(setting.updatedAt).toLocaleString()}`}
        </p>
        {!readOnly && (
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-brand-emerald hover:bg-brand-emerald-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentsFeesContent() {
  const token = useAuthToken();
  const { role } = useAuthContext();
  const canEdit = role === "superadmin";

  const [settings, setSettings] = useState<Record<FeeType, FeeSetting> | null>(null);
  const [drafts, setDrafts] = useState<Record<FeeType, FeeDraft> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<FeeType | null>(null);
  const [confirmType, setConfirmType] = useState<FeeType | null>(null);
  const [exampleAmount, setExampleAmount] = useState("100000");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/fees`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load fee settings");
      const list: FeeSetting[] = data.data.settings;
      const byType = Object.fromEntries(list.map((s) => [s.feeType, s])) as Record<FeeType, FeeSetting>;
      setSettings(byType);
      setDrafts({
        PLATFORM_COMMISSION: toDraft(byType.PLATFORM_COMMISSION),
        WITHDRAWAL_FEE: toDraft(byType.WITHDRAWAL_FEE),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (feeType: FeeType) => {
    if (!drafts || !token) return;
    const draft = drafts[feeType];
    setSavingType(feeType);
    try {
      const payload = {
        enabled: draft.enabled,
        rate: round2(Number(draft.ratePercent) || 0) / 100,
        capEnabled: draft.capEnabled,
        capAmount: draft.capEnabled ? Number(draft.capAmount) || 0 : null,
        minFeeEnabled: draft.minFeeEnabled,
        minFeeAmount: draft.minFeeEnabled ? Number(draft.minFeeAmount) || 0 : null,
        ...(feeType === "WITHDRAWAL_FEE"
          ? { minWithdrawalAmount: draft.minWithdrawalAmount ? Number(draft.minWithdrawalAmount) : null }
          : {}),
      };
      const res = await fetch(`${API_URL}/api/admin/fees/${feeType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save fee setting");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingType(null);
      setConfirmType(null);
    }
  };

  const exampleNum = Number(exampleAmount) || 0;

  const commissionPreview = useMemo(
    () => (drafts ? previewCommission(exampleNum, drafts.PLATFORM_COMMISSION) : null),
    [drafts, exampleNum]
  );
  const withdrawalPreview = useMemo(
    () => (drafts ? previewWithdrawal(exampleNum, drafts.WITHDRAWAL_FEE) : null),
    [drafts, exampleNum]
  );

  if (loading) {
    return <div className="text-sm text-[#6b7280] p-6">Loading fee settings…</div>;
  }
  if (error && !settings) {
    return <div className="text-sm text-red-600 p-6">{error}</div>;
  }
  if (!settings || !drafts || !commissionPreview || !withdrawalPreview) return null;

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div>
        <h1 className="text-xl font-bold text-[#353535]">Payments & Fees</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Configure SwapConnect&apos;s platform commission and seller withdrawal fee. Changes apply to new
          orders and withdrawals going forward only -- past transactions keep the fee that was in effect when
          they were created.
        </p>
      </div>

      {!canEdit && (
        <div className="flex items-start gap-2.5 bg-brand-gold-light border border-brand-gold/30 rounded-xl p-4">
          <Info size={16} className="text-brand-gold-hover shrink-0 mt-0.5" />
          <p className="text-sm text-[#6b7280]">
            You can view the current fee configuration, but only a Super Admin can change it.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>
      )}

      <div className="max-w-xs">
        <NumberField
          label="Example amount for the preview below (₦)"
          value={exampleAmount}
          onChange={setExampleAmount}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FeeCard
          icon={<Percent size={18} />}
          title="Platform Commission"
          description="Charged on every sale -- split as a buyer-side premium and a matching seller-side deduction."
          setting={settings.PLATFORM_COMMISSION}
          draft={drafts.PLATFORM_COMMISSION}
          setDraft={(d) => setDrafts({ ...drafts, PLATFORM_COMMISSION: d })}
          readOnly={!canEdit}
          exampleAmount={exampleNum}
          onSave={() => setConfirmType("PLATFORM_COMMISSION")}
          saving={savingType === "PLATFORM_COMMISSION"}
          previewLines={[
            { label: "Listed price", value: fmtNaira(exampleNum) },
            { label: "Buyer pays", value: fmtNaira(commissionPreview.buyerTotal) },
            { label: "Seller receives", value: fmtNaira(commissionPreview.sellerPayout) },
            { label: "Platform commission", value: fmtNaira(commissionPreview.platformCommission), emphasis: true },
          ]}
        />

        <FeeCard
          icon={<Wallet size={18} />}
          title="Seller Withdrawal Fee"
          description="Charged when a seller withdraws their wallet balance to their bank account."
          setting={settings.WITHDRAWAL_FEE}
          draft={drafts.WITHDRAWAL_FEE}
          setDraft={(d) => setDrafts({ ...drafts, WITHDRAWAL_FEE: d })}
          readOnly={!canEdit}
          exampleAmount={exampleNum}
          onSave={() => setConfirmType("WITHDRAWAL_FEE")}
          saving={savingType === "WITHDRAWAL_FEE"}
          previewLines={[
            { label: "Requested withdrawal", value: fmtNaira(exampleNum) },
            { label: "Withdrawal fee", value: fmtNaira(withdrawalPreview.feeAmount) },
            { label: "Seller receives", value: fmtNaira(withdrawalPreview.netPayout), emphasis: true },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmType !== null}
        title={`Update ${confirmType === "PLATFORM_COMMISSION" ? "platform commission" : "withdrawal fee"}?`}
        message={
          <>
            This changes real fee calculations for every new{" "}
            {confirmType === "PLATFORM_COMMISSION" ? "order" : "withdrawal"} from now on. Transactions already
            placed keep the fee that was in effect when they were created.
          </>
        }
        confirmLabel="Save changes"
        variant="warning"
        loading={savingType !== null}
        onConfirm={() => confirmType && handleSave(confirmType)}
        onClose={() => setConfirmType(null)}
      />
    </div>
  );
}

export default function PaymentsFeesPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <PaymentsFeesContent />
    </ProtectedRoute>
  );
}
