"use client";

import { useEffect } from "react";
import { AlertTriangle, ShieldAlert, Info, X } from "lucide-react";

type ConfirmVariant = "default" | "warning" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { icon: React.ReactNode; iconBg: string; confirmBg: string }
> = {
  default: {
    icon: <Info size={20} className="text-[#037f44]" />,
    iconBg: "bg-[#f0faf5]",
    confirmBg: "bg-[#037f44] hover:bg-[#026835]",
  },
  warning: {
    icon: <AlertTriangle size={20} className="text-[#a9791f]" />,
    iconBg: "bg-[#fef9ec]",
    confirmBg: "bg-[#a9791f] hover:bg-[#8f6519]",
  },
  danger: {
    icon: <ShieldAlert size={20} className="text-[#b91c1c]" />,
    iconBg: "bg-[#fef2f2]",
    confirmBg: "bg-[#b91c1c] hover:bg-[#991b1b]",
  },
};

// Shared, styled replacement for window.confirm() -- used anywhere an action
// (especially one that moves real money, like resolving a dispute) needs a
// deliberate second step before it happens. Same visual language as the rest
// of this app's polished pages (rounded-2xl panel, icon chip, brand palette).
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.15s_ease-out]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-[popIn_0.18s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <span className={`rounded-full p-2.5 ${styles.iconBg}`}>{styles.icon}</span>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#9ca3af] hover:text-[#353535] hover:bg-[#f3f4f6] rounded-lg p-1.5 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <h2 id="confirm-dialog-title" className="text-base font-bold text-[#353535] mb-1.5">
          {title}
        </h2>
        <div className="text-sm text-[#6b7280] leading-relaxed mb-6">{message}</div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-[#e5e7eb] text-[#353535] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#f8f9fb] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 ${styles.confirmBg}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.94) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ConfirmDialog;
